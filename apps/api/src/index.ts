import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import "dotenv/config";
import { auth } from "./auth";
import { assessmentRoutes } from "./routes/assessment";
import { roadmapRoutes } from "./routes/roadmap";
import { therapistRoutes } from "./routes/therapists";
import { bookingRoutes } from "./routes/booking";
import { paymentRoutes } from "./routes/payments";

const app = new Hono();
app.use("*", cors({ origin: process.env.FRONTEND_URL?.split(",") ?? "*", credentials: true }));

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true }));
app.route("/api/assessment", assessmentRoutes);
app.route("/api", roadmapRoutes);
app.route("/api", therapistRoutes);
app.route("/api", bookingRoutes);
app.route("/api", paymentRoutes);

export default app;

const port = Number(process.env.PORT ?? 3001);
if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`aluna api listening on http://localhost:${info.port}`);
  });
}
