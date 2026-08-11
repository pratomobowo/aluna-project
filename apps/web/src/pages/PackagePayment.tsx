import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Package as PackageIcon,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Schedule } from "@/components/SlotPicker";
import type { Package } from "./PaymentSuccess";

const rupiah = new Intl.NumberFormat("id-ID");

interface Booking {
  id: number;
  therapistId: number;
  therapistName: string | null;
  scheduleId: number;
  packageId: number | null;
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

export default function PackagePayment() {
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

  const { data: packages } = useQuery({
    queryKey: ["packages"],
    queryFn: () => apiFetch<Package[]>("/api/packages"),
    enabled: !!booking?.packageId,
    retry: false,
  });

  const pkg = packages?.find((p) => p.id === booking?.packageId);

  async function pay() {
    if (!bookingId) return;
    setPaying(true);
    try {
      const created = await apiFetch<{ transactionId: number }>("/api/payments/create", {
        method: "POST",
        body: { type: "package", bookingId: Number(bookingId) },
      });
      await apiFetch<{ ok: boolean }>("/api/payments/mock-complete", {
        method: "POST",
        body: { transactionId: created.transactionId },
      });
      navigate(`/package-success?bookingId=${bookingId}`);
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

  const perSession = pkg ? Math.round(pkg.price / pkg.sessions) : booking.price;
  const dateTime = schedule
    ? `${formatDate(new Date(`${schedule.date}T00:00:00`))} · ${schedule.time}`
    : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pb-10">
      <header className="flex items-center gap-2 px-5 pb-3 pt-6">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/booking-package" aria-label="Kembali">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </Button>
        <h1 className="font-serif text-2xl">Pembayaran Paket</h1>
      </header>

      <div className="flex flex-col gap-5 px-5">
        <Card className="bg-card p-4">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground">Ringkasan Paket</p>
            <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PackageIcon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{pkg?.name ?? "Paket"}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg ? `${pkg.sessions}x sesi · ` : ""}Dr. {booking.therapistName ?? ""}
                </p>
              </div>
              {pkg && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-foreground">
                  Hemat {pkg.discountPercent}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>Sesi 1: {dateTime ?? "Memuat jadwal…"}</span>
            </div>
            <div className="my-1 h-px bg-foreground/10" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Harga normal</span>
              <span>Rp {rupiah.format(perSession)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diskon 50%</span>
              <span className="font-semibold text-primary">
                −Rp {rupiah.format(perSession / 2)}
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
          <div className="flex flex-col gap-2">
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
