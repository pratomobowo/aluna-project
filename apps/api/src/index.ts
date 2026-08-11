import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import "dotenv/config";

const app = new Hono();
app.use("*", cors({ origin: process.env.FRONTEND_URL?.split(",") ?? "*", credentials: true }));

app.get("/health", (c) => c.json({ ok: true }));

export default app;

const port = Number(process.env.PORT ?? 3001);
if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`aluna api listening on http://localhost:${info.port}`);
  });
}
