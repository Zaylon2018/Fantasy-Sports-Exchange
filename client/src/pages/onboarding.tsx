import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import Card3D from "../components/Card3D";
import { type PlayerCardWithPlayer } from "../../../shared/schema";
import { ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "../components/ui/skeleton";
import { useLocation } from "wouter";
import WalkoutTunnelSignup from "../components/scenes/WalkoutTunnelSignup";
import type { Pack, PlayerLike } from "../lib/starterPacks";

type OnboardingStep = "teamName" | "packs" | "select" | "done";

const defaultPackLabels = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Wildcards"];

type OnboardingConfig = {
  signupPacksEnabled: boolean;
  requireTeamName: boolean;
  teamNameMinLength: number;
  onboardingEntryPath: string;
  starterChecklistLabel: string;
  packLabels: string[];
};

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<OnboardingStep>("teamName");
  const [teamName, setTeamName] = useState("");

  const { data: onboardingConfig } = useQuery<OnboardingConfig>({
    queryKey: ["/api/onboarding/config"],
  });

  const resolvedTeamNameMinLength = Math.max(2, Number(onboardingConfig?.teamNameMinLength || 3));

  // ✅ Ensure offer exists (safe even if dashboard already called it)
  useEffect(() => {
    if (onboardingConfig?.signupPacksEnabled === false) return;
    apiRequest("POST", "/api/onboarding/create-offer", {}).catch(() => {});
  }, [onboardingConfig?.signupPacksEnabled]);

  const { data: onboardingData, isLoading, refetch } = useQuery<{
    packCards: number[][];
    offeredPlayerIds: number[];
    players: any[]; // from /api/players/:id (your Player type)
    selectedCards: number[];
    completed: boolean;
  }>({
    queryKey: ["/api/onboarding/offers"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding/offers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch onboarding offers");
      return res.json();
    },
  });

  // If query ran before create-offer finished, refetch once shortly after mount
  useEffect(() => {
    const t = setTimeout(() => refetch(), 400);
    return () => clearTimeout(t);
  }, [refetch]);

  // If onboarding already completed, move to done (avoid setState during render)
  useEffect(() => {
    if (onboardingData?.completed) setStep("done");
  }, [onboardingData?.completed]);

  useEffect(() => {
    if (onboardingConfig?.requireTeamName === false) {
      setStep((prev) => (prev === "teamName" ? "packs" : prev));
    }
  }, [onboardingConfig?.requireTeamName]);

  // Turn players into "fake cards" so your existing <PlayerCard /> can render them
  const cardsByPlayerId = useMemo(() => {
    const map = new Map<number, PlayerCardWithPlayer>();
    const players = onboardingData?.players || [];

    for (const p of players) {
      map.set(
        p.id,
        ({
          id: p.id, // use playerId as temp id
          playerId: p.id,
          ownerId: null,
          rarity: "common",
          serialId: null,
          serialNumber: null,
          maxSupply: 0,
          level: 1,
          xp: 0,
          decisiveScore: 35,
          last5Scores: [0, 0, 0, 0, 0],
          forSale: false,
          price: 0,
          acquiredAt: new Date() as any,
          player: p,
        } as any) satisfies PlayerCardWithPlayer,
      );
    }

    return map;
  }, [onboardingData]);

  const packs: PlayerCardWithPlayer[][] = useMemo(() => {
    const packCards = onboardingData?.packCards || [];
    return packCards.map((pack) =>
      pack
        .map((playerId) => cardsByPlayerId.get(playerId))
        .filter(Boolean) as PlayerCardWithPlayer[],
    );
  }, [onboardingData, cardsByPlayerId]);

  const updateTeamNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("PATCH", "/api/user/profile", {
        managerTeamName: name,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/onboarding/create-offer", {});
      return res.json();
    },
  });

  const chooseMutation = useMutation({
    mutationFn: async (playerIds: number[]) => {
      const res = await apiRequest("POST", "/api/onboarding/choose", {
        selectedPlayerIds: playerIds,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/cards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lineup"] });
    },
  });

  const packLabels =
    Array.isArray(onboardingConfig?.packLabels) && onboardingConfig.packLabels.length === 5
      ? onboardingConfig.packLabels
      : defaultPackLabels;

  const handleConfirmPick5 = useCallback((pickedPlayers: PlayerLike[]) => {
    const ids = pickedPlayers
      .map((player) => Number(player.id))
      .filter((id) => Number.isFinite(id));

    if (ids.length !== 5) return;

    chooseMutation.mutate(ids, {
      onSuccess: () => {
        setStep("done");
      },
    });
  }, [chooseMutation]);

  const onboardingPacks = useMemo<Pack[]>(() => {
    if (!packs.length) return [];

    return packs.map((pack, index) => ({
      id: `onboarding-pack-${index + 1}`,
      label: packLabels[index] || `Pack ${index + 1}`,
      cards: pack.map((card) => {
        const player = card.player as any;
        return {
          id: card.playerId,
          name: player?.name,
          position: player?.position,
          team: player?.team,
          imageUrl: player?.imageUrl,
          rarity: (card.rarity || "common") as any,
          card,
        } satisfies PlayerLike;
      }),
    }));
  }, [packs, packLabels]);

  const renderStarterCard = useCallback((player: PlayerLike) => {
    const raw = (player as any).card as PlayerCardWithPlayer | undefined;
    if (raw) {
      return <Card3D card={raw} size="sm" />;
    }

    const fallback = {
      id: Number(player.id),
      playerId: Number(player.id),
      ownerId: null,
      rarity: (player.rarity || "common") as any,
      serialId: null,
      serialNumber: null,
      maxSupply: 0,
      level: 1,
      xp: 0,
      decisiveScore: 35,
      last5Scores: [0, 0, 0, 0, 0],
      forSale: false,
      price: 0,
      acquiredAt: new Date() as any,
      player: {
        id: Number(player.id),
        name: player.name || "Unknown Player",
        position: player.position || "MID",
        team: player.team || "",
        imageUrl: player.imageUrl,
      },
    } as any as PlayerCardWithPlayer;

    return <Card3D card={fallback} size="sm" />;
  }, []);

  const handleContinueAfterTeamName = async () => {
    const trimmedName = teamName.trim();
    if (trimmedName.length < resolvedTeamNameMinLength) return;

    try {
      await updateTeamNameMutation.mutateAsync(trimmedName);
      await createOfferMutation.mutateAsync();
      await refetch();
      setStep("packs");
    } catch {
      // mutation-level toasts/errors already handled upstream
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="w-64 h-8" />
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-36 h-52 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (onboardingConfig?.signupPacksEnabled === false) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-md space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Starter packs are currently unavailable</h1>
          <p className="text-muted-foreground">An admin has temporarily disabled signup packs. You can continue to the dashboard.</p>
          <Button onClick={() => setLocation("/")}>Continue</Button>
        </div>
      </div>
    );
  }

  if (!onboardingData) return null;

  if (step === "teamName") {
    if (onboardingConfig?.requireTeamName === false) {
      return null;
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center space-y-6"
        >
          <div className="space-y-2">
            <Sparkles className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Welcome to FantasyFC!
            </h1>
            <p className="text-muted-foreground">
              Let's start by creating your manager team name
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your team name..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={30}
              className="text-center text-lg h-14"
              autoFocus
            />
            
            <Button
              onClick={handleContinueAfterTeamName}
              disabled={teamName.trim().length < resolvedTeamNameMinLength || updateTeamNameMutation.isPending || createOfferMutation.isPending}
              size="lg"
              className="w-full text-lg"
            >
              {updateTeamNameMutation.isPending || createOfferMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
            
            {teamName.trim().length > 0 && teamName.trim().length < resolvedTeamNameMinLength && (
              <p className="text-sm text-destructive">
                Team name must be at least {resolvedTeamNameMinLength} characters
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "packs" || step === "select") {
    const packsReady = onboardingPacks.length === 5 && onboardingPacks.every((pack) => pack.cards.length === 3);

    if (!packsReady) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-card/40 p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Preparing your position packs...</p>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await createOfferMutation.mutateAsync();
                } finally {
                  await refetch();
                }
              }}
              disabled={createOfferMutation.isPending}
            >
              {createOfferMutation.isPending ? "Loading..." : "Retry Load Packs"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <WalkoutTunnelSignup
        open
        onClose={() => setLocation("/")}
        packs={onboardingPacks}
        renderCard={renderStarterCard}
        onFinishPick5={handleConfirmPick5}
      />
    );
  }

  // done
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="text-center mb-8">
        <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Your Squad is Ready!
        </h1>
        <p className="text-muted-foreground">
          Your 5 starter cards have been added to your collection.
        </p>
      </div>

      <Button onClick={() => (window.location.href = "/")} size="lg">
        Go to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}