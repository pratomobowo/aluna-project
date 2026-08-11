import { Hono } from "hono";
import { arrayContains, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { schedules, therapists } from "../db/schema";

export const therapistRoutes = new Hono();

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
