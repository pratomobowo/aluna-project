import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Coins, Coffee, Flower2, Lightbulb, Loader2, Salad, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

type Tab = "Semua" | "Diskon" | "Katalog";

interface Reward {
  id: number;
  title: string;
  description?: string;
  tag: string;
  points: number;
  icon?: string;
  active?: boolean;
}

interface PointsResponse {
  balance: number;
  transactions: { id: number; amount: number; reason: string; createdAt: string }[];
}

const TABS: Tab[] = ["Semua", "Diskon", "Katalog"];

const REWARD_ICONS: Record<string, typeof Coffee> = {
  Coffee,
  BookOpen,
  Ticket,
  Flower2,
  Salad,
};

function rewardIcon(icon?: string) {
  return (icon && REWARD_ICONS[icon]) || Coins;
}

export default function Redeem() {
  const [tab, setTab] = useState<Tab>("Semua");
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["session"], queryFn: getSession, retry: false });
  const loggedIn = !!session.data?.user;

  const pointsQuery = useQuery({
    queryKey: ["points"],
    queryFn: () => apiFetch<PointsResponse>("/api/points"),
    enabled: loggedIn,
    retry: false,
  });
  const rewardsQuery = useQuery({
    queryKey: ["rewards"],
    queryFn: () => apiFetch<Reward[]>("/api/rewards"),
    retry: false,
  });

  const balance = pointsQuery.data?.balance ?? 0;
  const rewards = rewardsQuery.data ?? [];
  const nextReward =
    rewards.find((r) => r.points > balance)?.points ??
    (rewards.length > 0 ? Math.max(...rewards.map((r) => r.points)) : 0);
  const progress = nextReward > 0 ? Math.min(100, (balance / nextReward) * 100) : 0;

  const filtered = useMemo(
    () =>
      rewards.filter((r) =>
        tab === "Semua" ? true : tab === "Diskon" ? r.tag.startsWith("Diskon") : !r.tag.startsWith("Diskon")
      ),
    [rewards, tab]
  );

  const redeem = useMutation({
    mutationFn: (reward: Reward) =>
      apiFetch(`/api/rewards/${reward.id}/redeem`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success("Reward ditukar!");
      queryClient.invalidateQueries({ queryKey: ["points"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error && err.message === "insufficient_points" ? "Poin belum cukup" : err.message);
    },
  });

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-24">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Tukar Poin</h1>
      </header>

      <div className="flex flex-col gap-5 px-5">
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 px-5 py-5 text-primary-foreground">
          <p className="text-xs font-medium text-primary-foreground/85">Poin kamu</p>
          <p className="mt-1 flex items-center gap-2 font-serif text-4xl font-semibold leading-none">
            <Coins className="size-8" aria-hidden />
            {loggedIn ? balance.toLocaleString("id-ID") : 0}
          </p>
          <p className="mt-2 text-xs text-primary-foreground/85">
            {loggedIn
              ? "Kumpulin poin dari langkah harianmu, tukar jadi reward"
              : "Masuk untuk melihat poinmu"}
          </p>
          <div className="mt-4 rounded-xl bg-primary-foreground/15 px-3.5 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-primary-foreground/90">
              <span>Menuju reward berikutnya</span>
              <span>
                {balance.toLocaleString("id-ID")} / {nextReward.toLocaleString("id-ID")}
              </span>
            </div>
            <Progress
              value={progress}
              aria-label="Progres menuju reward berikutnya"
              className="mt-2 bg-primary-foreground/25 [&_[data-slot=progress-indicator]]:bg-[#F4D06F]"
            />
          </div>
        </section>

        <div
          className="flex gap-2"
          role="group"
          aria-label="Filter reward"
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <section aria-label="Daftar reward" className="flex flex-col gap-3">
          {filtered.map((r) => {
            const Icon = rewardIcon(r.icon);
            const locked = balance < r.points;
            const pending = redeem.isPending && redeem.variables?.id === r.id;
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-foreground/10",
                  locked && "opacity-70"
                )}
              >
                <span className="flex size-13 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                  <span className="mt-1.5 inline-flex self-start rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {r.tag}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-2 py-1 text-xs font-bold text-amber-700">
                    <Coins className="size-3.5" aria-hidden />
                    {r.points.toLocaleString("id-ID")}
                  </span>
                  <button
                    type="button"
                    disabled={locked || pending}
                    onClick={() => redeem.mutate(r)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                      locked
                        ? "cursor-not-allowed bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {pending ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : null}
                    {locked ? `Kurang ${(r.points - balance).toLocaleString("id-ID")}` : pending ? "Menukar…" : "Tukar"}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <p className="flex items-center gap-2.5 rounded-2xl bg-accent/70 px-4 py-3.5 text-xs leading-relaxed text-muted-foreground">
          <Lightbulb className="size-5 shrink-0 text-primary" aria-hidden />
          Makin konsisten langkah harianmu, makin cepat poin terkumpul
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
