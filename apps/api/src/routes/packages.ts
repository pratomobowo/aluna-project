import { Hono } from "hono";
import { asc } from "drizzle-orm";
import { db } from "../db";
import { packages } from "../db/schema";

export const packageRoutes = new Hono();

packageRoutes.get("/", async (c) => {
  return c.json(await db.select().from(packages).orderBy(asc(packages.sessions)));
});
