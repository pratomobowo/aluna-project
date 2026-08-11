import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { bookings, packages, schedules, therapists } from "../db/schema";
import { currentUser } from "../lib/session";

export const bookingRoutes = new Hono();

const bookingSchema = z.object({
  scheduleId: z.number().int(),
  mode: z.enum(["online", "offline"]),
  packageId: z.number().int().optional()
});

bookingRoutes.post("/bookings", zValidator("json", bookingSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const body = c.req.valid("json");

  const [schedule] = await db.select().from(schedules).where(eq(schedules.id, body.scheduleId)).limit(1);
  if (!schedule) return c.json({ error: "not_found" }, 404);
  if (schedule.booked) return c.json({ error: "slot_taken" }, 409);
  if (schedule.mode !== body.mode) return c.json({ error: "mode_mismatch" }, 400);

  if (schedule.therapistId == null) return c.json({ error: "therapist_not_found" }, 404);
  const [therapist] = await db.select().from(therapists).where(eq(therapists.id, schedule.therapistId)).limit(1);
  if (!therapist) return c.json({ error: "therapist_not_found" }, 404);

  const [activeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookings)
    .where(and(eq(bookings.userId, user.id), inArray(bookings.status, ["pending", "confirmed"])));

  let price: number;
  let packageId: number | null = body.packageId ?? null;
  if (packageId) {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
    if (!pkg) return c.json({ error: "package_not_found" }, 404);
    const [pkgBookings] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(eq(bookings.userId, user.id), eq(bookings.packageId, packageId), inArray(bookings.status, ["pending", "confirmed"])));
    const base = Math.round(pkg.price / pkg.sessions);
    price = pkgBookings.count === 0 ? Math.round(base * 0.5) : base;
  } else {
    price = activeCount.count === 0 ? Math.round(therapist.price * 0.5) : therapist.price;
  }

  const booking = await db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(schedules)
      .set({ booked: true })
      .where(and(eq(schedules.id, body.scheduleId), eq(schedules.booked, false)))
      .returning();
    if (!claimed) throw new SlotTakenError();
    const [created] = await tx
      .insert(bookings)
      .values({
        userId: user.id,
        therapistId: schedule.therapistId,
        scheduleId: body.scheduleId,
        packageId,
        mode: body.mode,
        price,
        status: "pending"
      })
      .returning();
    return created;
  }).catch((e) => {
    if (e instanceof SlotTakenError) return null;
    throw e;
  });

  if (!booking) return c.json({ error: "slot_taken" }, 409);
  return c.json(booking);
});

bookingRoutes.get("/bookings", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const rows = await db
    .select({
      id: bookings.id,
      therapistId: bookings.therapistId,
      therapistName: therapists.name,
      scheduleId: bookings.scheduleId,
      packageId: bookings.packageId,
      mode: bookings.mode,
      price: bookings.price,
      status: bookings.status,
      createdAt: bookings.createdAt
    })
    .from(bookings)
    .leftJoin(therapists, eq(therapists.id, bookings.therapistId))
    .where(eq(bookings.userId, user.id))
    .orderBy(desc(bookings.createdAt));
  return c.json(rows);
});

class SlotTakenError extends Error {}
