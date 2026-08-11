import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Coins, Coffee, Flower2, Lightbulb, Salad, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

type Tab = "Semua" | "Diskon" | "Katalog";

interface Reward {
  title: string;
  desc: string;
  tag: string;
  points: number;
  locked?: boolean;
  Icon: typeof Coffee;
  tone: string;
}

// ponytail: poin sistem v1.1 — data statis, belum ada di DB
const POINTS = 0;
const NEXT_REWARD = 1000;

const REWARDS: Reward[] = [
  {
    title: "Teh Chamomile (min. 50rb)",
    desc: "Potongan 15rb untuk teh relaksasi",
    tag: "Katalog · Nutrisi",
    points: 300,
    Icon: Coffee,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "E-book Kelola Overthinking",
    desc: "Panduan digital dari psikolog",
    tag: "Katalog · Digital",
    points: 400,
    Icon: BookOpen,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Diskon 20rb sesi ke-2",
    desc: "Berlaku untuk booking berikutnya",
    tag: "Diskon · Konseling",
    points: 600,
    Icon: Ticket,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Kelas Healing grup gratis",
    desc: "Akses 1 kelas online",
    tag: "Katalog · Kelas",
    points: 1000,
    locked: true,
    Icon: Flower2,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Diskon 50rb Healthy Food",
    desc: "Paket makanan sehat mingguan",
    tag: "Diskon · Nutrisi",
    points: 1500,
    locked: true,
    Icon: Salad,
    tone: "bg-primary/10 text-primary",
  },
];

const TABS: Tab[] = ["Semua", "Diskon", "Katalog"];

export default function Redeem() {
  const [tab, setTab] = useState<Tab>("Semua");

  const rewards = REWARDS.filter((r) =>
    tab === "Semua" ? true : tab === "Diskon" ? r.tag.startsWith("Diskon") : !r.tag.startsWith("Diskon")
  );

  function redeem(r: Reward) {
    if (r.locked) return;
    // ponytail: poin sistem v1.1 — tukar belum berfungsi
    toast.info("Segera hadir");
  }

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
            {POINTS}
          </p>
          <p className="mt-2 text-xs text-primary-foreground/85">
            Kumpulin poin dari langkah harianmu, tukar jadi reward
          </p>
          <div className="mt-4 rounded-xl bg-primary-foreground/15 px-3.5 py-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-primary-foreground/90">
              <span>Menuju reward berikutnya</span>
              <span>
                {POINTS} / {NEXT_REWARD.toLocaleString("id-ID")}
              </span>
            </div>
            <Progress
              value={(POINTS / NEXT_REWARD) * 100}
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
          {rewards.map((r) => (
            <div
              key={r.title}
              className={cn(
                "flex items-center gap-3 rounded-2xl bg-card p-3.5 ring-1 ring-foreground/10",
                r.locked && "opacity-70"
              )}
            >
              <span className={cn("flex size-13 shrink-0 items-center justify-center rounded-xl", r.tone)}>
                <r.Icon className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{r.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
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
                  disabled={r.locked}
                  onClick={() => redeem(r)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    r.locked
                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {r.locked ? `Kurang ${(r.points - POINTS).toLocaleString("id-ID")}` : "Tukar"}
                </button>
              </div>
            </div>
          ))}
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
