import { useMemo } from "react";
import { Building2, Video } from "lucide-react";

export interface Schedule {
  id: number;
  therapistId: number;
  date: string;
  time: string;
  mode: "online" | "offline";
  booked: boolean;
}

export interface SlotPickerProps {
  schedules: Schedule[];
  selectedDate: string | null;
  selectedTime: string | null;
  mode: "online" | "offline";
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string | null) => void;
  onSelectMode: (mode: "online" | "offline") => void;
}

const DAY_ABBR = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function SlotPicker({
  schedules,
  selectedDate,
  selectedTime,
  mode,
  onSelectDate,
  onSelectTime,
  onSelectMode,
}: SlotPickerProps) {
  const dates = useMemo(() => {
    const set = new Set(schedules.map((s) => s.date));
    const unique = [...set].sort();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + 13);
    return unique.filter((d) => {
      const dt = new Date(`${d}T00:00:00`);
      return dt >= today && dt <= cutoff;
    });
  }, [schedules]);

  const timeSlots = useMemo(
    () =>
      schedules
        .filter((s) => s.date === selectedDate && s.mode === mode)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [schedules, selectedDate, mode],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-muted-foreground">Mode Sesi</p>
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Mode sesi">
          {(["online", "offline"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onSelectMode(m)}
              aria-pressed={mode === m}
              className={
                mode === m
                  ? "flex h-11 items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
                  : "flex h-11 items-center justify-center gap-2 rounded-xl bg-card font-medium text-muted-foreground ring-1 ring-foreground/10"
              }
            >
              {m === "online" ? (
                <Video className="size-4" aria-hidden />
              ) : (
                <Building2 className="size-4" aria-hidden />
              )}
              {m === "online" ? "Online" : "Offline"}
            </button>
          ))}
        </div>
      </div>

      {dates.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Pilih Tanggal</p>
          <div
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
            role="list"
            aria-label="Pilih tanggal"
          >
            {dates.map((d) => {
              const dt = new Date(`${d}T00:00:00`);
              const active = d === selectedDate;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onSelectDate(d);
                    onSelectTime(null);
                  }}
                  aria-pressed={active}
                  className={
                    active
                      ? "flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl bg-primary py-2.5 text-primary-foreground"
                      : "flex w-14 shrink-0 flex-col items-center gap-0.5 rounded-xl bg-card py-2.5 text-foreground ring-1 ring-foreground/10"
                  }
                >
                  <span className="text-[10px] font-medium opacity-80">
                    {DAY_ABBR[dt.getDay()]}
                  </span>
                  <span className="text-sm font-semibold">{dt.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground">Pilih Waktu</p>
          {timeSlots.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada slot tersedia pada tanggal ini.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Pilih waktu">
              {timeSlots.map((s) => {
                const active = s.time === selectedTime;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={s.booked}
                    onClick={() => onSelectTime(active ? null : s.time)}
                    aria-pressed={active}
                    className={
                      s.booked
                        ? "rounded-xl bg-muted py-2.5 text-sm text-muted-foreground/50 line-through"
                        : active
                          ? "rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                          : "rounded-xl bg-card py-2.5 text-sm ring-1 ring-foreground/10"
                    }
                  >
                    {s.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
