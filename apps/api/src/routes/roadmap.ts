import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { personalizationFor, type AssessmentResult } from "@aluna/shared";
import { db } from "../db";
import { assessmentResults, transactions, unlocks } from "../db/schema";
import { currentUser } from "../lib/session";

export const roadmapRoutes = new Hono();

const UNLOCK_PRICE = 99000;

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

  const [unlock] = await db.select().from(unlocks).where(eq(unlocks.userId, user.id));
  if (unlock) {
    return c.json({ locked: false, roadmap: p.roadmap, goal: p.goal });
  }
  return c.json({
    locked: true,
    roadmap: p.roadmap.slice(0, 2),
    goal: p.goal,
    unlockPrice: UNLOCK_PRICE
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
