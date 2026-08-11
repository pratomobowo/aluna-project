import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ReminderBooking {
  id: number;
  therapistName: string | null;
  scheduleDate: string | null;
  scheduleTime: string | null;
  status: string;
}

const NOTIF_KEY = "aluna-notif-optin";
const FIRED_KEY = "aluna-notif-fired";

function bookingTime(b: ReminderBooking): number | null {
  if (!b.scheduleDate || !b.scheduleTime) return null;
  const t = new Date(`${b.scheduleDate}T${b.scheduleTime}`).getTime();
  return Number.isNaN(t) ? null : t;
}

function hasFired(bookingId: number, suffix: string) {
  try {
    const fired = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]") as string[];
    return fired.includes(`${bookingId}-${suffix}`);
  } catch {
    return false;
  }
}

function markFired(bookingId: number, suffix: string) {
  const fired = JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]") as string[];
  localStorage.setItem(FIRED_KEY, JSON.stringify([...fired, `${bookingId}-${suffix}`]));
}

// ponytail: MVP uses browser Notification API; real push (FCM/APNs) for mobile later
export default function SessionReminder() {
  const { data: bookings } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => apiFetch<ReminderBooking[]>("/api/bookings"),
    retry: false,
  });

  const confirmed = bookings?.filter((b) => b.status === "confirmed");
  const upcoming = confirmed?.filter((b) => bookingTime(b) != null)[0];
  const start = upcoming ? bookingTime(upcoming)! : null;
  const now = Date.now();
  const in24h = start != null && now <= start && start - now <= 24 * 3600 * 1000;
  const in1h = start != null && now <= start && start - now <= 3600 * 1000;

  useEffect(() => {
    if (!upcoming || start == null) return;
    if (typeof Notification === "undefined") return;
    if (localStorage.getItem(NOTIF_KEY) !== "granted") return;
    if (Notification.permission !== "granted") return;

    if (in24h && !in1h && !hasFired(upcoming.id, "day")) {
      new Notification("Sesi kamu sebentar lagi", {
        body: `${upcoming.scheduleDate} ${upcoming.scheduleTime} — ${upcoming.therapistName ?? "Sesi Aluna"}`,
      });
      markFired(upcoming.id, "day");
    }
    if (in1h && !hasFired(upcoming.id, "hour")) {
      new Notification("Sesi kamu dalam 1 jam", {
        body: `${upcoming.scheduleDate} ${upcoming.scheduleTime} — ${upcoming.therapistName ?? "Sesi Aluna"}`,
      });
      markFired(upcoming.id, "hour");
    }
  }, [upcoming?.id, start, in24h, in1h]);

  if (!upcoming || start == null) return null;

  const dateTime = new Date(start).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-primary/10 p-3.5 ring-1 ring-primary/20">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Bell className="size-4" aria-hidden />
      </span>
      <p className="text-sm font-medium text-primary">
        Sesi kamu: {dateTime}
        {upcoming.therapistName ? ` — ${upcoming.therapistName}` : ""}
      </p>
    </div>
  );
}
