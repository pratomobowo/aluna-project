import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Building2, CreditCard, Loader2, Lock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { initials } from "@/lib/utils";
import type { Schedule } from "@/components/SlotPicker";

const rupiah = new Intl.NumberFormat("id-ID");

interface Booking {
  id: number;
  therapistId: number;
  therapistName: string | null;
  scheduleId: number;
  mode: string;
  price: number;
}

const PAY_METHODS = [
  { icon: CreditCard, label: "Kartu Kredit / Debit", note: "" },
  { icon: Smartphone, label: "GoPay / OVO / Dana", note: "E-wallet" },
  { icon: Building2, label: "Transfer Bank", note: "BCA · BRI · Mandiri" },
];

function formatDate(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = params.get("bookingId");
  const [paying, setPaying] = useState(false);
  const [selected, setSelected] = useState(0);

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

  async function pay() {
    if (!bookingId) return;
    setPaying(true);
    try {
      const created = await apiFetch<{ transactionId: number }>("/api/payments/create", {
        method: "POST",
        body: { type: "session", bookingId: Number(bookingId) },
      });
      await apiFetch<{ ok: boolean }>("/api/payments/mock-complete", {
        method: "POST",
        body: { transactionId: created.transactionId },
      });
      navigate(`/payment-success?bookingId=${bookingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pembayaran gagal, coba lagi");
      setPaying(false);
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

  const fullPrice = booking.price * 2;
  const dateTime = schedule
    ? `${formatDate(new Date(`${schedule.date}T00:00:00`))} · ${schedule.time}`
    : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-10">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/therapists" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Pembayaran</h1>
      </header>

      <div className="flex flex-col gap-5 px-5">
        <Card className="bg-card p-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground">Ringkasan Sesi</p>
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials(booking.therapistName ?? "")}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{booking.therapistName}</p>
                <p className="text-xs text-muted-foreground">
                  {dateTime ?? "Memuat jadwal…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  60 menit · {booking.mode === "online" ? "Online" : "Offline"}
                </p>
              </div>
            </div>
            <div className="my-1 h-px bg-foreground/10" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Rp {rupiah.format(fullPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diskon 50%</span>
              <span className="font-semibold text-primary">
                −Rp {rupiah.format(booking.price)}
              </span>
            </div>
            <div className="my-1 h-px bg-foreground/10" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold">Total</span>
              <span className="font-serif text-xl font-bold text-primary">
                Rp {rupiah.format(booking.price)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Metode Pembayaran</p>
          <div className="flex flex-col gap-2" role="group" aria-label="Metode pembayaran">
            {PAY_METHODS.map((m, i) => (
              <button
                key={m.label}
                type="button"
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
                className={`flex items-center gap-3 rounded-xl bg-card p-3.5 text-left ring-1 ${
                  selected === i ? "ring-2 ring-primary" : "ring-foreground/10"
                }`}
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <m.icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{m.label}</span>
                  {m.note && (
                    <span className="block text-xs text-muted-foreground">{m.note}</span>
                  )}
                </span>
                <span
                  className={`flex size-4 items-center justify-center rounded-full border ${
                    selected === i ? "border-primary bg-primary" : "border-foreground/20"
                  }`}
                  aria-hidden
                >
                  {selected === i && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Button className="h-12 w-full gap-2 text-base" disabled={paying} onClick={pay}>
          {paying ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <CreditCard className="size-4" aria-hidden />
          )}
          Bayar — Rp {rupiah.format(booking.price)}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          Pembayaran aman &amp; terenkripsi
        </p>
      </div>
    </main>
  );
}
