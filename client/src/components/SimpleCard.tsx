import { type PlayerCardData } from "./Metal3DCard";
import { useMemo, useState } from "react";
import { CARD_IMAGE_FALLBACK } from "../lib/card-image";

type SimpleCardProps = {
  player: PlayerCardData;
  className?: string;
};

const rarityStyles: Record<PlayerCardData["rarity"], string> = {
  common: "from-zinc-700 to-zinc-900 border-zinc-500/60",
  rare: "from-sky-700 to-slate-900 border-sky-400/70",
  unique: "from-fuchsia-700 to-slate-900 border-fuchsia-400/70",
  epic: "from-violet-700 to-slate-900 border-violet-400/70",
  legendary: "from-amber-600 to-slate-900 border-amber-300/80",
};

export default function SimpleCard({ player, className = "" }: SimpleCardProps) {
  const candidates = useMemo(() => {
    const list = [player.image, ...(player.imageCandidates || []), CARD_IMAGE_FALLBACK]
      .filter((value): value is string => Boolean(value));
    return Array.from(new Set(list));
  }, [player.image, player.imageCandidates]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const src = candidates[Math.min(candidateIndex, Math.max(0, candidates.length - 1))] || CARD_IMAGE_FALLBACK;

  return (
    <article
      className={`relative h-[364px] w-[260px] overflow-hidden rounded-2xl border bg-gradient-to-b ${rarityStyles[player.rarity]} shadow-xl ${className}`}
    >
      {candidates.length > 0 ? (
        <img
          src={src}
          alt={player.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
          onLoad={() => {
            console.info("[SimpleCard] image loaded", {
              id: player.id,
              name: player.name,
              src,
            });
          }}
          onError={() => {
            console.error("[SimpleCard] image failed", {
              id: player.id,
              name: player.name,
              failedSrc: src,
              candidateIndex,
              candidates,
            });
            if (candidateIndex < candidates.length - 1) {
              setCandidateIndex((prev) => prev + 1);
            }
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

      <div className="absolute left-4 top-4 rounded-md bg-black/55 px-2 py-1 text-2xl font-black text-white">
        {player.rating}
      </div>
      <div className="absolute right-4 top-4 rounded-md bg-black/55 px-2 py-1 text-sm font-semibold text-zinc-100">
        {player.position}
      </div>

      <div className="absolute bottom-0 w-full p-4 text-white">
        <p className="truncate text-lg font-bold uppercase tracking-wide">{player.name}</p>
        <p className="truncate text-xs text-zinc-300">{player.club || "FantasyFC"}</p>
        <p className="mt-2 text-xs text-zinc-300">
          #{String(player.serial || 1).padStart(3, "0")} / {player.maxSupply || 500}
        </p>
      </div>
    </article>
  );
}
