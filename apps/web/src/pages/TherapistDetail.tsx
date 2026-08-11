import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Therapist } from "./Therapists";

const rupiah = new Intl.NumberFormat("id-ID");

function initials(name: string) {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "T"
  );
}

export default function TherapistDetail() {
  const { id } = useParams();

  const { data: therapist, isLoading, isError } = useQuery({
    queryKey: ["therapist", id],
    queryFn: () => apiFetch<Therapist>(`/api/therapists/${id}`),
    retry: false,
  });

  if (isLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </main>
    );
  }

  if (isError || !therapist) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <div className="flex flex-col gap-4 px-5 py-10">
          <h1 className="font-serif text-3xl leading-tight">
            Therapist tidak ditemukan
          </h1>
          <p className="text-sm text-muted-foreground">
            Profil yang kamu cari tidak ada atau sudah tidak tersedia.
          </p>
          <Button className="h-11 w-fit" asChild>
            <Link to="/therapists">Lihat therapist lain</Link>
          </Button>
        </div>
      </main>
    );
  }

  const fullPrice = `Rp ${rupiah.format(therapist.price)}`;
  const halfPrice = `Rp ${rupiah.format(therapist.price / 2)}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <div className="flex flex-col gap-4 bg-primary/10 px-5 pb-6 pt-6">
        <Button variant="ghost" size="icon" className="size-8 self-start" asChild>
          <Link to="/therapists" aria-label="Kembali ke daftar therapist">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <span className="flex size-18 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {initials(therapist.name)}
          </span>
          <div>
            <h1 className="font-serif text-xl leading-snug">{therapist.name}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {therapist.title}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {therapist.specialties.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-card px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-foreground/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-card">
          <CardContent className="flex items-stretch divide-x divide-foreground/10 px-0 py-3">
            <div className="flex-1 text-center">
              <p className="flex items-center justify-center gap-0.5 font-serif text-lg font-semibold text-primary">
                <Star className="size-3.5 fill-accent text-accent" aria-hidden />
                {therapist.rating}
              </p>
              <p className="text-[11px] text-muted-foreground">Rating</p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-serif text-lg font-semibold text-primary">
                {therapist.sessionCount ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground">Sesi</p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-serif text-lg font-semibold text-primary">
                {therapist.experienceYears ?? 0} th
              </p>
              <p className="text-[11px] text-muted-foreground">Pengalaman</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        {therapist.bio && (
          <section aria-label="Tentang">
            <h2 className="mb-2 font-serif text-lg">Tentang</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {therapist.bio}
            </p>
          </section>
        )}

        <section aria-label="Ketersediaan">
          <h2 className="mb-2 font-serif text-lg">Ketersediaan</h2>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-card px-3 py-1 text-xs font-medium ring-1 ring-foreground/10">
              Sen–Jum
            </span>
            <span className="rounded-full bg-card px-3 py-1 text-xs font-medium ring-1 ring-foreground/10">
              09.00–17.00
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Check className="size-3.5" aria-hidden />
              Tersedia hari ini
            </span>
          </div>
        </section>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <div className="flex items-center gap-2">
            <p className="flex-1 text-base font-bold">
              <s className="mr-2 text-[13px] font-normal text-muted-foreground">
                {fullPrice}
              </s>
              <span className="text-primary">{halfPrice}</span>
            </p>
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
              50% off
            </span>
          </div>
          <Button className="h-12 w-full gap-2 text-base" asChild>
            <Link to={`/booking?therapistId=${therapist.id}`}>
              Pilih & Booking
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
