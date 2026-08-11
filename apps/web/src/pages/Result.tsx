import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  CloudRain,
  Flame,
  Heart,
  Loader2,
  Lock,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  personalizationFor,
  type AssessmentResult,
  type Dimension,
  type DimensionScore,
} from "@aluna/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const DIMENSION_ICON: Record<Dimension, LucideIcon> = {
  anxiety: Brain,
  mood: CloudRain,
  stress: Flame,
  trauma: Heart,
  sleep: Moon,
  relationship: Heart,
  self_esteem: Sparkles,
};

const DIMENSION_LABEL: Record<Dimension, string> = {
  anxiety: "Kecemasan",
  mood: "Suasana Hati",
  stress: "Stres",
  trauma: "Trauma",
  sleep: "Tidur",
  relationship: "Relasi",
  self_esteem: "Harga Diri",
};

type Level = "Rendah" | "Sedang" | "Tinggi";

function levelFor(percent: number): Level {
  if (percent >= 66) return "Tinggi";
  if (percent >= 33) return "Sedang";
  return "Rendah";
}

const LEVEL_COLOR: Record<Level, string> = {
  Rendah: "bg-primary",
  Sedang: "bg-orange-400",
  Tinggi: "bg-red-500",
};

const LEVEL_TEXT: Record<Level, string> = {
  Rendah: "text-primary",
  Sedang: "text-orange-600",
  Tinggi: "text-red-600",
};

const NARRATIVE: Record<string, string> = {
  Baik: "Kamu berada dalam kondisi yang cukup sehat. Pertahankan kebiasaan baikmu dan tetap jaga keseimbangan hidup.",
  "Perlu Perhatian": "Kamu menunjukkan beberapa tanda yang perlu diperhatikan. Kamu tidak sendirian, dan langkah kecil bisa membantumu pulih.",
  "Butuh Dukungan": "Kamu sedang mengalami beban yang berat akhir-akhir ini. Sangat wajar untuk meminta bantuan — kamu berhak mendapat dukungan.",
};

function ResultBars({ dimensions }: { dimensions: DimensionScore[] }) {
  const top = [...dimensions].sort((a, b) => b.percent - a.percent).slice(0, 3);
  return (
    <Card className="bg-card">
      <CardContent className="flex flex-col gap-4 py-5">
        <h2 className="font-serif text-lg">Indikator Utama</h2>
        {top.map((dim) => {
          const level = levelFor(dim.percent);
          const Icon = DIMENSION_ICON[dim.dimension];
          return (
            <div key={dim.dimension}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  {DIMENSION_LABEL[dim.dimension]}
                </span>
                <span className={`text-xs font-semibold ${LEVEL_TEXT[level]}`}>{level}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${LEVEL_COLOR[level]}`}
                  style={{ width: `${Math.max(4, dim.percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function Result() {
  const location = useLocation();
  const submitted = useQuery({
    queryKey: ["session"],
    queryFn: getSession,
    retry: false,
  });

  const fromState = (location.state as { result?: AssessmentResult } | null)?.result;

  const fetched = useQuery({
    queryKey: ["assessment-result"],
    queryFn: () =>
      apiFetch<{ result: AssessmentResult | null }>("/api/assessment/result"),
    enabled: !fromState,
    retry: false,
  });

  const result = useMemo<AssessmentResult | null>(() => {
    if (fromState) return fromState;
    return fetched.data?.result ?? null;
  }, [fromState, fetched.data]);

  const loggedIn = !!submitted.data?.user;

  if (!result) {
    if (submitted.isLoading || fetched.isLoading) {
      return (
        <main className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="sr-only">Memuat…</span>
        </main>
      );
    }
    if (fetched.error) {
      return (
        <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-4 bg-background px-5 py-8">
          <h1 className="font-serif text-3xl leading-tight">Hasil tesmu sudah siap!</h1>
          <p className="text-sm text-muted-foreground">
            Masuk atau daftar biar hasil tesmu tersimpan dan bisa kamu akses kapan pun.
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            Datamu aman dan privat.
          </p>
          <Button className="mt-2 h-11 w-full gap-2" asChild>
            <Link to="/login">
              <ArrowRight className="size-4" aria-hidden />
              Masuk / Daftar — Lihat Hasilku
            </Link>
          </Button>
        </main>
      );
    }
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-2 bg-background px-5 py-8 text-center">
        <h1 className="font-serif text-2xl leading-tight">Belum ada hasil</h1>
        <p className="text-sm text-muted-foreground">
          Selesaikan assessment dulu ya.
        </p>
        <Button className="mt-2 h-11 w-full gap-2" asChild>
          <Link to="/assessment">
            <ArrowRight className="size-4" aria-hidden />
            Mulai Assessment
          </Link>
        </Button>
      </main>
    );
  }

  const { primary, overall, label } = result;
  const p = personalizationFor(primary);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-sm bg-background px-5 py-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hasil Tes — Overview
        </p>
        {!loggedIn && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Lock className="size-3" aria-hidden />
            Pratinjau
          </span>
        )}
      </div>
      <h1 className="mt-1 font-serif text-3xl leading-tight">Kondisi kamu saat ini</h1>

      <div className="mt-6 flex flex-col gap-5">
        <Card className="bg-card">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-24 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10">
              <span className="font-serif text-3xl font-semibold text-primary">
                {overall.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
            <div>
              <p className={`font-serif text-lg ${label === "Baik" ? "text-primary" : label === "Perlu Perhatian" ? "text-orange-600" : "text-red-600"}`}>
                {label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{NARRATIVE[label]}</p>
            </div>
          </CardContent>
        </Card>

        <ResultBars dimensions={result.dimensions} />

        <Card className="bg-card">
          <CardContent className="flex flex-col gap-4 py-5">
          <h2 className="font-serif text-lg">Ringkasan &amp; Rekomendasi</h2>
          {loggedIn ? (
            <>
              <p className="text-sm text-muted-foreground">
                Fokus utama saat ini adalah{" "}
                <span className="font-medium text-foreground">{DIMENSION_LABEL[primary].toLowerCase()}</span>.{" "}
                {NARRATIVE[label]}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {p.tag}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {p.goal.label}
                </span>
              </div>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 blur-[6px] select-none" aria-hidden>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Fokus utama saat ini adalah{" "}
                  <span className="font-medium text-foreground">{DIMENSION_LABEL[primary].toLowerCase()}</span>.{" "}
                  {NARRATIVE[label]}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {p.tag}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {p.goal.label}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-8 w-full rounded-lg bg-muted" />
                  <div className="h-8 w-full rounded-lg bg-muted" />
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30 px-4 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-foreground/10">
                  <Lock className="size-5 text-primary" aria-hidden />
                </span>
                <p className="text-sm font-medium">Ringkasan &amp; rekomendasi personalmu masih terkunci.</p>
                <p className="text-xs text-muted-foreground">
                  Daftar gratis untuk membuka peta pemulihan yang dibuat khusus untukmu. Datamu aman dan privat.
                </p>
                <Button className="mt-1 h-11 w-full gap-2" asChild>
                  <Link to="/register">
                    <ArrowRight className="size-4" aria-hidden />
                    Daftar &amp; Lihat Semuanya
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {!loggedIn ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Masuk
          </Link>{" "}
          untuk melihat hasilmu.
        </p>
      ) : (
        <div className="mt-6">
          <Button className="h-12 w-full gap-2" asChild>
            <Link to="/">
              <ArrowRight className="size-4" aria-hidden />
              Lihat Roadmap Kamu
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}
