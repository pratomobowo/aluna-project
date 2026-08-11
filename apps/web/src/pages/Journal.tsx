import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Frown, Heart, Laugh, Meh, NotebookPen, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

interface Entry {
  date: string;
  mood: number;
  note: string;
}

const KEY = "aluna-journal";

// ponytail: journal v1.1 — localStorage only, belum ada backend
const MOODS = [
  { value: 1, Icon: Frown, label: "Sulit" },
  { value: 2, Icon: Meh, label: "Biasa" },
  { value: 3, Icon: Smile, label: "Cukup baik" },
  { value: 4, Icon: Laugh, label: "Baik" },
  { value: 5, Icon: Heart, label: "Sangat baik" },
];

const MOOD_ICONS: Record<number, typeof Frown> = {
  1: Frown,
  2: Meh,
  3: Smile,
  4: Laugh,
  5: Heart,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(key: string) {
  return new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function load(): Entry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function Journal() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState<number>(3);
  const [note, setNote] = useState("");

  useEffect(() => {
    setEntries(load());
  }, []);

  const today = todayKey();
  const todayEntry = entries.find((e) => e.date === today);

  const history = useMemo(
    () =>
      [...entries]
        .filter((e) => e.date !== today)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries, today]
  );

  function save() {
    const next: Entry[] = [
      ...entries.filter((e) => e.date !== today),
      { date: today, mood, note: note.trim() },
    ];
    localStorage.setItem(KEY, JSON.stringify(next));
    setEntries(next);
    setNote("");
    toast.success("Check-in tersimpan");
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-24">
      <header className="px-5 pb-4 pt-6">
        <h1 className="font-serif text-2xl">Journal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ruang aman untuk mencatat perasaanmu hari ini.
        </p>
      </header>

      <div className="flex flex-col gap-6 px-5">
        <section aria-label="Check-in hari ini" className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-serif text-lg">Check-in hari ini</h2>
          <div className="mt-3 flex items-center justify-between gap-1">
            {MOODS.map(({ value, Icon, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mood === value}
                aria-label={label}
                title={label}
                onClick={() => setMood(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2.5 py-2 transition-colors",
                  mood === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-6" aria-hidden />
              </button>
            ))}
          </div>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ceritakan sedikit…"
            className="mt-3 h-10 rounded-xl bg-background ring-1 ring-foreground/10"
            aria-label="Catatan check-in"
          />
          <Button className="mt-3 h-10 w-full" onClick={save}>
            Simpan
          </Button>
          {todayEntry && (
            <p className="mt-3 text-xs text-muted-foreground">
              Check-inmu hari ini sudah tersimpan dengan mood{" "}
              <span className="font-semibold text-primary">
                {MOODS.find((m) => m.value === todayEntry.mood)?.label.toLowerCase()}
              </span>
              .
            </p>
          )}
        </section>

        <section aria-label="Riwayat">
          <h2 className="mb-3 font-serif text-lg">Riwayat</h2>
          {history.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
              <NotebookPen className="size-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Belum ada catatan. Tulis check-in pertamamu.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((e) => {
                const MoodIcon = MOOD_ICONS[e.mood] ?? Smile;
                return (
                  <div key={e.date} className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MoodIcon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">{formatDate(e.date)}</p>
                      <p className="mt-1 break-words text-sm">{e.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
