import { useEffect, useMemo, useRef, useState } from "react";
import { DollarSign, Sparkles, Trophy } from "lucide-react";
import Card3D from "./Card3D";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { type PlayerCardWithPlayer } from "../../../shared/schema";

type DisplayCabinetProps = {
  cards: PlayerCardWithPlayer[];
  localXpBoost: Record<number, number>;
  raritySurfaceGlow: Record<string, string>;
  onTrain: (cardId: number) => void;
  onListCard: (card: PlayerCardWithPlayer) => void;
  onCancelListing: (cardId: number) => void;
  cancelListingPending: boolean;
};

export default function DisplayCabinet({
  cards,
  localXpBoost,
  raritySurfaceGlow,
  onTrain,
  onListCard,
  onCancelListing,
  cancelListingPending,
}: DisplayCabinetProps) {
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [featuredCardId, setFeaturedCardId] = useState<number | null>(null);
  const [showcaseMode, setShowcaseMode] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const cardRefMap = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!cards.length) {
      setFeaturedCardId(null);
      setActiveCardId(null);
      return;
    }
    if (!featuredCardId || !cards.some((card) => card.id === featuredCardId)) {
      const mid = cards[Math.floor(cards.length / 2)]?.id ?? cards[0].id;
      setFeaturedCardId(mid);
      setActiveCardId(mid);
    }
  }, [cards, featuredCardId]);

  const orderedCards = useMemo(() => {
    if (!featuredCardId) return cards;
    const featured = cards.find((card) => card.id === featuredCardId);
    if (!featured) return cards;
    const others = cards.filter((card) => card.id !== featuredCardId);
    const leftCount = Math.floor(others.length / 2);
    const left = others.slice(0, leftCount);
    const right = others.slice(leftCount);
    return [...left, featured, ...right];
  }, [cards, featuredCardId]);

  const activeGlow =
    raritySurfaceGlow[
      String(cards.find((card) => card.id === (activeCardId || featuredCardId))?.rarity || "common").toLowerCase()
    ] || raritySurfaceGlow.common;

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const focusCard = (cardId: number) => {
    setActiveCardId(cardId);
    setFeaturedCardId(cardId);
    const el = cardRefMap.current[cardId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  };

  return (
    <div className="relative z-10 px-4 sm:px-6 pt-10 pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs sm:text-sm text-cyan-100/80 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Display Cabinet
        </div>
        <Badge variant="secondary">Locker Room Shelf</Badge>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm min-h-[66vh]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(10,18,32,0.92)_0%,rgba(8,12,22,0.88)_48%,rgba(6,8,14,0.96)_100%)]" />
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-[7%] left-1/2 -translate-x-1/2 w-[46%] h-4 rounded-full bg-white/20 blur-xl opacity-90 pointer-events-none" />
        <div className="absolute inset-x-0 top-[28%] h-20 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.08),transparent)] pointer-events-none cabinet-wall-sweep" />

        <div
          className="absolute inset-x-8 bottom-28 h-20 blur-2xl pointer-events-none transition-all duration-500"
          style={{ background: activeGlow }}
        />
        <div className="absolute inset-x-0 bottom-20 h-3 bg-gradient-to-r from-transparent via-slate-200/25 to-transparent pointer-events-none" />

        <div className="absolute inset-x-5 bottom-14 h-8 rounded-[10px] bg-gradient-to-b from-slate-300/20 to-slate-800/45 border border-white/15 shadow-[0_10px_18px_rgba(0,0,0,0.45)] pointer-events-none" />
        <div className="absolute inset-x-4 bottom-8 h-7 rounded-b-[14px] bg-gradient-to-b from-slate-700/55 to-slate-950/85 border border-white/10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-900/65 via-slate-900/35 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[radial-gradient(ellipse_at_center,rgba(186,230,253,0.16),transparent_72%)] pointer-events-none" />

        <div className="overflow-x-auto pb-6 pt-20 px-3 sm:px-6 snap-x snap-mandatory">
          <div className="flex items-end gap-5 min-w-max">
            {orderedCards.map((card) => {
              const boostedXp = (card.xp || 0) + (localXpBoost[card.id] || 0);
              const gainedLevels = Math.floor(boostedXp / 1000);
              const effectiveLevel = (card.level || 1) + gainedLevels;
              const xpProgress = boostedXp % 1000;
              const altArtUnlocked = effectiveLevel >= 10;
              const glow =
                raritySurfaceGlow[String(card.rarity || "common").toLowerCase()] ||
                raritySurfaceGlow.common;

              const isFeatured = card.id === featuredCardId;
              const isActive = card.id === activeCardId;

              return (
                <div
                  key={card.id}
                  ref={(el) => {
                    cardRefMap.current[card.id] = el;
                  }}
                  className={`relative snap-center shrink-0 transition-all duration-500 ${
                    isFeatured ? "w-[310px]" : "w-[232px] opacity-90"
                  }`}
                  onPointerDown={() => {
                    clearLongPress();
                    longPressTimerRef.current = window.setTimeout(() => {
                      setShowcaseMode((prev) => !prev);
                    }, 450);
                  }}
                  onPointerUp={clearLongPress}
                  onPointerLeave={clearLongPress}
                  onClick={() => focusCard(card.id)}
                >
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-[156px] h-24 w-56 rounded-full blur-2xl pointer-events-none transition-all duration-500 ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                    style={{ background: glow }}
                  />
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-[104px] rounded-full bg-slate-100/20 blur-xl pointer-events-none transition-all duration-500 ${
                      isFeatured ? "h-4 w-44" : "h-3 w-36"
                    }`}
                  />
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-[136px] rounded-full bg-black/65 blur-md pointer-events-none transition-all duration-500 ${
                      isFeatured ? "h-8 w-56" : "h-6 w-44"
                    }`}
                  />

                  <div
                    className={`absolute left-1/2 -translate-x-1/2 bottom-[74px] rounded-2xl bg-gradient-to-b from-white/10 via-slate-300/8 to-transparent pointer-events-none transition-all duration-500 ${
                      isFeatured ? "h-16 w-44" : "h-12 w-34"
                    }`}
                    style={{ filter: "blur(6px)", transform: "translateX(-50%) perspective(260px) rotateX(66deg)" }}
                  />

                  <div
                    className={`relative rounded-xl bg-black/35 backdrop-blur-sm border border-white/15 p-2 shadow-[0_24px_40px_rgba(0,0,0,0.55)] transition-all duration-500 ${
                      isActive ? "-translate-y-3 scale-[1.02]" : "translate-y-0"
                    } ${isFeatured && showcaseMode ? "cabinet-showcase" : ""}`}
                  >
                    <Card3D card={card} size={isFeatured ? "md" : "sm"} />
                  </div>

                  <div className="mt-2 flex justify-center z-20 relative gap-2 items-center">
                    {isFeatured && showcaseMode && <Badge>Showcase</Badge>}
                    {card.forSale ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          onCancelListing(card.id);
                        }}
                        disabled={cancelListingPending}
                        className="text-xs"
                      >
                        Cancel (N${card.price})
                      </Button>
                    ) : String(card.rarity || "").toLowerCase() === "common" ? (
                      <Button size="sm" variant="outline" disabled className="text-xs">
                        Tournament Only
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          onListCard(card);
                        }}
                        className="text-xs"
                      >
                        <DollarSign className="w-3 h-3 mr-1" />
                        Sell
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 rounded-lg border border-border/60 bg-background/75 p-2 relative z-20">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Evolution</span>
                      <span className="font-semibold">Lvl {effectiveLevel}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                        style={{ width: `${Math.min(100, (xpProgress / 1000) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{xpProgress}/1000 XP</span>
                      {altArtUnlocked ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />Alt Art Unlocked
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Alt art at Lvl 10</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        onTrain(card.id);
                      }}
                    >
                      Train +120 XP
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-cyan-100/75 mt-3">
        Tap a card to lift and feature it. Long press any card to toggle showcase rotation.
      </p>

      <style>{`
        .cabinet-showcase {
          animation: cabinetShowcaseRotate 3.6s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .cabinet-wall-sweep {
          animation: cabinetWallSweep 10s ease-in-out infinite;
        }

        @keyframes cabinetShowcaseRotate {
          0% { transform: translateY(-8px) rotateY(-8deg); }
          50% { transform: translateY(-12px) rotateY(8deg); }
          100% { transform: translateY(-8px) rotateY(-8deg); }
        }

        @keyframes cabinetWallSweep {
          0% { transform: translateX(-45%) skewX(-8deg); opacity: 0; }
          30% { opacity: 0.7; }
          100% { transform: translateX(45%) skewX(-8deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
