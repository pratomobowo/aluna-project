import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { dailyTaskCompletions, pointsTransactions } from "../db/schema";
import { currentUser } from "../lib/session";

export const taskRoutes = new Hono();

function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

taskRoutes.get("/tasks/completions", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const completions = await db
    .select({ taskId: dailyTaskCompletions.taskId, date: dailyTaskCompletions.date, points: dailyTaskCompletions.points })
    .from(dailyTaskCompletions)
    .where(eq(dailyTaskCompletions.userId, user.id));

  return c.json({ completions });
});

const completeSchema = z.object({
  taskId: z.string().min(1),
  points: z.number().int().positive().max(100)
});

taskRoutes.post("/tasks/complete", zValidator("json", completeSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { taskId, points } = c.req.valid("json");
  const date = todayLocal();

  const result = await db.transaction(async (tx) => {
    const [completion] = await tx
      .insert(dailyTaskCompletions)
      .values({ userId: user.id, taskId, date, points })
      .onConflictDoNothing()
      .returning();

    if (!completion) return { duplicate: true as const };

    await tx.insert(pointsTransactions).values({
      userId: user.id,
      amount: points,
      reason: "daily_task"
    });
    return { duplicate: false as const };
  });

  return c.json({ ok: true, duplicate: result.duplicate });
});
