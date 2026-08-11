import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SlotPicker, { type Schedule } from "@/components/SlotPicker";
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

interface Booking {
  id: number;
  scheduleId: number;
  mode: string;
  price: number;
}

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const therapistId = params.get("therapistId");
  const [mode, setMode] = useState<"online" | "offline">("online");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: therapist, isLoading, isError } = useQuery({
    queryKey: ["therapist", therapistId],
    queryFn: () => apiFetch<Therapist>(`/api/therapists/${therapistId}`),
    enabled: !!therapistId,
    retry: false,
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules", therapistId],
    queryFn: () => apiFetch<Schedule[]>(`/api/schedules?therapistId=${therapistId}`),
    enabled: !!therapistId,
    retry: false,
  });

  async function createBooking() {
    if (!selectedTime || !therapistId) return;
    setSubmitting(true);
    try {
      const schedule = schedules?.find(
        (s) => s.date === selectedDate && s.time === selectedTime && s.mode === mode,
      );
      const res = await apiFetch<Booking>("/api/bookings", {
        method: "POST",
        body: { scheduleId: schedule?.id, mode },
      });
      navigate(`/payment?bookingId=${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat booking");
      setSubmitting(false);
    }
  }

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
          <h1 className="font-serif text-3xl leading-tight">Therapist tidak ditemukan</h1>
          <Button className="h-11 w-fit" asChild>
            <Link to="/therapists">Lihat therapist lain</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-10">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to={`/therapists/${therapist.id}`} aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Booking Sesi</h1>
      </header>

      <div className="flex flex-col gap-5 px-5">
        <Card className="bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {initials(therapist.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{therapist.name}</p>
              <p className="text-xs text-muted-foreground">60 menit</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">
                Rp {rupiah.format(therapist.price / 2)}
              </p>
              <p className="text-[11px] text-muted-foreground line-through">
                Rp {rupiah.format(therapist.price)}
              </p>
            </div>
          </div>
        </Card>

        <SlotPicker
          schedules={schedules ?? []}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          mode={mode}
          onSelectDate={setSelectedDate}
          onSelectTime={setSelectedTime}
          onSelectMode={setMode}
        />

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
