import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Schedule } from "@/components/SlotPicker";
import type { Package } from "./PaymentSuccess";

interface Booking {
  id: number;
  therapistId: number;
  scheduleId: number;
  packageId: number | null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default function PackageSuccess() {
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
    queryFn: () => apiFetch<Schedule[]>(`/api/schedules?therapistId=${booking?.therapistId}`),
    enabled: !!booking,
    select: (list) => list.find((s) => s.id === booking?.scheduleId),
    retry: false,
  });

  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
    enabled: !!booking?.packageId,
    retry: false,
  });

  const pkg = packages?.find((p) => p.id === booking?.packageId);

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
    ? `${formatDate(new Date(`${schedule.date}T00:00:00`))}`
    : "";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-primary via-primary to-primary/70 px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
          <Sprout className="size-8 text-white" aria-hidden />
        </span>
        <div>
          <h1 className="font-serif text-[1.75rem] leading-tight font-semibold text-white">
            Selamat!
            <br />
            Perjalananmu dimulai hari ini
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Kamu resmi memulai perjalanan bersama Aluna
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 rounded-2xl bg-white/15 p-4">
          <p className="text-sm font-semibold text-white">
            {pkg ? `${pkg.name} — ${pkg.sessions} Sesi` : "Paket"}
          </p>
          <div className="flex items-center justify-center gap-1.5" aria-hidden>
            {Array.from({ length: pkg?.sessions ?? 1 }).map((_, i) => (
              <span
                key={i}
                className={
                  i === 0
                    ? "h-2 w-6 rounded-full bg-white"
                    : "size-2 rounded-full bg-white/40"
                }
              />
            ))}
          </div>
          <p className="text-xs text-white/80">Sesi 1 dari {pkg?.sessions ?? "…"}</p>
          {dateTime && <p className="text-xs text-white/70">{dateTime}</p>}
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <Button
            className="h-12 w-full bg-white text-primary text-base font-bold hover:bg-white/90"
            onClick={() => navigate("/")}
          >
            Mulai Sekarang
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </main>
  );
}
