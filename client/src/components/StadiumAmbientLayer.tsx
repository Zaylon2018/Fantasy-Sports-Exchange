import { useEffect, useRef, useState } from "react";

type StadiumAmbientLayerProps = {
  teamName: string;
};

export default function StadiumAmbientLayer({ teamName }: StadiumAmbientLayerProps) {
  const [flash, setFlash] = useState(false);
  const audioEnabled = true;
  const crowdAudioRef = useRef<HTMLAudioElement | null>(null);
  const windAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    crowdAudioRef.current = new Audio("/sfx/crowd_cheer.mp3");
    windAudioRef.current = new Audio("/sfx/wind.mp3");

    const crowd = crowdAudioRef.current;
    const wind = windAudioRef.current;

    crowd.loop = true;
    wind.loop = true;
    crowd.volume = 0.1;
    wind.volume = 0.05;

    const tryPlay = () => {
      if (!audioEnabled) return;
      crowd.play().catch(() => undefined);
      wind.play().catch(() => undefined);
    };

    const startOnGesture = () => {
      tryPlay();
      window.removeEventListener("pointerdown", startOnGesture);
    };

    window.addEventListener("pointerdown", startOnGesture);
    tryPlay();

    return () => {
      window.removeEventListener("pointerdown", startOnGesture);
      crowd.pause();
      wind.pause();
    };
  }, [audioEnabled]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 180);
    }, 10000 + Math.random() * 7000);

    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.95)), url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          opacity: 0.45,
        }}
      />

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-full w-56 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[stadium-beam_16s_linear_infinite]" />
        <div className="absolute -right-24 top-0 h-full w-56 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-[stadium-beam-reverse_20s_linear_infinite]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/20 to-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/40 to-transparent animate-[fog-drift_18s_ease-in-out_infinite]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(148,163,184,0.22),transparent_60%)]" />
      </div>

      {flash && <div className="absolute inset-0 z-0 pointer-events-none bg-white/10 animate-pulse" />}

      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-center"
        style={{ opacity: 0.08 }}
      >
        <div
          style={{
            fontSize: "clamp(3rem, 12vw, 10rem)",
            fontWeight: 900,
            color: "white",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            lineHeight: 1,
            textShadow: "0 0 60px rgba(255,255,255,0.5)",
          }}
        >
          {teamName}
        </div>
      </div>

      <style>{`
        @keyframes stadium-beam {
          0% { transform: translateX(-140%) rotate(-6deg); opacity: 0.14; }
          50% { opacity: 0.28; }
          100% { transform: translateX(140%) rotate(-4deg); opacity: 0.1; }
        }
        @keyframes stadium-beam-reverse {
          0% { transform: translateX(140%) rotate(6deg); opacity: 0.12; }
          50% { opacity: 0.24; }
          100% { transform: translateX(-140%) rotate(4deg); opacity: 0.1; }
        }
        @keyframes fog-drift {
          0% { transform: translateX(-1.5%) translateY(0); opacity: 0.4; }
          50% { transform: translateX(1.5%) translateY(-2%); opacity: 0.55; }
          100% { transform: translateX(-1.5%) translateY(0); opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
