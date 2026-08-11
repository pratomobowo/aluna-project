import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, desc } from "drizzle-orm";
import { computeAssessment } from "@aluna/shared";
import { db } from "../db";
import { assessmentResponses, assessmentResults } from "../db/schema";
import { currentUser } from "../lib/session";

const submitSchema = z.object({
  answers: z.array(z.number().min(0).max(3)).length(30)
});

export const assessmentRoutes = new Hono();

assessmentRoutes.post("/submit", zValidator("json", submitSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { answers } = c.req.valid("json");
  const result = computeAssessment(answers);

  await db.insert(assessmentResponses).values({ userId: user.id, answers });
  const [saved] = await db
    .insert(assessmentResults)
    .values({ userId: user.id, result, safetyTriggered: result.safetyTriggered })
    .returning();

  return c.json({ id: saved.id, result });
});

assessmentRoutes.get("/result", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const rows = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, user.id))
    .orderBy(desc(assessmentResults.createdAt))
    .limit(1);
  return c.json({ result: rows[0] ?? null });
});
