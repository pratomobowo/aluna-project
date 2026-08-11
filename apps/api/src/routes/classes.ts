import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { classes } from "../db/schema";
import { currentUser } from "../lib/session";
import { isAdmin } from "../lib/admin";

export const classRoutes = new Hono();

const classSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  mode: z.enum(["online", "offline"]),
  price: z.number().int().min(0).default(0),
  category: z.string().min(1),
  icon: z.string().optional()
});

async function requireAdmin(c: import("hono").Context) {
  if (!(await currentUser(c))) return c.json({ error: "unauthorized" }, 401);
  if (!(await isAdmin(c))) return c.json({ error: "forbidden" }, 403);
  return null;
}

classRoutes.get("/classes", async (c) => {
  return c.json(await db.select().from(classes).orderBy(asc(classes.date), asc(classes.time)));
});

classRoutes.post("/classes", zValidator("json", classSchema), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const [created] = await db.insert(classes).values(c.req.valid("json")).returning();
  return c.json(created);
});

classRoutes.put("/classes/:id", zValidator("json", classSchema.partial()), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  const [updated] = await db.update(classes).set(c.req.valid("json")).where(eq(classes.id, id)).returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});

classRoutes.delete("/classes/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  await db.delete(classes).where(eq(classes.id, id));
  return c.json({ ok: true });
});
