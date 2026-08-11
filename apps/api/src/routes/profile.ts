import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { profiles, users } from "../db/schema";
import { currentUser } from "../lib/session";

export const profileRoutes = new Hono();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  gender: z.enum(["Perempuan", "Laki-laki", "Lainnya"]).nullable().optional(),
  birthYear: z.number().int().min(1900).max(2100).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  referralSource: z.string().trim().max(80).nullable().optional(),
});

profileRoutes.get("/profile", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);

  return c.json({
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    gender: profile?.gender ?? null,
    birthYear: profile?.birthYear ?? null,
    city: profile?.city ?? null,
    referralSource: profile?.referralSource ?? null,
  });
});

profileRoutes.put("/profile", zValidator("json", updateProfileSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const body = c.req.valid("json");

  if (body.name !== undefined) {
    await db.update(users).set({ name: body.name }).where(eq(users.id, user.id));
  }

  const { name: _name, ...profileFields } = body;
  const fields = {
    gender: profileFields.gender ?? null,
    birthYear: profileFields.birthYear ?? null,
    city: profileFields.city ?? null,
    referralSource: profileFields.referralSource ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(profiles)
    .values({ userId: user.id, ...fields })
    .onConflictDoUpdate({ target: profiles.userId, set: fields });

  return c.json({ ok: true });
});
