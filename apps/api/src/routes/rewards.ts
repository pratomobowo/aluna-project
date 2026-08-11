import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { rewards } from "../db/schema";
import { currentUser } from "../lib/session";
import { isAdmin } from "../lib/admin";

export const rewardRoutes = new Hono();

const rewardSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tag: z.string().min(1),
  points: z.number().int().positive(),
  icon: z.string().optional(),
  active: z.boolean().optional()
});

async function requireAdmin(c: import("hono").Context) {
  if (!(await currentUser(c))) return c.json({ error: "unauthorized" }, 401);
  if (!(await isAdmin(c))) return c.json({ error: "forbidden" }, 403);
  return null;
}

rewardRoutes.get("/rewards", async (c) => {
  const rows = await db
    .select()
    .from(rewards)
    .where(eq(rewards.active, true))
    .orderBy(asc(rewards.points));
  return c.json(rows);
});

rewardRoutes.post("/rewards", zValidator("json", rewardSchema), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const [created] = await db.insert(rewards).values(c.req.valid("json")).returning();
  return c.json(created);
});

rewardRoutes.put("/rewards/:id", zValidator("json", rewardSchema.partial()), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  const [updated] = await db.update(rewards).set(c.req.valid("json")).where(eq(rewards.id, id)).returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});

rewardRoutes.delete("/rewards/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  await db.delete(rewards).where(eq(rewards.id, id));
  return c.json({ ok: true });
});
