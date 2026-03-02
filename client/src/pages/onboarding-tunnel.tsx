import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Card3D from "../components/Card3D";
import TunnelCinematicScene from "../components/TunnelCinematicScene";
import { Button } from "../components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { type PlayerCardWithPlayer } from "../../../shared/schema";

type OnboardingPhase =
  | "start"
  | "walkout"
  | "lights-flicker"
  | "flag-flash"
  | "rating-reveal"
  | "card-explode"
  | "cards-reveal"
  | "complete";

const nationalityFlagMap: Record<string, string> = {
  england: "🏴",
  portugal: "🇵🇹",
  france: "🇫🇷",
  spain: "🇪🇸",
  brazil: "🇧🇷",
  argentina: "🇦🇷",
  belgium: "🇧🇪",
  netherlands: "🇳🇱",
  norway: "🇳🇴",
  scotland: "🏴",
  wales: "🏴",
  ireland: "🇮🇪",
  germany: "🇩🇪",
  italy: "🇮🇹",
  croatia: "🇭🇷",
  ukraine: "🇺🇦",
  usa: "🇺🇸",
};

function flagFromNationality(nationality?: string | null): string {
  if (!nationality) return "🏳️";
  const key = nationality.trim().toLowerCase();
  return nationalityFlagMap[key] || "🏳️";
}

export default function OnboardingTunnelPage() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<OnboardingPhase>("start");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [commentary, setCommentary] = useState("The crowd waits in silence...");
  const [managerOutfit, setManagerOutfit] = useState("classic");
  const [managerAura, setManagerAura] = useState("none");

  const crowdAudioRef = useRef<HTMLAudioElement | null>(null);
  const whooshAudioRef = useRef<HTMLAudioElement | null>(null);
  const impactAudioRef = useRef<HTMLAudioElement | null>(null);
  const timelineRef = useRef<number[]>([]);

  const { data: cards, isLoading } = useQuery<PlayerCardWithPlayer[]>({
    queryKey: ["/api/user/cards"],
    enabled: phase !== "start",
  });

  const featuredCard = useMemo(() => cards?.[0], [cards]);
  const featuredNationality = featuredCard?.player?.nationality || "Unknown";
  const featuredFlag = flagFromNationality(featuredNationality);
  const featuredRating = featuredCard?.player?.overall || 0;

  useEffect(() => {
    crowdAudioRef.current = new Audio("/sfx/crowd_cheer.mp3");
    whooshAudioRef.current = new Audio("/sfx/whoosh.mp3");
    impactAudioRef.current = new Audio("/sfx/pack_open.mp3");

    if (crowdAudioRef.current) crowdAudioRef.current.volume = 0.12;
    if (whooshAudioRef.current) whooshAudioRef.current.volume = 0.35;
    if (impactAudioRef.current) impactAudioRef.current.volume = 0.6;

    if (crowdAudioRef.current) {
      crowdAudioRef.current.loop = true;
    }

    return () => {
      crowdAudioRef.current?.pause();
      whooshAudioRef.current?.pause();
      impactAudioRef.current?.pause();

      timelineRef.current.forEach((timer) => window.clearTimeout(timer));
      timelineRef.current = [];
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("managerAvatar");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { outfit?: string; aura?: string };
      if (parsed?.outfit) setManagerOutfit(parsed.outfit);
      if (parsed?.aura) setManagerAura(parsed.aura);
    } catch {
      // ignore malformed local storage
    }
  }, []);

  const speak = (line: string) => {
    if (!audioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    const commentator = localStorage.getItem("fantasyCommentator") || "hype";
    if (commentator === "classic") {
      utterance.rate = 0.93;
      utterance.pitch = 0.88;
    } else if (commentator === "calm") {
      utterance.rate = 0.86;
      utterance.pitch = 0.95;
    } else {
      utterance.rate = 1.03;
      utterance.pitch = 1.12;
    }
    utterance.volume = 0.92;
    synth.speak(utterance);
  };

  useEffect(() => {
    const lines: Record<OnboardingPhase, string> = {
      start: "The tunnel is ready.",
      walkout: "Manager enters the tunnel.",
      "lights-flicker": "Lights are flickering. This feels huge.",
      "flag-flash": `${featuredNationality}... the flag is up!`,
      "rating-reveal": `Overall rating... ${featuredRating || "unknown"}.`,
      "card-explode": "Here we go... card reveal!",
      "cards-reveal": "Pick your five starters.",
      complete: "Build your lineup and dominate matchday.",
    };
    const next = lines[phase];
    setCommentary(next);
    if (phase !== "start") speak(next);
  }, [phase, audioEnabled, featuredNationality, featuredRating]);

  const playAudio = (audioRef: React.MutableRefObject<HTMLAudioElement | null>, force = false) => {
    if ((audioEnabled || force) && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e));
    }
  };

  const schedule = (delay: number, action: () => void) => {
    const id = window.setTimeout(action, delay);
    timelineRef.current.push(id);
  };

  const startSequence = () => {
    timelineRef.current.forEach((timer) => window.clearTimeout(timer));
    timelineRef.current = [];

    setAudioEnabled(true);
    setPhase("walkout");
    setCardsRevealed(false);

    playAudio(crowdAudioRef, true);

    const crowdRamp = window.setInterval(() => {
      if (!crowdAudioRef.current) return;
      crowdAudioRef.current.volume = Math.min(0.35, crowdAudioRef.current.volume + 0.02);
      if (crowdAudioRef.current.volume >= 0.35) {
        window.clearInterval(crowdRamp);
      }
    }, 350);
    timelineRef.current.push(crowdRamp as unknown as number);

    schedule(2100, () => setPhase("lights-flicker"));
    schedule(3000, () => {
      setPhase("flag-flash");
      playAudio(whooshAudioRef);
    });
    schedule(4000, () => setPhase("rating-reveal"));
    schedule(5100, () => {
      setPhase("card-explode");
      playAudio(impactAudioRef);
    });
    schedule(5700, () => {
      setPhase("cards-reveal");
      setCardsRevealed(true);
    });
    schedule(6800, () => setPhase("complete"));
  };

  const toggleCard = (cardId: number) => {
    if (!cardsRevealed || phase !== "complete") return;

    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < 5) {
        next.add(cardId);
      }
      return next;
    });
  };

  const completeOnboarding = () => {
    if (selectedCards.size !== 5) return;
    setLocation("/dashboard");
  };

  const displayCards = cards?.slice(0, 9) || [];
  const canProceed = selectedCards.size === 5;
  const phaseIntensity =
    phase === "start"
      ? 0
      : phase === "walkout"
      ? 0.25
      : phase === "lights-flicker"
      ? 0.45
      : phase === "flag-flash"
      ? 0.6
      : phase === "rating-reveal"
      ? 0.72
      : 0.9;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {phase !== "start" && (
        <TunnelCinematicScene
          phaseIntensity={phaseIntensity}
          flicker={phase === "lights-flicker"}
          showBeam={phase !== "walkout"}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75 z-[2]" />

      {phase !== "start" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          {audioEnabled ? (
            <Volume2 className="w-5 h-5 text-white" />
          ) : (
            <VolumeX className="w-5 h-5 text-white" />
          )}
        </motion.button>
      )}

      {phase === "start" && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gradient-to-b from-black via-zinc-900 to-black"
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2">
              Welcome, Manager
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              Your journey begins here
            </p>
            <Button
              size="lg"
              onClick={startSequence}
              className="px-8 py-6 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Enter the Stadium
            </Button>
          </motion.div>
        </motion.div>
      )}

      {phase === "walkout" && (
        <motion.div
          className="absolute inset-0 z-20 flex items-end justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ y: 260, scale: 0.8, opacity: 0.2 }}
            animate={{ y: 20, scale: 1.02, opacity: 0.85 }}
            transition={{ duration: 1.9, ease: [0.22, 1, 0.36, 1] }}
            className="h-[50vh] w-[18vh] rounded-[999px] blur-[1px]"
            style={{
              background:
                managerOutfit === "elite"
                  ? "linear-gradient(to top, rgba(3,7,18,0.95), rgba(30,41,59,0.7), rgba(148,163,184,0.45))"
                  : managerOutfit === "street"
                  ? "linear-gradient(to top, rgba(9,9,11,0.95), rgba(39,39,42,0.7), rgba(212,212,216,0.35))"
                  : "linear-gradient(to top, rgba(0,0,0,0.96), rgba(63,63,70,0.7), rgba(212,212,216,0.35))",
              boxShadow:
                managerAura === "gold"
                  ? "0 0 36px rgba(250,204,21,0.45)"
                  : managerAura === "neon"
                  ? "0 0 36px rgba(56,189,248,0.42)"
                  : managerAura === "royal"
                  ? "0 0 36px rgba(168,85,247,0.45)"
                  : "0 0 12px rgba(255,255,255,0.18)",
            }}
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-14 text-2xl md:text-3xl font-black text-white/85 tracking-wider"
          >
            PLAYER WALKOUT
          </motion.p>
        </motion.div>
      )}

      {phase !== "start" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="px-4 py-2 rounded-full border border-white/20 bg-black/55 backdrop-blur-md text-white/90 text-sm tracking-wide">
            {commentary}
          </div>
        </motion.div>
      )}

      {phase === "lights-flicker" && (
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.1, 0.45, 0.12, 0.5, 0.18] }}
          transition={{ duration: 1.1, times: [0, 0.2, 0.45, 0.7, 1] }}
          style={{ background: "radial-gradient(circle at 50% 25%, rgba(255,255,255,0.55), transparent 50%)" }}
        />
      )}

      {phase === "flag-flash" && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0.35], scale: [0.8, 1.2, 1] }}
          transition={{ duration: 1.2, times: [0, 0.4, 1] }}
        >
          <div className="rounded-2xl px-8 py-6 bg-black/45 border border-white/30 backdrop-blur-md text-center">
            <div className="text-6xl md:text-7xl mb-2">{featuredFlag}</div>
            <div className="text-sm text-white/70 tracking-[0.25em] uppercase">Nationality</div>
            <div className="text-xl md:text-2xl font-black text-white mt-1">{featuredNationality}</div>
          </div>
        </motion.div>
      )}

      {phase === "rating-reveal" && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.6, y: 20 }}
            animate={{ scale: [0.6, 1.08, 1], y: [20, 0, 0] }}
            transition={{ duration: 1.05, times: [0, 0.65, 1], ease: "easeOut" }}
            className="text-center"
          >
            <p className="text-xs md:text-sm uppercase tracking-[0.45em] text-white/70">Overall Rating</p>
            <p className="text-7xl md:text-8xl font-black text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.6)]">
              {featuredRating || "--"}
            </p>
          </motion.div>
        </motion.div>
      )}

      {phase === "card-explode" && featuredCard && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.2, rotateY: -65, y: 90, opacity: 0 }}
            animate={{ scale: 1.15, rotateY: [35, 0, -10], y: [90, 0, -8], opacity: 1 }}
            transition={{ duration: 0.95, ease: [0.19, 1, 0.22, 1] }}
            style={{ transformStyle: "preserve-3d", perspective: "1200px" }}
          >
            <Card3D card={featuredCard} size="lg" />
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {phase === "cards-reveal" || phase === "complete" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-40 p-4 overflow-y-auto"
          >
            <div className="w-full max-w-6xl my-auto">
              {isLoading ? (
                <div className="text-white text-center text-xl">Loading cards...</div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6">
                  {displayCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ 
                        opacity: 0, 
                        scale: 0, 
                        rotateY: -90,
                        y: -200,
                        x: 0,
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        rotateY: 0,
                        y: 0,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                      className="flex justify-center"
                      style={{ 
                        transformStyle: "preserve-3d",
                        perspective: "1000px",
                      }}
                    >
                      <div 
                        onClick={() => toggleCard(card.id)}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedCards.has(card.id) 
                            ? "ring-4 ring-purple-500 scale-105" 
                            : "hover:scale-105"
                        }`}
                      >
                        <Card3D
                          card={card}
                          size="sm"
                          selected={selectedCards.has(card.id)}
                          selectable={phase === "complete"}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {phase === "complete" && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-50"
        >
          <div className="bg-black/80 backdrop-blur-sm px-6 py-4 rounded-full">
            <p className="text-white font-semibold text-center">
              {selectedCards.size === 0 
                ? "Select your top 5 cards to build your starting lineup"
                : `${selectedCards.size}/5 cards selected`}
            </p>
          </div>
          <Button
            size="lg"
            onClick={completeOnboarding}
            disabled={!canProceed}
            className="px-8 py-6 text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            {canProceed ? "Complete Onboarding" : "Select 5 Cards"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
