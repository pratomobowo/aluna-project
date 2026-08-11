import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import type { Goal, RoadmapStep } from "@aluna/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import TopBar from "@/components/TopBar";

interface RoadmapResponse {
  locked: boolean;
  roadmap: RoadmapStep[];
  goal: Goal;
  unlockPrice?: number;
}

export async function fetchRoadmap() {
  return apiFetch<RoadmapResponse>("/api/roadmap");
}

export default function Roadmap() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["roadmap"],
    queryFn: fetchRoadmap,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-md bg-background">
        <TopBar />
        <div className="flex flex-col gap-4 px-5 py-8">
          <h1 className="font-serif text-3xl leading-tight">
            Roadmap belum siap
          </h1>
          <p className="text-sm text-muted-foreground">
            Kerjakan assessment dulu biar kami bisa susun rencana pemulihan yang
            sesuai untukmu.
          </p>
          <Button className="h-11 gap-2" asChild>
            <Link to="/assessment">
              <Sparkles className="size-4" aria-hidden />
              Mulai Assessment
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const { locked, roadmap, goal, unlockPrice } = data;
  const visible = roadmap;

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-12">
      <TopBar />
      <div className="flex flex-col gap-5 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Roadmap Personal
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">
            Rencana pemulihan untukmu
          </h1>
        </div>

        {locked ? (
          <>
            <Card className="bg-card">
              <CardContent className="flex flex-col gap-5 py-5">
                {visible.map((step, i) => (
                  <div key={step.order} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {step.order}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {i < visible.length - 1 && (
                      <span className="sr-only">Langkah berikutnya</span>
                    )}
                  </div>
                ))}

                <div className="relative">
                  <div
                    className="pointer-events-none flex flex-col gap-4 blur-[3.5px] select-none"
                    aria-hidden
                  >
                    {[3, 4, 5].map((n) => (
                      <div key={n} className="flex gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                          {n}
                        </span>
                        <div className="flex flex-1 flex-col gap-2">
                          <span className="h-4 w-2/3 rounded bg-muted" />
                          <span className="h-3 w-1/2 rounded bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex items-center gap-2 rounded-xl border bg-background/90 px-4 py-2 text-xs font-semibold text-muted-foreground">
                      <Lock className="size-3.5" aria-hidden />
                      3 langkah terkunci
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <UnlockPaywall
              price={unlockPrice ?? 99000}
              goalLabel={goal.label}
            />
          </>
        ) : (
          <Card className="bg-card">
            <CardContent className="flex flex-col gap-5 py-5">
              {roadmap.map((step, i) => {
                const done = i < 2;
                return (
                  <div key={step.order} className="flex gap-3">
                    {done ? (
                      <CheckCircle2
                        className="mt-0.5 size-8 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : (
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {step.order}
                      </span>
                    )}
                    <div className="flex flex-col gap-0.5">
                      <p
                        className={
                          done
                            ? "font-medium text-muted-foreground line-through"
                            : "font-medium"
                        }
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function UnlockPaywall({
  price,
  goalLabel,
}: {
  price: number;
  goalLabel: string;
}) {
  const formatted = new Intl.NumberFormat("id-ID").format(price);

  return (
    <Card className="border-primary/30 bg-primary text-primary-foreground">
      <CardContent className="flex flex-col gap-4 py-5">
        <div>
          <p className="text-xs opacity-85">Mau lihat roadmap lengkap?</p>
          <h2 className="mt-1 font-serif text-2xl leading-snug">
            Buka seluruh perjalanan menuju {goalLabel.toLowerCase()}
          </h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs opacity-80">Sekali bayar, akses seumur hidup</span>
          <span className="font-serif text-3xl font-semibold">Rp{formatted}</span>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0" aria-hidden />
            Roadmap lengkap & personal
          </li>
          <li className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0" aria-hidden />
            Voucher diskon konseling pertama
          </li>
        </ul>
        <UnlockButton price={formatted} />
      </CardContent>
    </Card>
  );
}

function UnlockButton({ price }: { price: string }) {
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");

  async function handleUnlock() {
    setStatus("processing");
    try {
      const { transactionId } = await apiFetch<{ transactionId: number }>(
        "/api/payments/create",
        { method: "POST", body: { type: "unlock" } }
      );
      await apiFetch("/api/payments/mock-complete", {
        method: "POST",
        body: { transactionId },
      });
      await apiFetch("/api/unlock", { method: "POST", body: {} });
      // refetch roadmap: full version now unlocked
      window.location.reload();
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Pembayaran gagal";
      console.error(msg);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="h-12 w-full gap-2 border-transparent bg-primary-foreground text-primary hover:bg-primary-foreground/90"
      disabled={status === "processing"}
      onClick={handleUnlock}
    >
      {status === "processing" ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <ArrowRight className="size-4" aria-hidden />
      )}
      {status === "processing"
        ? "Memproses…"
        : `Buka Roadmap Lengkap Rp${price}`}
    </Button>
  );
}
