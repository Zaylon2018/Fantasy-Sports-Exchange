import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Bell, User as UserIcon, Mail, CheckCircle2, Sparkles, Crown, Shirt } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { queryClient } from "../lib/queryClient";

type NotificationItem = {
  id: number;
  userId: string;
  type: "win" | "runner_up" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string | null;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

type UserProfile = {
  id: string;
  name?: string | null;
  email?: string | null;
  managerTeamName?: string | null;
};

export default function AccountPage() {
  const { toast } = useToast();
  const [outfit, setOutfit] = useState("classic");
  const [aura, setAura] = useState("none");
  const [commentator, setCommentator] = useState("hype");
  const [unlockedSuits, setUnlockedSuits] = useState<string[]>(["classic", "street"]);
  const [teamNameInput, setTeamNameInput] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("managerAvatar");
      const voiceRaw = localStorage.getItem("fantasyCommentator");
      if (voiceRaw) setCommentator(voiceRaw);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        outfit?: string;
        aura?: string;
        unlockedSuits?: string[];
      };
      if (parsed?.outfit) setOutfit(parsed.outfit);
      if (parsed?.aura) setAura(parsed.aura);
      if (Array.isArray(parsed?.unlockedSuits) && parsed.unlockedSuits.length) {
        setUnlockedSuits(parsed.unlockedSuits);
      }
    } catch {
      // ignore bad local storage payload
    }
  }, []);

  const saveAvatar = (
    next: Partial<{ outfit: string; aura: string; unlockedSuits: string[]; commentator: string }> = {},
  ) => {
    const nextOutfit = next.outfit || outfit;
    const nextAura = next.aura || aura;
    const nextUnlocked = next.unlockedSuits || unlockedSuits;
    const nextCommentator = next.commentator || commentator;
    setOutfit(nextOutfit);
    setAura(nextAura);
    setUnlockedSuits(nextUnlocked);
    setCommentator(nextCommentator);
    localStorage.setItem(
      "managerAvatar",
      JSON.stringify({
        outfit: nextOutfit,
        aura: nextAura,
        unlockedSuits: nextUnlocked,
      }),
    );
    localStorage.setItem("fantasyCommentator", nextCommentator);
  };

  const luckBonus = useMemo(() => {
    const hasElite = unlockedSuits.includes("elite");
    const hasLegend = unlockedSuits.includes("legend");
    if (hasLegend) return 4;
    if (hasElite) return 2;
    return 0;
  }, [unlockedSuits]);

  const { data: user, isLoading: userLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    setTeamNameInput(user?.managerTeamName || "");
  }, [user?.managerTeamName]);

  const updateTeamNameMutation = useMutation({
    mutationFn: async (managerTeamName: string) => {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerTeamName }),
      });
      if (!res.ok) throw new Error("Failed to update team name");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Team name updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update team name.", variant: "destructive" });
    },
  });

  const { data: inbox, isLoading: inboxLoading } = useQuery<NotificationResponse>({
    queryKey: ["/api/notifications"],
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update notification");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update notifications");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Inbox updated", description: "All notifications marked as read." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not mark notifications as read.", variant: "destructive" });
    },
  });

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Account</h1>
          <p className="text-sm text-muted-foreground">Profile and inbox notifications for tournament results.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Inbox
              {!!inbox?.unreadCount && <Badge>{inbox.unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4">
            <Card className="p-5 space-y-4">
              {userLoading ? (
                <>
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-5 w-56" />
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{user?.name || "Manager"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email || "No email set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="font-medium">{user?.managerTeamName || "Not set"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input
                        value={teamNameInput}
                        onChange={(e) => setTeamNameInput(e.target.value)}
                        placeholder="Enter manager team name"
                        className="max-w-xs"
                        maxLength={30}
                      />
                      <Button
                        size="sm"
                        onClick={() => updateTeamNameMutation.mutate(teamNameInput.trim())}
                        disabled={teamNameInput.trim().length < 3 || updateTeamNameMutation.isPending}
                      >
                        Save Team Name
                      </Button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">Manager Avatar</p>
                      <Badge variant="secondary">Pack luck +{luckBonus}%</Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Outfit</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "classic", label: "Classic" },
                            { key: "street", label: "Street" },
                            { key: "elite", label: "Elite" },
                            { key: "legend", label: "Legend" },
                          ].map((option) => {
                            const unlocked = unlockedSuits.includes(option.key);
                            return (
                              <Button
                                key={option.key}
                                size="sm"
                                variant={outfit === option.key ? "default" : "outline"}
                                disabled={!unlocked}
                                onClick={() => saveAvatar({ outfit: option.key })}
                              >
                                <Shirt className="w-3 h-3 mr-1" />
                                {option.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Aura</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: "none", label: "None" },
                            { key: "neon", label: "Neon" },
                            { key: "gold", label: "Gold" },
                            { key: "royal", label: "Royal" },
                          ].map((option) => (
                            <Button
                              key={option.key}
                              size="sm"
                              variant={aura === option.key ? "default" : "outline"}
                              onClick={() => saveAvatar({ aura: option.key })}
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (unlockedSuits.includes("elite")) {
                            toast({ title: "Elite suit already unlocked" });
                            return;
                          }
                          const next = [...unlockedSuits, "elite"];
                          saveAvatar({ unlockedSuits: next, outfit: "elite" });
                          toast({ title: "Elite suit unlocked" });
                        }}
                      >
                        Unlock Elite Suit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          if (unlockedSuits.includes("legend")) {
                            toast({ title: "Legend suit already unlocked" });
                            return;
                          }
                          const next = [...unlockedSuits, "legend"];
                          saveAvatar({ unlockedSuits: next, outfit: "legend", aura: "gold" });
                          toast({ title: "Legend suit unlocked", description: "Pack luck bonus increased." });
                        }}
                      >
                        Unlock Legend Suit
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Commentary Voice</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { key: "hype", label: "Hype" },
                          { key: "classic", label: "Classic" },
                          { key: "calm", label: "Calm" },
                        ].map((voice) => (
                          <Button
                            key={voice.key}
                            size="sm"
                            variant={commentator === voice.key ? "default" : "outline"}
                            onClick={() => saveAvatar({ commentator: voice.key })}
                          >
                            {voice.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="inbox" className="mt-4">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Notifications</h2>
                <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
                  Mark all read
                </Button>
              </div>

              {inboxLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : inbox?.notifications?.length ? (
                <div className="space-y-3">
                  {inbox.notifications.map((note) => (
                    <div key={note.id} className={`rounded-lg border p-3 ${note.read ? "opacity-80" : "bg-primary/5"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-sm">{note.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{note.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                          </p>
                        </div>
                        {!note.read && (
                          <Button size="sm" variant="ghost" onClick={() => markOneMutation.mutate(note.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
