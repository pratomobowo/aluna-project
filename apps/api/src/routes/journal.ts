import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { journalEntries } from "../db/schema";
import { currentUser } from "../lib/session";

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.number().int().min(0).max(4),
  note: z.string().max(2000).optional().default("")
});

const listSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const journalRoutes = new Hono();

journalRoutes.get("/journal", zValidator("query", listSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { from, to } = c.req.valid("query");
  const conditions = [eq(journalEntries.userId, user.id)];
  if (from) conditions.push(gte(journalEntries.date, from));
  if (to) conditions.push(lte(journalEntries.date, to));

  const entries = await db
    .select()
    .from(journalEntries)
    .where(and(...conditions))
    .orderBy(desc(journalEntries.date));

  return c.json({ entries });
});

journalRoutes.post("/journal", zValidator("json", upsertSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { date, mood, note } = c.req.valid("json");

  const [saved] = await db
    .insert(journalEntries)
    .values({ userId: user.id, date, mood, note })
    .onConflictDoUpdate({
      target: [journalEntries.userId, journalEntries.date],
      set: { mood, note }
    })
    .returning();

  return c.json({ entry: saved });
});
