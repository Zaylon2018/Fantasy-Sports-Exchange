import { useQuery } from "@tanstack/react-query";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Activity, Clock, Users, Target, TrendingUp } from "lucide-react";
import { useEffect } from "react";

interface LiveGame {
  id: number;
  kickoffTime: string;
  started: boolean;
  finished: boolean;
  minutes: number;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    score: number;
  };
  stats: any[];
  statsSummary?: {
    shots?: { home: number | null; away: number | null };
    onTarget?: { home: number | null; away: number | null };
    possession?: { home: number | null; away: number | null };
  };
  playerStats: any[];
}

export default function LiveGames() {
  const { data: liveGames = [], isLoading, refetch } = useQuery<LiveGame[]>({
    queryKey: ["/api/epl/live-games"],
    queryFn: async () => {
      const res = await fetch("/api/epl/live-games", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch live games");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Force refetch when component mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const getMinutesDisplay = (minutes: number) => {
    if (minutes === 0) return "Kick Off";
    if (minutes <= 45) return `${minutes}'`;
    if (minutes === 45) return "HT";
    if (minutes > 45 && minutes <= 90) return `${minutes}'`;
    if (minutes > 90) return `${minutes}' +${minutes - 90}'`;
    return `${minutes}'`;
  };

  const getStatValue = (game: LiveGame, keys: string[], side: "h" | "a") => {
    const stats = Array.isArray(game?.stats) ? game.stats : [];
    for (const item of stats) {
      const rawName = String(item?.identifier || item?.name || item?.stat || "").toLowerCase();
      if (!keys.some((key) => rawName.includes(key))) continue;
      const rawValue = item?.[side]?.[0]?.value ?? item?.[side]?.value ?? null;
      if (rawValue === null || rawValue === undefined || rawValue === "") return null;
      const parsed = typeof rawValue === "string" ? Number(String(rawValue).replace(/%/g, "").trim()) : Number(rawValue);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (!liveGames || liveGames.length === 0) {
    return (
      <Card className="p-12 bg-card/50 backdrop-blur-sm border-border/50 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Live Games</h3>
            <p className="text-sm text-muted-foreground">
              Check back during matchdays to see live scores and stats
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            {liveGames.length} {liveGames.length === 1 ? "Game" : "Games"} Live
          </span>
        </div>
        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-500">
          <Activity className="w-3 h-3 mr-1" />
          Auto-updating every 30s
        </Badge>
      </div>

      {liveGames.map((game) => (
        (() => {
          const homeShots = getStatValue(game, ["shots total", "shots"], "h");
          const awayShots = getStatValue(game, ["shots total", "shots"], "a");
          const homeOnTarget = getStatValue(game, ["shots on goal", "on target"], "h");
          const awayOnTarget = getStatValue(game, ["shots on goal", "on target"], "a");
          const homePossession = getStatValue(game, ["ball possession", "possession"], "h");
          const awayPossession = getStatValue(game, ["ball possession", "possession"], "a");
          const homeCorners = getStatValue(game, ["corner", "corners"], "h");
          const awayCorners = getStatValue(game, ["corner", "corners"], "a");
          const homeCards = getStatValue(game, ["yellow cards", "red cards", "cards"], "h");
          const awayCards = getStatValue(game, ["yellow cards", "red cards", "cards"], "a");

          const shotsHomeVal = game.statsSummary?.shots?.home ?? homeShots;
          const shotsAwayVal = game.statsSummary?.shots?.away ?? awayShots;
          const onTargetHomeVal = game.statsSummary?.onTarget?.home ?? homeOnTarget;
          const onTargetAwayVal = game.statsSummary?.onTarget?.away ?? awayOnTarget;
          const possessionHomeVal = game.statsSummary?.possession?.home ?? homePossession;
          const possessionAwayVal = game.statsSummary?.possession?.away ?? awayPossession;

          return (
        <Card
          key={game.id}
          className="p-6 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm border-border/50 hover:border-purple-500/30 transition-all"
        >
          <div className="flex flex-col gap-4">
            {/* Header with time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
                <span className="text-sm font-mono font-bold text-red-500">
                  {getMinutesDisplay(game.minutes)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(game.kickoffTime).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Score Display */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Home Team */}
              <div className="flex flex-col items-end">
                <span className="font-bold text-lg text-foreground">
                  {game.homeTeam.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {game.homeTeam.shortName}
                </span>
              </div>

              {/* Score */}
              <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border/50">
                <span className="text-3xl font-black text-foreground tabular-nums">
                  {game.homeTeam.score}
                </span>
                <span className="text-2xl font-bold text-muted-foreground">-</span>
                <span className="text-3xl font-black text-foreground tabular-nums">
                  {game.awayTeam.score}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-start">
                <span className="font-bold text-lg text-foreground">
                  {game.awayTeam.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {game.awayTeam.shortName}
                </span>
              </div>
            </div>

            {/* Match Stats Summary */}
            {game.stats && game.stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4 border-t border-border/30">
                <div className="flex flex-col items-center gap-1">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Shots</span>
                  <span className="text-sm font-semibold text-foreground">
                    {shotsHomeVal ?? "N/A"} - {shotsAwayVal ?? "N/A"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">On Target</span>
                  <span className="text-sm font-semibold text-foreground">
                    {onTargetHomeVal ?? "N/A"} - {onTargetAwayVal ?? "N/A"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Possession</span>
                  <span className="text-sm font-semibold text-foreground">
                    {possessionHomeVal == null ? "N/A" : `${possessionHomeVal}%`} - {possessionAwayVal == null ? "N/A" : `${possessionAwayVal}%`}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">Corners</span>
                  <span className="text-sm font-semibold text-foreground">
                    {homeCorners ?? "N/A"} - {awayCorners ?? "N/A"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">Cards</span>
                  <span className="text-sm font-semibold text-foreground">
                    {homeCards ?? "N/A"} - {awayCards ?? "N/A"}
                  </span>
                </div>
              </div>
            )}

            {/* Player Stats Count */}
            {game.playerStats && game.playerStats.length > 0 && (
              <div className="pt-2 border-t border-border/30">
                <span className="text-xs text-muted-foreground">
                  {game.playerStats.length} players tracking live stats
                </span>
              </div>
            )}
          </div>
        </Card>
          );
        })()
      ))}
    </div>
  );
}
