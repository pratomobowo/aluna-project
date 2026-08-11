import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DailyTask } from "@aluna/shared";

interface DailyTasksProps {
  pool: DailyTask[];
  className?: string;
}

export default function DailyTasks({ pool, className }: DailyTasksProps) {
  const [done, setDone] = useState<string[]>([]);

  if (pool.length === 0) return null;

  // ponytail: rotate daily by date seed; same task all day
  const task = pool[new Date().getDate() % pool.length];
  const active = done.includes(task.id);

  return (
    <section className={cn("flex flex-col gap-3", className)} aria-label="Langkah kecil hari ini">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg">Langkah kecil hari ini</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {done.length}/{pool.length} selesai
        </span>
      </div>

      <Card className="bg-card">
        <div className="flex items-center gap-4 px-4 py-4">
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground">+{task.points} poin</p>
          </div>
          <Button
            variant={active ? "secondary" : "default"}
            size="sm"
            className="gap-1.5"
            disabled={active}
            aria-label={active ? "Selesai" : `Tandai selesai: ${task.title}`}
            onClick={() => setDone((prev) => [...prev, task.id])}
          >
            <CheckCircle2 className="size-4" aria-hidden />
            {active ? "Selesai" : "Tandai"}
          </Button>
        </div>
      </Card>
    </section>
  );
}
