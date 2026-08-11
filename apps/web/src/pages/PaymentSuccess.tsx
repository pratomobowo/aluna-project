import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Schedule } from "@/components/SlotPicker";

const rupiah = new Intl.NumberFormat("id-ID");

interface Booking {
  id: number;
  therapistId: number;
  therapistName: string | null;
  scheduleId: number;
  price: number;
}

export interface Package {
  id: number;
  name: string;
  sessions: number;
  price: number;
  discountPercent: number;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

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

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId");

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<Booking[]>("/api/bookings"),
    retry: false,
  });

  const booking = bookings?.find((b) => String(b.id) === bookingId);

  const { data: schedule } = useQuery({
    queryKey: ["schedule", booking?.scheduleId],
    queryFn: () =>
      apiFetch<Schedule[]>(`/api/schedules?therapistId=${booking?.therapistId}`).then(
        (list) => list.find((s) => s.id === booking?.scheduleId),
      ),
    enabled: !!booking,
    retry: false,
  });

  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
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

  if (isError || !booking) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <div className="flex flex-col gap-4 px-5 py-10">
          <h1 className="font-serif text-3xl leading-tight">Booking tidak ditemukan</h1>
          <Button className="h-11 w-fit" asChild>
            <Link to="/">Ke Beranda</Link>
          </Button>
        </div>
      </main>
    );
  }

  const dateTime = schedule
    ? `${formatDate(new Date(`${schedule.date}T00:00:00`))} · ${schedule.time}`
    : "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 bg-primary/10 px-5 py-10">
      <div className="flex flex-col items-center gap-4">
        <span className="flex size-22 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30">
          <Check className="size-10 text-primary-foreground" aria-hidden />
        </span>
        <div className="text-center">
          <h1 className="font-serif text-3xl leading-tight">Booking Berhasil</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sesi kamu sudah terjadwal.</p>
        </div>
      </div>

      <Card className="bg-card p-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground">Detail Sesi</p>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(booking.therapistName ?? "")}
            </span>
            <p className="text-sm font-medium">{booking.therapistName}</p>
          </div>
          <div className="my-1 h-px bg-foreground/10" />
          <p className="text-sm text-muted-foreground">{dateTime}</p>
          <p className="text-sm font-semibold text-primary">Terbayar — Rp {rupiah.format(booking.price)}</p>
        </div>
      </Card>

      <section aria-label="Rekomendasi paket" className="flex flex-col gap-3">
        <div className="flex items-start gap-2.5 rounded-xl bg-primary/10 p-3.5 ring-1 ring-primary/20">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Lightbulb className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Rekomendasi dari Kami</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Minimal 6 sesi konseling menghasilkan perubahan signifikan. Yuk mulai paket!
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {packages?.map((p) => {
            const original = Math.round(p.price / (1 - p.discountPercent / 100));
            return (
              <Card key={p.id} className="bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sessions}x sesi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-primary">
                      Rp {rupiah.format(p.price)}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-through">
                      Rp {rupiah.format(original)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                    Hemat {p.discountPercent}%
                  </span>
                  <Button size="sm" className="h-8 gap-1" asChild>
                    <Link to={`/booking-package?packageId=${p.id}`}>
                      Pilih
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <Button variant="ghost" className="h-11 w-full" onClick={() => navigate("/")}>
        Lewati untuk Sekarang
      </Button>
    </main>
  );
}
