import { Check, Coins, Coffee, NotebookPen, Sun } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { DailyTask } from "@aluna/shared";

interface DailyTasksProps {
  pool: DailyTask[];
  className?: string;
}

const TASK_ICONS = [NotebookPen, Sun, Coffee];

function todayLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ponytail: rotate daily by date seed; same task all day
export default function DailyTasks({ pool, className }: DailyTasksProps) {
  const queryClient = useQueryClient();

  const completions = useQuery({
    queryKey: ["task-completions", todayLocal()],
    queryFn: () =>
      apiFetch<{ completions: { taskId: string; date: string; points: number }[] }>(
        "/api/tasks/completions"
      ),
    retry: false,
  });

  const completeTask = useMutation({
    mutationFn: (task: DailyTask) =>
      apiFetch<{ ok: boolean; duplicate: boolean }>("/api/tasks/complete", {
        method: "POST",
        body: { taskId: task.id, points: task.points },
      }),
    onSuccess: async (res, task) => {
      await queryClient.invalidateQueries({ queryKey: ["task-completions"] });
      await queryClient.invalidateQueries({ queryKey: ["points"] });
      if (!res.duplicate) toast.success(`+${task.points} poin! Langkah selesai`);
    },
    onError: () => toast.error("Gagal menyimpan. Coba lagi."),
  });

  if (pool.length === 0) return null;

  const today = todayLocal();
  const doneIds = (completions.data?.completions ?? [])
    .filter((c) => c.date === today)
    .map((c) => c.taskId);

  const start = new Date().getDate() % pool.length;
  const order = Array.from({ length: pool.length }, (_, i) => pool[(start + i) % pool.length]);
  const activeIndex = doneIds.length;
  const active = order[activeIndex];
  const earned = order
    .slice(0, activeIndex)
    .reduce((sum, t) => sum + t.points, 0);
  const allDone = activeIndex >= pool.length;
  const peek1 = order[activeIndex + 1];
  const peek2 = order[activeIndex + 2];

  function handleComplete() {
    if (active && !completeTask.isPending) completeTask.mutate(active);
  }

  return (
    <section className={cn("flex flex-col gap-3", className)} aria-label="Langkah kecil hari ini">
      <h2 className="font-serif text-lg">Langkah kecil hari ini</h2>

      <div className="grid grid-cols-3 divide-x divide-border rounded-xl bg-card py-3 ring-1 ring-foreground/10">
        <div className="px-2 text-center">
          <p className="text-sm font-bold text-primary">{doneIds.length}/{pool.length}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Progress harian</p>
        </div>
        <div className="px-2 text-center">
          <p className="text-sm font-bold text-primary">{doneIds.length}/{pool.length}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Task selesai</p>
        </div>
        <div className="flex items-start justify-center gap-1 px-2">
          <Coins className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-bold text-primary">{earned}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Poin hari ini</p>
          </div>
        </div>
      </div>

      {allDone ? (
        <Card className="bg-card">
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="size-6" aria-hidden />
            </span>
            <p className="font-serif text-xl">Semua langkah selesai!</p>
            <p className="text-xs text-muted-foreground">
              Kamu mengumpulkan {earned} poin hari ini. Sampai jumpa besok.
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative mt-4 pb-1" aria-label="Tumpukan langkah harian">
          {peek2 && <Card className="absolute inset-x-3 -top-4 rounded-xl bg-muted/70 ring-1 ring-foreground/5" aria-hidden />}
          {peek1 && (
            <Card className="absolute inset-x-1.5 -top-2 rounded-xl bg-card ring-1 ring-foreground/10" aria-hidden>
              <div className="flex items-center gap-3 px-4 py-4 opacity-70">
                <TaskIcon title={peek1.title} />
                <p className="line-clamp-1 text-sm font-medium">{peek1.title}</p>
              </div>
            </Card>
          )}
          <Card className="relative bg-card ring-1 ring-foreground/10">
            <div className="flex items-center gap-3 px-4 py-4">
              <TaskIcon title={active.title} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="line-clamp-1 font-medium">{active.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                    Refleksi
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Coins className="size-3" aria-hidden />
                    +{active.points}
                  </span>
                  <span className="hidden min-[380px]:inline">Sebelum tidur</span>
                </div>
              </div>
              <button
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
                aria-label={`Tandai selesai: ${active.title}`}
                disabled={completeTask.isPending}
                onClick={handleComplete}
              >
                {completeTask.isPending ? (
                  <Check className="size-5 opacity-40" aria-hidden />
                ) : (
                  <Check className="size-5" aria-hidden />
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
}

function TaskIcon({ title }: { title: string }) {
  const Icon = TASK_ICONS[Math.abs([...title].reduce((a, c) => a + c.charCodeAt(0), 0)) % TASK_ICONS.length];
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}
