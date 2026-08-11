import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Loader2, MapPin, Search, Sparkles, Star } from "lucide-react";
import type { AssessmentResult } from "@aluna/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { halfPrice, initials } from "@/lib/utils";
import AppShell from "@/components/AppShell";

export interface Therapist {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  rating: string | null;
  sessionCount: number | null;
  price: number;
  location: string | null;
  experienceYears: number | null;
  image: string | null;
  bio: string | null;
}

const rupiah = new Intl.NumberFormat("id-ID");

const AVATAR_TONES = [
  "bg-primary text-primary-foreground",
  "bg-accent/70 text-accent-foreground",
  "bg-chart-2 text-primary-foreground",
  "bg-chart-4 text-primary-foreground",
];

export default function Therapists() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["therapists"],
    queryFn: () => apiFetch<Therapist[]>("/api/therapists"),
    retry: false,
  });

  const assessment = useQuery({
    queryKey: ["assessment-result"],
    queryFn: () => apiFetch<{ result: AssessmentResult | null }>("/api/assessment/result"),
    retry: false,
  });

  const primary = assessment.data?.result?.primary ?? null;
  const recommended = useQuery({
    queryKey: ["therapists", "dimension", primary],
    queryFn: () => apiFetch<Therapist[]>(`/api/therapists?dimension=${primary}`),
    enabled: !!primary,
    retry: false,
  });

  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("Semua");

  const specialties = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((t) => t.specialties.forEach((s) => set.add(s)));
    return [...set];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.filter((t) => {
      const matchesSpecialty =
        specialty === "Semua" || t.specialties.includes(specialty);
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.specialties.some((s) => s.toLowerCase().includes(q));
      return matchesSpecialty && matchesQuery;
    });
  }, [data, query, specialty]);

  const recommendedIds = useMemo(
    () => new Set((recommended.data ?? []).map((t) => t.id)),
    [recommended.data]
  );

  const shown = useMemo(() => {
    if (recommendedIds.size === 0) return { recommended: [], rest: filtered };
    const rec = filtered.filter((t) => recommendedIds.has(t.id));
    const rest = filtered.filter((t) => !recommendedIds.has(t.id));
    return { recommended: rec, rest };
  }, [filtered, recommendedIds]);

  return (
    <AppShell>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-12 lg:max-w-none">
      <header className="flex items-center gap-2 px-5 pb-2 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Pilih Therapist</h1>
      </header>

      <div className="flex flex-col gap-4 px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari therapist..."
            className="h-10 rounded-xl bg-card pl-9 ring-1 ring-foreground/10"
            aria-label="Cari therapist"
          />
        </div>

        <div
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
          role="group"
          aria-label="Filter spesialisasi"
        >
          {[`Semua`, ...specialties].map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={specialty === s}
              onClick={() => setSpecialty(s)}
              className={
                specialty === s
                  ? "shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "shrink-0 rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10"
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="sr-only">Memuat…</span>
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col gap-3 px-5 py-8">
          <h2 className="font-serif text-xl">Therapist belum tersedia</h2>
          <p className="text-sm text-muted-foreground">
            Coba lagi sebentar lagi ya.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 px-5 lg:grid-cols-2">
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tidak ada therapist yang cocok.
            </p>
          )}
          {shown.recommended.length > 0 && (
            <>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                Direkomendasikan untukmu
              </span>
              {shown.recommended.map((t, i) => (
                <TherapistCard key={t.id} t={t} index={i} />
              ))}
              {shown.rest.length > 0 && (
                <p className="mt-2 text-xs font-semibold text-muted-foreground">
                  Semua therapist
                </p>
              )}
            </>
          )}
          {shown.rest.map((t, i) => (
            <TherapistCard key={t.id} t={t} index={i} />
          ))}
        </div>
      )}
      </main>
    </AppShell>
  );
}

function TherapistCard({ t, index }: { t: Therapist; index: number }) {
  return (
    <Card className="bg-card p-4">
      <div className="flex gap-3">
        <span
          className={`flex size-13 shrink-0 items-center justify-center rounded-full text-base font-semibold ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
        >
          {initials(t.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{t.name}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {t.title} • {t.specialties.join(" & ")}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {t.rating && (
              <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                {t.rating}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="size-3.5" aria-hidden />
              {t.location === "Online" ? "Online" : t.location ?? "Online"}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              <s className="mr-1.5 text-[11px] font-normal text-muted-foreground">
                Rp{rupiah.format(t.price)}
              </s>
              <span className="text-primary">
                Rp{rupiah.format(halfPrice(t.price))}
              </span>
            </p>
            <Button size="sm" className="h-8 gap-0.5" asChild>
              <Link to={`/therapists/${t.id}`}>
                Lihat Profil
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
