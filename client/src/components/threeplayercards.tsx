import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { type PlayerCardWithPlayer } from "../../../shared/schema";

type Rarity = "common" | "rare" | "unique" | "legendary";

function toRarity(v: any): Rarity {
  const r = String(v ?? "common").toLowerCase();
  if (r === "legendary") return "legendary";
  if (r === "unique") return "unique";
  if (r === "rare") return "rare";
  return "common";
}

function rarityPalette(r: Rarity) {
  if (r === "legendary") return { metal: "#d4af37", a: "#fff2b3", b: "#f59e0b", glow: "#ffd26a" };
  if (r === "unique") return { metal: "#6d28d9", a: "#c4b5fd", b: "#22d3ee", glow: "#a78bfa" };
  if (r === "rare") return { metal: "#dc2626", a: "#fecaca", b: "#fb7185", glow: "#fb7185" };
  return { metal: "#c0c0c0", a: "#f5f5f5", b: "#94a3b8", glow: "#cbd5e1" };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ✅ Dynamic rarity pattern (no files)
function drawRarityPattern(ctx: CanvasRenderingContext2D, w: number, h: number, rarity: Rarity) {
  const p = rarityPalette(rarity);

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, p.a);
  g.addColorStop(1, p.b);

  ctx.globalAlpha = rarity === "common" ? 0.22 : 0.30;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;

  // shards
  const count = rarity === "unique" ? 170 : rarity === "legendary" ? 150 : 130;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const s = 60 + Math.random() * 160;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s, y + Math.random() * 50);
    ctx.lineTo(x + Math.random() * 50, y + s);
    ctx.closePath();

    ctx.fillStyle = `rgba(255,255,255,${Math.random() * (rarity === "unique" ? 0.11 : 0.07)})`;
    ctx.fill();
  }

  // diagonal foil lines
  ctx.globalAlpha = rarity === "unique" ? 0.16 : 0.10;
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  for (let i = -h; i < w; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

async function buildFaceTexture(opts: {
  rarity: Rarity;
  photoUrl?: string | null;
  clubLogoUrl?: string | null;
  playerName: string;
  clubName?: string;
  position?: string;
  serialNumber: number;
  maxSupply: number;
}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d")!;

  // base
  ctx.fillStyle = "#070a10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // rarity pattern
  drawRarityPattern(ctx, canvas.width, canvas.height, opts.rarity);

  // vignette
  const vig = ctx.createRadialGradient(512, 580, 250, 512, 920, 980);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const pal = rarityPalette(opts.rarity);

  // top bar
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = pal.metal;
  ctx.fillRect(0, 0, canvas.width, 150);
  ctx.globalAlpha = 1;

  // rarity label
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = "#0b0f1a";
  drawRoundedRect(ctx, canvas.width - 300, 28, 260, 72, 18);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.font = "900 34px Arial";
  ctx.textAlign = "right";
  ctx.fillText(opts.rarity.toUpperCase(), canvas.width - 60, 76);
  ctx.textAlign = "left";

  // photo frame
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = pal.a;
  drawRoundedRect(ctx, 70, 190, 884, 720, 28);
  ctx.fill();
  ctx.globalAlpha = 1;

  // photo
  if (opts.photoUrl) {
    try {
      const img = await loadImage(opts.photoUrl);
      const box = { x: 70, y: 190, w: 884, h: 720 };
      const r = Math.max(box.w / img.width, box.h / img.height);
      const nw = img.width * r;
      const nh = img.height * r;
      const nx = box.x + (box.w - nw) / 2;
      const ny = box.y + (box.h - nh) / 2;

      ctx.save();
      drawRoundedRect(ctx, 70, 190, 884, 720, 28);
      ctx.clip();
      ctx.drawImage(img, nx, ny, nw, nh);

      const fade = ctx.createLinearGradient(0, 740, 0, 920);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = fade;
      ctx.fillRect(70, 720, 884, 190);

      ctx.restore();
    } catch {}
  }

  // club logo
  if (opts.clubLogoUrl) {
    try {
      const logo = await loadImage(opts.clubLogoUrl);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(logo, 870, 210, 72, 72);
      ctx.globalAlpha = 1;
    } catch {}
  }

  // name block
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#0b0f1a";
  drawRoundedRect(ctx, 70, 930, 884, 170, 26);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "900 62px Arial";
  ctx.fillText(String(opts.playerName ?? "PLAYER").toUpperCase(), 95, 1010);

  ctx.fillStyle = pal.a;
  ctx.font = "800 36px Arial";
  const line2 = `${String(opts.position ?? "").toUpperCase()}${opts.clubName ? " • " + String(opts.clubName).toUpperCase() : ""}`.trim();
  ctx.fillText(line2, 95, 1065);

  // serial
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "900 40px Arial";
  ctx.fillText(`${opts.serialNumber}/${opts.maxSupply}`, 930, 1065);
  ctx.textAlign = "left";

  // engraved stats panel
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "#0b0f1a";
  drawRoundedRect(ctx, 70, 1140, 884, 300, 26);
  ctx.fill();
  ctx.globalAlpha = 1;

  // engraving lines
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let y = 1160; y < 1430; y += 16) {
    ctx.beginPath();
    ctx.moveTo(90, y);
    ctx.lineTo(934, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // engraved borders
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, 78, 1148, 868, 284, 22);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 6;
  drawRoundedRect(ctx, 84, 1154, 856, 272, 20);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "900 44px Arial";
  ctx.fillText("STATS", 95, 1210);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 34px Arial";
  ctx.fillText("Engraved style panel", 95, 1270);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

async function buildBackTexture(opts: { rarity: Rarity; serialNumber: number; maxSupply: number }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#070a10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawRarityPattern(ctx, canvas.width, canvas.height, opts.rarity);

  // dark wash
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  // center badge
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#fff";
  drawRoundedRect(ctx, 190, 610, 644, 320, 44);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#fff";
  ctx.font = "900 66px Arial";
  ctx.textAlign = "center";
  ctx.fillText("FANTASY ARENA", 512, 745);

  ctx.globalAlpha = 0.85;
  ctx.font = "900 44px Arial";
  ctx.fillText(`${opts.rarity.toUpperCase()} • ${opts.serialNumber}/${opts.maxSupply}`, 512, 820);
  ctx.globalAlpha = 1;

  ctx.textAlign = "left";

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// ✅ Rainbow foil shader
function FoilMaterial({ strength = 0.18 }: { strength?: number }) {
  const ref = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: strength },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uStrength;

        vec3 hsv2rgb(vec3 c){
          vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          float t = uTime * 0.35;
          float sweep = smoothstep(0.0, 1.0, fract(vUv.x + vUv.y*0.35 + t));
          float band = exp(-pow((sweep-0.55)*7.0, 2.0));
          float hue = fract(vUv.x*0.9 + vUv.y*0.6 + t*0.35);
          vec3 rainbow = hsv2rgb(vec3(hue, 0.85, 1.0));
          float alpha = band * uStrength;
          gl_FragColor = vec4(rainbow, alpha);
        }
      `,
    });
  }, [strength]);

  return <primitive ref={ref} object={mat} attach="material" />;
}

// ✅ Shine sweep
function ShineMaterial({ strength = 0.22 }: { strength?: number }) {
  const ref = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uStrength: { value: strength },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uStrength;

        void main() {
          float t = uTime * 0.55;
          float x = fract(vUv.x + t);
          float band = exp(-pow((x-0.55)*10.0, 2.0));
          float alpha = band * uStrength;
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
        }
      `,
    });
  }, [strength]);

  return <primitive ref={ref} object={mat} attach="material" />;
}

// ✅ Brushed metal edge “grain” shader
function EdgeBrushedMaterial({ color = "#999999" }: { color?: string }) {
  const ref = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const mat = useMemo(() => {
    const c = new THREE.Color(color);
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(c.r, c.g, c.b) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;

        float noise(vec2 p){
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main(){
          // brushed: strong horizontal grain
          float n = noise(vec2(vUv.y * 180.0, uTime * 0.2));
          float grain = smoothstep(0.2, 0.9, n);
          float sheen = 0.55 + grain * 0.35;

          gl_FragColor = vec4(uColor * sheen, 1.0);
        }
      `,
    });
  }, [color]);

  return <primitive ref={ref} object={mat} attach="material" />;
}

function Scene({ card, imageUrl }: { card: PlayerCardWithPlayer; imageUrl?: string | null }) {
  const player: any = (card as any)?.player ?? {};
  const rarity = toRarity((card as any)?.rarity);
  const pal = rarityPalette(rarity);

  const serialNumber = (card as any)?.serialNumber ?? (card as any)?.serial_number ?? 1;
  const maxSupply = (card as any)?.maxSupply ?? (card as any)?.max_supply ?? 100;

  const clubLogoUrl = player.clubLogo || player.club_logo || player.teamLogo || player.team_logo || null;
  const clubName = player.club || player.team || "";

  const [faceTex, setFaceTex] = useState<THREE.Texture | null>(null);
  const [backTex, setBackTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const tex = await buildFaceTexture({
        rarity,
        photoUrl: imageUrl ?? player.photo ?? player.photoUrl ?? player.imageUrl ?? player.image_url ?? null,
        clubLogoUrl,
        playerName: player.name ?? "PLAYER",
        clubName,
        position: player.position ?? "",
        serialNumber,
        maxSupply,
      });
      const b = await buildBackTexture({ rarity, serialNumber, maxSupply });

      if (!alive) return;
      setFaceTex(tex);
      setBackTex(b);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rarity, imageUrl, player?.name, player?.position, clubLogoUrl, clubName, serialNumber, maxSupply]);

  // card shape
  const cardShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = 2, h = 3, r = 0.22;
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return shape;
  }, []);

  // Premium thickness
  const depth = 0.28;

  // metal material for front/back base
  const baseMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: pal.metal,
      metalness: 1,
      roughness: rarity === "common" ? 0.34 : 0.22,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      reflectivity: 1,
      emissive: rarity === "legendary" ? new THREE.Color("#7c5c12") : new THREE.Color("#000000"),
      emissiveIntensity: rarity === "legendary" ? 0.25 : 0,
    });
  }, [pal.metal, rarity]);

  // Rim glow (legendary/unique)
  const rimRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (rimRef.current) {
      const m = rimRef.current.material as THREE.MeshBasicMaterial;
      if (rarity === "legendary") m.opacity = 0.08 + Math.sin(t * 1.2) * 0.02;
      else if (rarity === "unique") m.opacity = 0.07 + Math.sin(t * 1.6) * 0.03;
      else m.opacity = 0.0;
    }
  });

  // showroom motion (no zoom)
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const baseX = THREE.MathUtils.degToRad(-5);
    const baseY = THREE.MathUtils.degToRad(12);
    g.rotation.x = baseX + Math.sin(t * 0.6) * THREE.MathUtils.degToRad(1.2);
    g.rotation.y = baseY + Math.sin(t * 0.45) * THREE.MathUtils.degToRad(2.0);
    g.rotation.z = Math.sin(t * 0.35) * THREE.MathUtils.degToRad(0.6);
  });

  const foilStrength =
    rarity === "unique" ? 0.38 : rarity === "legendary" ? 0.26 : rarity === "rare" ? 0.18 : 0.12;
  const shineStrength =
    rarity === "legendary" ? 0.30 : rarity === "unique" ? 0.24 : rarity === "rare" ? 0.19 : 0.14;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      <Environment preset="city" />
      <ambientLight intensity={0.8} />
      <spotLight position={[10, 12, 10]} angle={0.22} penumbra={1} intensity={1.7} castShadow />
      <directionalLight position={[-6, 4, 6]} intensity={0.7} />

      <group ref={groupRef}>
        {/* Main body (thick + bevel) */}
        <mesh castShadow receiveShadow>
          <extrudeGeometry
            args={[
              cardShape,
              {
                depth,
                bevelEnabled: true,
                bevelThickness: 0.08,
                bevelSize: 0.08,
                bevelSegments: 4,
              },
            ]}
          />
          <primitive object={baseMat} attach="material" />
        </mesh>

        {/* Brushed edge overlay (thin shell) */}
        <mesh position={[0, 0, 0.001]}>
          <extrudeGeometry
            args={[
              cardShape,
              {
                depth: depth + 0.001,
                bevelEnabled: true,
                bevelThickness: 0.08,
                bevelSize: 0.08,
                bevelSegments: 4,
              },
            ]}
          />
          <EdgeBrushedMaterial color={pal.metal} />
        </mesh>

        {/* Front face */}
        <mesh position={[0, 0, depth / 2 + 0.06]}>
          <planeGeometry args={[1.82, 2.72]} />
          <meshStandardMaterial map={faceTex ?? undefined} color={"#ffffff"} roughness={0.92} metalness={0.0} />
        </mesh>

        {/* Shine */}
        <mesh position={[0, 0, depth / 2 + 0.07]}>
          <planeGeometry args={[1.84, 2.74]} />
          <ShineMaterial strength={shineStrength} />
        </mesh>

        {/* Rainbow foil */}
        <mesh position={[0, 0, depth / 2 + 0.075]}>
          <planeGeometry args={[1.86, 2.76]} />
          <FoilMaterial strength={foilStrength} />
        </mesh>

        {/* Back face (reflective style) */}
        <mesh position={[0, 0, -(depth / 2 + 0.06)]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.82, 2.72]} />
          <meshStandardMaterial map={backTex ?? undefined} color={"#ffffff"} roughness={0.85} metalness={0.0} />
        </mesh>

        {/* Rim glow plane */}
        <mesh ref={rimRef} position={[0, 0, depth / 2 + 0.09]}>
          <planeGeometry args={[1.95, 2.9]} />
          <meshBasicMaterial
            color={rarity === "legendary" ? pal.glow : rarity === "unique" ? pal.glow : "#000000"}
            transparent
            opacity={rarity === "legendary" || rarity === "unique" ? 0.08 : 0}
          />
        </mesh>
      </group>

      <ContactShadows position={[0, -2.25, 0]} opacity={0.45} scale={10} blur={2.8} far={4} />
    </>
  );
}

export default function ThreeDPlayerCard({ card, imageUrl }: { card: PlayerCardWithPlayer; imageUrl?: string | null }) {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Scene card={card} imageUrl={imageUrl} />
      </Canvas>
    </div>
  );
}

// ✅ keep this export for premier-league page builds
export const eplPlayerToCard = (player: any) => {
  return {
    id: player.id,
    rarity: "common",
    serialNumber: 1,
    maxSupply: 100,
    player: {
      name: player.name,
      position: player.position,
      club: player.team ?? player.club ?? "",
      photo: player.photo ?? player.photoUrl ?? player.imageUrl ?? player.image_url ?? null,
      clubLogo: player.clubLogo ?? player.club_logo ?? player.teamLogo ?? player.team_logo ?? null,
      stats: player.stats ?? undefined,
    },
  };
};
