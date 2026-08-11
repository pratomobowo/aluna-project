import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, Package as PackageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import SlotPicker, { type Schedule } from "@/components/SlotPicker";
import { apiFetch } from "@/lib/api";
import type { Therapist } from "./Therapists";
import type { Package } from "./PaymentSuccess";

interface Booking {
  id: number;
  scheduleId: number;
  mode: string;
  price: number;
}

export default function PackageBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const packageId = params.get("packageId");
  const [therapistId, setTherapistId] = useState<string>("");
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: packages, isLoading: pkgLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
    retry: false,
  });

  const { data: therapists } = useQuery({
    queryKey: ["therapists"],
    queryFn: () => apiFetch<Therapist[]>("/api/therapists"),
    retry: false,
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules", therapistId],
    queryFn: () => apiFetch<Schedule[]>(`/api/schedules?therapistId=${therapistId}`),
    enabled: !!therapistId,
    retry: false,
  });

  const pkg = packages?.find((p) => String(p.id) === packageId);

  async function createBooking() {
    if (!selectedTime || !therapistId || !pkg) return;
    setSubmitting(true);
    try {
      const schedule = schedules?.find(
        (s) => s.date === selectedDate && s.time === selectedTime && s.mode === mode,
      );
      const res = await apiFetch<Booking>("/api/bookings", {
        method: "POST",
        body: { scheduleId: schedule?.id, mode, packageId: pkg.id },
      });
      navigate(`/package-payment?bookingId=${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat booking");
      setSubmitting(false);
    }
  }

  if (pkgLoading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="sr-only">Memuat…</span>
      </main>
    );
  }

  if (!pkg) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
        <div className="flex flex-col gap-4 px-5 py-10">
          <h1 className="font-serif text-3xl leading-tight">Paket tidak ditemukan</h1>
          <Button className="h-11 w-fit" asChild>
            <Link to="/">Ke Beranda</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-10">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/therapists" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Jadwalkan Sesi Paket</h1>
      </header>

      <div className="flex flex-col gap-5 px-5">
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3.5 ring-1 ring-primary/20">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageIcon className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">{pkg.name}</p>
            <p className="text-xs text-muted-foreground">Sesi ke-1 dari {pkg.sessions}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="pkg-therapist" className="text-xs font-semibold text-muted-foreground">
            Pilih Therapist
          </label>
          <div className="relative">
            <select
              id="pkg-therapist"
              value={therapistId}
              onChange={(e) => {
                setTherapistId(e.target.value);
                setSelectedDate(null);
                setSelectedTime(null);
              }}
              className="h-11 w-full appearance-none rounded-xl bg-card pl-3.5 pr-9 text-sm ring-1 ring-foreground/10 focus:ring-2 focus:ring-primary"
            >
              <option value="">Pilih therapist…</option>
              {therapists?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        </div>

        {therapistId && (
          <SlotPicker
            schedules={schedules ?? []}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            mode={mode}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
            onSelectMode={setMode}
          />
        )}

        <Button
          className="h-12 w-full gap-2 text-base"
          disabled={!selectedTime || submitting}
          onClick={createBooking}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ArrowRight className="size-4" aria-hidden />
          )}
          Lanjut ke Pembayaran
        </Button>
      </div>
    </main>
  );
}
