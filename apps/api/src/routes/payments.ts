import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq } from "drizzle-orm";
import { UNLOCK_PRICE } from "@aluna/shared";
import { db } from "../db";
import { bookings, therapists, transactions, unlocks, users } from "../db/schema";
import { currentUser } from "../lib/session";
import { isSuperAdmin } from "../lib/admin";

export const paymentRoutes = new Hono();

// ponytail: mock payment, replace with Midtrans Snap integration later

const createSchema = z.object({
  type: z.enum(["unlock", "session", "package"]),
  bookingId: z.number().int().optional()
});

paymentRoutes.post("/payments/create", zValidator("json", createSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const body = c.req.valid("json");
  let amount = UNLOCK_PRICE;
  let referenceId: number | null = null;
  let booking: { id: number; therapistId: number | null } | null = null;

  if (body.type !== "unlock") {
    if (!body.bookingId) return c.json({ error: "bookingId_required" }, 400);
    const [found] = await db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, body.bookingId), eq(bookings.userId, user.id)))
      .limit(1);
    if (!found) return c.json({ error: "booking_not_found" }, 404);
    if (found.status !== "pending") return c.json({ error: "booking_not_pending" }, 409);
    booking = found;
    amount = found.price;
    referenceId = found.id;
  }

  const therapistId = booking?.therapistId ?? null;
  const therapistNet = booking ? Math.round(amount * 0.6) : null;

  const [txn] = await db
    .insert(transactions)
    .values({
      userId: user.id,
      type: body.type,
      referenceId,
      amount,
      therapistId,
      therapistNet,
      status: "pending",
      gatewayRef: `MOCK-${Math.random().toString(36).slice(2, 10)}`
    })
    .returning();
  return c.json({ transactionId: txn.id, gatewayRef: txn.gatewayRef });
});

const completeSchema = z.object({ transactionId: z.number().int() });

paymentRoutes.post("/payments/mock-complete", zValidator("json", completeSchema), async (c) => {
  if (process.env.NODE_ENV === "production") return c.json({ error: "not_found" }, 404);

  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { transactionId } = c.req.valid("json");
  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, user.id)))
    .limit(1);
  if (!txn) return c.json({ error: "transaction_not_found" }, 404);
  if (txn.status !== "pending") return c.json({ error: "transaction_not_pending" }, 409);

  await db.update(transactions).set({ status: "paid" }).where(eq(transactions.id, txn.id));

  if (txn.type === "unlock") {
    await db.insert(unlocks).values({ userId: user.id, paidAt: new Date() }).onConflictDoNothing();
  } else if (txn.referenceId) {
    await db
      .update(bookings)
      .set({ status: "confirmed" })
      .where(and(eq(bookings.id, txn.referenceId), eq(bookings.userId, user.id)));
  }

  return c.json({ ok: true });
});

paymentRoutes.get("/transactions", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  return c.json(
    await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, user.id))
      .orderBy(desc(transactions.createdAt))
  );
});

paymentRoutes.get("/admin/transactions", async (c) => {
  if (!(await currentUser(c))) return c.json({ error: "unauthorized" }, 401);
  if (!(await isSuperAdmin(c))) return c.json({ error: "forbidden" }, 403);
  return c.json(
    await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        userEmail: users.email,
        type: transactions.type,
        referenceId: transactions.referenceId,
        amount: transactions.amount,
        therapistId: transactions.therapistId,
        therapistName: therapists.name,
        therapistNet: transactions.therapistNet,
        status: transactions.status,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(users, eq(users.id, transactions.userId))
      .leftJoin(therapists, eq(therapists.id, transactions.therapistId))
      .orderBy(desc(transactions.createdAt))
  );
});
