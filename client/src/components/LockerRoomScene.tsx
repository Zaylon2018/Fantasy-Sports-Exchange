import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type LockerRoomSceneProps = {
  active: boolean;
};

function ThreeLockerRoom({ drift, reducedMotion }: { drift: { x: number; y: number }; reducedMotion: boolean }) {
  const backWallRef = useRef<THREE.Mesh>(null);
  const beamARef = useRef<THREE.Mesh>(null);
  const beamBRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const data = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i += 1) {
      data[i * 3] = (Math.random() - 0.5) * 12;
      data[i * 3 + 1] = Math.random() * 6 - 2;
      data[i * 3 + 2] = -Math.random() * 8;
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const idleX = reducedMotion ? 0 : Math.sin(t * 0.16) * 0.18;
    const idleY = reducedMotion ? 0 : Math.cos(t * 0.11) * 0.12;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, idleX + drift.x * 0.22, 0.06);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 1.25 + idleY + drift.y * 0.16, 0.06);
    state.camera.lookAt(0, 0.6, -3.5);

    if (beamARef.current) {
      beamARef.current.position.x = Math.sin(t * 0.33) * 2.6;
      const mat = beamARef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 0.9) * 0.02;
    }

    if (beamBRef.current) {
      beamBRef.current.position.x = Math.cos(t * 0.28) * -2.3;
      const mat = beamBRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.07 + Math.cos(t * 1.1) * 0.02;
    }

    if (backWallRef.current) {
      backWallRef.current.rotation.y = Math.sin(t * 0.07) * 0.01;
    }

    if (dustRef.current && !reducedMotion) {
      const arr = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += delta * 0.12;
        arr[i] += Math.sin(t * 0.4 + i) * 0.0007;
        if (arr[i + 1] > 4.2) {
          arr[i + 1] = -2;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#070b14", 3.5, 14]} />
      <ambientLight intensity={0.45} color="#8fa6c9" />
      <pointLight position={[0, 3.2, -3]} intensity={1.3} color="#e2e8f0" distance={12} />
      <pointLight position={[0, -0.8, -1.5]} intensity={0.45} color="#7dd3fc" distance={5} />

      <mesh ref={backWallRef} position={[0, 1, -5.2]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#0a1020" roughness={0.88} metalness={0.07} />
      </mesh>

      <mesh position={[0, -1.4, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color="#0a1222" roughness={0.9} metalness={0.12} />
      </mesh>

      <mesh ref={beamARef} position={[0, 1.3, -3.8]} rotation={[0, 0, -0.2]}>
        <planeGeometry args={[1.3, 7]} />
        <meshBasicMaterial color="#dbeafe" transparent opacity={0.09} blending={THREE.AdditiveBlending} />
      </mesh>

      <mesh ref={beamBRef} position={[0, 1.1, -4.4]} rotation={[0, 0, 0.25]}>
        <planeGeometry args={[1.1, 6.5]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>

      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            itemSize={3}
            array={particlePositions}
          />
        </bufferGeometry>
        <pointsMaterial color="#cbd5e1" size={0.03} opacity={0.22} transparent depthWrite={false} />
      </points>
    </>
  );
}

function CssParallaxScene({ drift, reducedMotion }: { drift: { x: number; y: number }; reducedMotion: boolean }) {
  const idleX = reducedMotion ? 0 : Math.sin(Date.now() * 0.0002) * 6;
  const idleY = reducedMotion ? 0 : Math.cos(Date.now() * 0.00017) * 4;
  const x = drift.x * 12 + idleX;
  const y = drift.y * 9 + idleY;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-[-8%]"
        style={{
          transform: `translate3d(${x * 0.25}px, ${y * 0.2}px, 0)`,
          background:
            "radial-gradient(circle at 50% 12%, rgba(255,255,255,0.12), transparent 35%), linear-gradient(180deg, #060a12 0%, #070d18 50%, #090f1c 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${x * 0.42}px, ${y * 0.36}px, 0)`,
          background:
            "linear-gradient(90deg, transparent 15%, rgba(203,213,225,0.06) 30%, transparent 45%), linear-gradient(-90deg, transparent 12%, rgba(125,211,252,0.06) 28%, transparent 42%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${x * 0.6}px, ${y * 0.54}px, 0)`,
          background:
            "radial-gradient(circle at 50% 130%, rgba(148,163,184,0.24), transparent 56%), radial-gradient(circle at 22% 30%, rgba(226,232,240,0.08), transparent 24%), radial-gradient(circle at 75% 25%, rgba(186,230,253,0.08), transparent 22%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.38)_100%)]" />
    </div>
  );
}

export default function LockerRoomScene({ active }: LockerRoomSceneProps) {
  const [drift, setDrift] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPerf, setLowPerf] = useState(false);
  const targetRef = useRef({ x: 0, y: 0 });
  const reducedRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePref = () => {
      reducedRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    updatePref();
    media.addEventListener("change", updatePref);

    const pointerHandler = (e: PointerEvent) => {
      targetRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      targetRef.current.y = (e.clientY / window.innerHeight - 0.5) * -2;
    };

    const orientationHandler = (e: DeviceOrientationEvent) => {
      const gamma = Math.max(-25, Math.min(25, e.gamma || 0));
      const beta = Math.max(-25, Math.min(25, e.beta || 0));
      targetRef.current.x = gamma / 25;
      targetRef.current.y = -beta / 40;
    };

    window.addEventListener("pointermove", pointerHandler);
    window.addEventListener("deviceorientation", orientationHandler);

    let raf = 0;
    const animateDrift = () => {
      setDrift((prev) => {
        const tx = reducedRef.current ? 0 : targetRef.current.x;
        const ty = reducedRef.current ? 0 : targetRef.current.y;
        const nextX = prev.x + (tx - prev.x) * 0.05;
        const nextY = prev.y + (ty - prev.y) * 0.05;
        if (Math.abs(nextX - prev.x) < 0.0005 && Math.abs(nextY - prev.y) < 0.0005) {
          return prev;
        }
        return { x: nextX, y: nextY };
      });
      raf = requestAnimationFrame(animateDrift);
    };
    raf = requestAnimationFrame(animateDrift);

    let fpsFrames = 0;
    let start = performance.now();
    let fpsRaf = 0;
    const sampleFps = () => {
      fpsFrames += 1;
      const now = performance.now();
      if (now - start > 1700) {
        const fps = (fpsFrames * 1000) / (now - start);
        setLowPerf(fps < 45);
        return;
      }
      fpsRaf = requestAnimationFrame(sampleFps);
    };
    fpsRaf = requestAnimationFrame(sampleFps);

    return () => {
      media.removeEventListener("change", updatePref);
      window.removeEventListener("pointermove", pointerHandler);
      window.removeEventListener("deviceorientation", orientationHandler);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(fpsRaf);
    };
  }, [active]);

  if (!active) return null;

  const fallbackMode = reducedMotion || lowPerf;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {fallbackMode ? (
        <CssParallaxScene drift={drift} reducedMotion={reducedMotion} />
      ) : (
        <Canvas camera={{ position: [0, 1.2, 4.6], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
          <ThreeLockerRoom drift={drift} reducedMotion={reducedMotion} />
        </Canvas>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_32%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(125,211,252,0.09),transparent_55%)]" />
    </div>
  );
}
