import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { arrayContains, asc, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { schedules, therapists } from "../db/schema";
import { currentUser } from "../lib/session";
import { isAdmin } from "../lib/admin";

export const therapistRoutes = new Hono();

const therapistSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  specialties: z.array(z.string()).min(1),
  rating: z.number().optional().transform((v) => (v == null ? undefined : v.toFixed(1))),
  sessionCount: z.number().int().optional(),
  price: z.number().int().positive(),
  location: z.string().optional(),
  experienceYears: z.number().int().optional(),
  bio: z.string().optional(),
  image: z.string().optional()
});

async function requireAdmin(c: import("hono").Context) {
  if (!(await currentUser(c))) return c.json({ error: "unauthorized" }, 401);
  if (!(await isAdmin(c))) return c.json({ error: "forbidden" }, 403);
  return null;
}

therapistRoutes.get("/therapists", async (c) => {
  const specialty = c.req.query("specialty");
  const location = c.req.query("location");
  let q = db.select().from(therapists).orderBy(asc(therapists.id)).$dynamic();
  if (specialty) q = q.where(arrayContains(therapists.specialties, [specialty]));
  if (location) q = q.where(eq(therapists.location, location));
  return c.json(await q);
});

therapistRoutes.get("/therapists/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  const [therapist] = await db.select().from(therapists).where(eq(therapists.id, id)).limit(1);
  if (!therapist) return c.json({ error: "not_found" }, 404);
  return c.json(therapist);
});

therapistRoutes.post("/therapists", zValidator("json", therapistSchema), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const [created] = await db.insert(therapists).values(c.req.valid("json")).returning();
  return c.json(created);
});

therapistRoutes.put("/therapists/:id", zValidator("json", therapistSchema.partial()), async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  const [updated] = await db.update(therapists).set(c.req.valid("json")).where(eq(therapists.id, id)).returning();
  if (!updated) return c.json({ error: "not_found" }, 404);
  return c.json(updated);
});

therapistRoutes.delete("/therapists/:id", async (c) => {
  const denied = await requireAdmin(c);
  if (denied) return denied;
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "not_found" }, 404);
  await db.delete(therapists).where(eq(therapists.id, id));
  return c.json({ ok: true });
});

therapistRoutes.get("/schedules", async (c) => {
  const therapistId = Number(c.req.query("therapistId"));
  if (!Number.isInteger(therapistId)) return c.json({ error: "therapistId_required" }, 400);
  return c.json(
    await db
      .select()
      .from(schedules)
      .where(eq(schedules.therapistId, therapistId))
      .orderBy(asc(schedules.date), asc(schedules.time))
  );
});
