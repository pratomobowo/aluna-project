import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";
import { personalizationFor, UNLOCK_PRICE, type AssessmentResult } from "@aluna/shared";
import { db } from "../db";
import { assessmentResults, bookings, pointsTransactions, transactions, unlocks } from "../db/schema";
import { currentUser } from "../lib/session";

export const roadmapRoutes = new Hono();

// ponytail: roadmap progress derived from real activity, not a stored counter:
// step 1 = assessment done, step 2 = >=1 confirmed booking, step 3 = >=20 earned points.
// Raise the points threshold / add more steps later.
async function computeProgress(userId: string) {
  const [assessment] = await db
    .select({ id: assessmentResults.id })
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, userId))
    .limit(1);

  const [booking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.userId, userId), eq(bookings.status, "confirmed")))
    .limit(1);

  const [points] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsTransactions.amount}), 0)::int` })
    .from(pointsTransactions)
    .where(and(eq(pointsTransactions.userId, userId), sql`${pointsTransactions.amount} > 0`));

  let completedSteps = 0;
  if (assessment) completedSteps = 1;
  if (booking) completedSteps = 2;
  if ((points.total ?? 0) >= 20) completedSteps = 3;

  return completedSteps;
}

roadmapRoutes.get("/roadmap", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const [resultRow] = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, user.id))
    .orderBy(desc(assessmentResults.createdAt))
    .limit(1);
  if (!resultRow) return c.json({ error: "no_assessment" }, 404);

  const result = resultRow.result as AssessmentResult;
  const p = personalizationFor(result.primary);
  const totalSteps = p.roadmap.length;
  const completedSteps = await computeProgress(user.id);

  const [unlock] = await db.select().from(unlocks).where(eq(unlocks.userId, user.id));
  if (unlock) {
    return c.json({
      locked: false,
      roadmap: p.roadmap,
      goal: p.goal,
      progress: { completedSteps, totalSteps, current: completedSteps + 1, percent: Math.round((completedSteps / totalSteps) * 100) }
    });
  }
  return c.json({
    locked: true,
    roadmap: p.roadmap.slice(0, 2),
    goal: p.goal,
    unlockPrice: UNLOCK_PRICE,
    progress: { completedSteps, totalSteps, current: Math.min(completedSteps + 1, totalSteps), percent: Math.round((completedSteps / totalSteps) * 100) }
  });
});

roadmapRoutes.post("/unlock", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const [existing] = await db.select().from(unlocks).where(eq(unlocks.userId, user.id));
  if (existing) return c.json({ unlocked: true });

  const [paid] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, user.id), eq(transactions.type, "unlock"), eq(transactions.status, "paid")))
    .limit(1);
  if (!paid) return c.json({ error: "unlock_not_paid" }, 402);

  const [resultRow] = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, user.id))
    .orderBy(desc(assessmentResults.createdAt))
    .limit(1);
  if (!resultRow) return c.json({ error: "no_assessment" }, 404);

  await db.insert(unlocks).values({ userId: user.id, paidAt: new Date() });

  const result = resultRow.result as AssessmentResult;
  const p = personalizationFor(result.primary);
  return c.json({ unlocked: true, roadmap: p.roadmap });
});
