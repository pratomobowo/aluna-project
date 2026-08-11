import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { communities } from "../db/schema";
import { currentUser } from "../lib/session";
import { isAdmin } from "../lib/admin";

export const communityRoutes = new Hono();

const communitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberCount: z.number().int().min(0).default(0),
  schedule: z.string().optional(),
  icon: z.string().optional()
});

async function requireAdmin(c: import("hono").Context) {
  if (!(await currentUser(c))) return c.json({ error: "unauthorized" }, 401);
  if (!(await isAdmin(c))) return c.json({ error: "forbidden" }, 403);
  return null;
}

communityRoutes.get("/communities", async (c) => {
  return c.json(await db.select().from(communities).orderBy(asc(communities.id)));
});

communityRoutes.post("/communities", zValidator("json", communitySchema), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const [created] = await db.insert(communities).values(c.req.valid("json")).returning();
  return c.json(created);
});

communityRoutes.put("/communities/:id", zValidator("json", communitySchema.partial()), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  const [updated] = await db.update(communities).set(c.req.valid("json")).where(eq(communities.id, id)).returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});

communityRoutes.delete("/communities/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  await db.delete(communities).where(eq(communities.id, id));
  return c.json({ ok: true });
});
