import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { pointsTransactions, redemptions, rewards } from "../db/schema";
import { currentUser } from "../lib/session";

export const pointRoutes = new Hono();

const earnSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1)
});

pointRoutes.get("/points", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const [balance] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsTransactions.amount}), 0)::int` })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id));

  const transactions = await db
    .select()
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, user.id))
    .orderBy(desc(pointsTransactions.createdAt));

  return c.json({ balance: balance.total, transactions });
});

// ponytail: no admin auth here — points awarding is trust-based in MVP, revisit with a real
// gamification/quest system when daily tasks are server-validated
pointRoutes.post("/points", zValidator("json", earnSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { amount, reason } = c.req.valid("json");
  const [tx] = await db.insert(pointsTransactions).values({ userId: user.id, amount, reason }).returning();
  return c.json(tx);
});

pointRoutes.post("/rewards/:id/redeem", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const rewardId = Number(c.req.param("id"));
  if (!Number.isInteger(rewardId)) return c.json({ error: "not_found" }, 404);

  const [reward] = await db
    .select()
    .from(rewards)
    .where(and(eq(rewards.id, rewardId), eq(rewards.active, true)))
    .limit(1);
  if (!reward) return c.json({ error: "not_found" }, 404);

  // ponytail: row lock per user so concurrent redeems can't overspend (TOCTOU fix)
  const redemption = await db.transaction(async (tx) => {
    await tx.execute(sql`select 1 from users where id = ${user.id} for update`);

    const [balanceRow] = await tx
      .select({ total: sql<number>`coalesce(sum(${pointsTransactions.amount}), 0)::int` })
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, user.id));
    const balance = balanceRow.total;

    if (balance < reward.points) {
      return { error: "insufficient_points" as const };
    }

    await tx.insert(pointsTransactions).values({
      userId: user.id,
      amount: -reward.points,
      reason: "redeem"
    });
    const [created] = await tx
      .insert(redemptions)
      .values({ userId: user.id, rewardId, pointsSpent: reward.points })
      .returning();
    return created;
  });

  if ("error" in redemption) {
    return c.json({ error: "insufficient_points" }, 400);
  }

  return c.json(redemption);
});
