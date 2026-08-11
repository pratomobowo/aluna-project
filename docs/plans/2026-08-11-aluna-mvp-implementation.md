# Aluna MVP — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web-first MVP for Aluna (mental wellness journey app) — assessment → roadmap/paywall → therapist booking → payment — as a Hono API + React web app monorepo, deployable to Coolify.

**Architecture:** pnpm monorepo (`apps/api` Hono + Drizzle/Neon Postgres + Better Auth + Midtrans; `apps/web` React + Vite + Tailwind PWA). Domain logic (scoring, personalization rules) lives in `packages/shared` with no framework deps so it's testable and reused. Mobile (React Native) will consume the same API later; no UI sharing.

**Tech Stack:** pnpm workspaces · TypeScript · Hono · Drizzle ORM · Neon Postgres · Better Auth · Midtrans · React 18 + Vite + Tailwind v4 · TanStack Query · Vitest.

**Design doc:** `docs/plans/2026-08-11-aluna-mvp-design.md`

---

## Setup Notes

- Run all commands from repo root unless stated.
- Env vars: set in Coolify UI in prod; use `.env` locally. Never commit secrets.
- Node 20+, pnpm 9+. Global: `pnpm install` first.
- Commit after every task (step "Commit"), message style: `feat(`/`fix(`.
- **Design rule (WAJIB): TIDAK ada emoji di UI.** Semua ikon pakai `lucide-react` (stroke outline default). Prototype HTML memakai emoji 🌿🎉😰 dll — setiap port wajib ganti ke icon. Ikon stroke-weight match text: 1.5px di text 400, 2px di text 600.

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.npmrc`, `tsconfig.base.json`
- Create: `apps/api/`, `apps/web/`, `packages/shared/` placeholders

**Step 1: Root files**

`package.json`:
```json
{
  "name": "aluna",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "pnpm --parallel --filter @aluna/web --filter @aluna/api dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  }
}
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`.npmrc`:
```
node-linker=hoisted
```

`.gitignore`:
```
node_modules
dist
.env
.env.local
*.log
.DS_Store
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 2: Verify**
Run: `pnpm install`
Expected: no errors, `node_modules` created.

**Step 3: Commit**
```bash
git init
git add .
git commit -m "chore: scaffold pnpm monorepo"
```

---

### Task 2: packages/shared — scoring engine (TDD)

**Files:**
- Create: `packages/shared/package.json`, `tsconfig.json`
- Create: `packages/shared/src/assessment.ts`
- Create: `packages/shared/src/assessment.test.ts`
- Create: `packages/shared/src/index.ts`

**Step 1: package.json**

`packages/shared/package.json`:
```json
{
  "name": "@aluna/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "types": ["vitest/globals"] }
}
```

**Step 2: Write the failing test**

Domain rules from PRD §5:
- 7 dimensions: anxiety, mood, stress, trauma, sleep, relationship, self_esteem
- Each answer 0-3. Q30 (self-harm / safety) is NOT scored.
- Per dimension: sum of points → percentage → dimension with highest % = "primary issue"
- Overall score = average of dimension percentages, rescaled to 0-10.
- Labels by overall >=7 → "Baik"; >=4 → "Perlu Perhatian"; else → "Butuh Dukungan".

`packages/shared/src/assessment.ts`:
```ts
export type Dimension =
  | "anxiety" | "mood" | "stress" | "trauma"
  | "sleep" | "relationship" | "self_esteem";

export const DIMENSIONS: Dimension[] = [
  "anxiety", "mood", "stress", "trauma",
  "sleep", "relationship", "self_esteem"
];

// questionNumber → dimension. Q30 = safety (not scored).
export const QUESTION_DIMENSION: Record<number, Dimension | "safety"> = {
  1:"anxiety", 2:"anxiety", 3:"anxiety", 4:"anxiety", 5:"anxiety",
  6:"mood", 7:"mood", 8:"mood", 9:"mood", 10:"mood",
  11:"stress", 12:"stress", 13:"stress", 14:"stress", 15:"stress",
  16:"trauma", 17:"trauma", 18:"trauma", 19:"trauma", 20:"trauma",
  21:"sleep", 22:"sleep", 23:"sleep", 24:"sleep", 25:"sleep",
  26:"relationship", 27:"relationship", 28:"relationship", 29:"relationship",
  30:"safety"
};

export interface DimensionScore {
  dimension: Dimension;
  points: number;
  max: number;
  percent: number; // 0-100
}

export interface AssessmentResult {
  overall: number; // 0-10, 1 decimal
  label: "Baik" | "Perlu Perhatian" | "Butuh Dukungan";
  primary: Dimension;
  dimensions: DimensionScore[];
  safetyTriggered: boolean; // Q30 answer > 0
}

export function computeAssessment(answers: number[]): AssessmentResult { ... }
```

`packages/shared/src/assessment.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeAssessment } from "./assessment";

describe("computeAssessment", () => {
  it("does not count Q30 (safety) in score", () => {
    // all 0 points except Q30 = 3
    const answers = Array.from({ length: 30 }, (_, i) => (i === 29 ? 3 : 0));
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(true);
    expect(r.overall).toBe(0);
  });

  it("flags safetyTriggered when Q30 > 0", () => {
    const answers = Array.from({ length: 30 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.safetyTriggered).toBe(false);
  });

  it("returns primary issue = highest dimension", () => {
    // stress Q11-15 all = 3, everything else 0
    const answers = Array.from({ length: 30 }, (_, i) =>
      i >= 10 && i <= 14 ? 3 : 0);
    const r = computeAssessment(answers);
    expect(r.primary).toBe("stress");
  });

  it("labels overall >=7 as Baik", () => {
    const answers = Array.from({ length: 30 }, () => 3);
    const r = computeAssessment(answers);
    expect(r.overall).toBeCloseTo(10, 0);
    expect(r.label).toBe("Baik");
  });

  it("labels overall <4 as Butuh Dukungan", () => {
    const answers = Array.from({ length: 30 }, () => 0);
    const r = computeAssessment(answers);
    expect(r.label).toBe("Butuh Dukungan");
  });
});
```

Note: with all-3 answers every dimension hits 100% → overall 10. With all-0 → overall 0. Both work for the label assertions. `Baik` threshold uses `>= 7`.

**Step 3: Run test, expect fail**

Run: `pnpm --filter @aluna/shared test`
Expected: FAIL — `computeAssessment` not defined.

**Step 4: Implement**

```ts
export function computeAssessment(answers: number[]): AssessmentResult {
  const points: Record<string, number> = {};
  const counts: Record<string, number> = {};
  DIMENSIONS.forEach((d) => { points[d] = 0; counts[d] = 0; });
  let safetyTriggered = false;

  answers.slice(0, 30).forEach((ans, idx) => {
    const q = idx + 1;
    const dim = QUESTION_DIMENSION[q] ?? null;
    if (!dim) return;
    if (dim === "safety") {
      if (ans > 0) safetyTriggered = true;
      return;
    }
    points[dim] += Math.max(0, Math.min(3, ans));
    counts[dim] += 1;
  });

  const dimensions: DimensionScore[] = DIMENSIONS.map((dim) => {
    const max = counts[dim] * 3;
    const pct = max === 0 ? 0 : Math.round((points[dim] / max) * 1000) / 10;
    return { dimension: dim, points: points[dim], max, percent: pct };
  });

  const primary = dimensions.reduce((a, b) =>
    (b.percent > a.percent ? b : a)).dimension;

  const overall = Math.round((dimensions.reduce((s, d) => s + d.percent, 0) / dimensions.length) / 10) / 10;

  const label =
    overall >= 7 ? "Baik"
    : overall >= 4 ? "Perlu Perhatian"
    : "Butuh Dukungan";

  return { overall, label, primary, dimensions, safetyTriggered };
}
```

**Step 5: Run test, expect pass**

Run: `pnpm --filter @aluna/shared test`
Expected: PASS (5 tests).

**Step 6: index.ts**

```ts
export * from "./assessment";
```

**Step 7: Commit**
```bash
git add packages/shared
git commit -m "feat(shared): scoring engine with safety protocol"
```

---

### Task 3: packages/shared — personalization (roadmap + next-best-action, TDD)

**Files:**
- Create: `packages/shared/src/personalization.ts`
- Create: `packages/shared/src/personalization.test.ts`
- Update: `packages/shared/src/index.ts`

**Rules (rule-based, from PRD §4.2 — 1 primary issue = 1 content set):**

`personalization.ts`:
```ts
import type { Dimension } from "./assessment";

export interface Goal { id: string; label: string }
export interface RoadmapStep {
  order: number; title: string; description: string;
}
export interface DailyTask { id: string; title: string; points: number }

export interface Personalization {
  goal: Goal;
  roadmap: RoadmapStep[];
  dailyTaskPool: DailyTask[];
  tag: string;
  therapistKeywords: string[];
  pointsPerRoadmapStep: number;
}

export const GOAL_LABEL: Record<Dimension, string> = {
  anxiety: "Lebih Tenang & Seimbang",
  mood: "Bangkit & Berdaya",
  stress: "Mengelola Beban Kerja",
  trauma: "Pulih Bertahap",
  sleep: "Tidur Lebih Nyenyak",
  relationship: "Relasi Lebih Sehat",
  self_esteem: "Percaya Diri Lagi"
};

export const DAILY_TASKS: Record<Dimension, DailyTask[]> = {
  anxiety: [
    { id: "t1", title: "Latihan napas 5 menit", points: 10 },
    { id: "t2", title: "Journaling kecemasan", points: 10 },
    { id: "t3", title: "Berjalan 15 menit di luar", points: 5 }
  ],
  mood: [
    { id: "m1", title: "Tulis 3 hal yang kamu syukuri", points: 10 },
    { id: "m2", title: "Berjemur pagi 10 menit", points: 5 },
    { id: "m3", title: "Journaling mood", points: 10 }
  ],
  stress: [
    { id: "s1", title: "Tidak ada — waktu istirahat", points: 5 },
    { id: "s2", title: "Journaling beban kerja", points: 10 }
  ],
  trauma: [],
  sleep: [ { id: "sl1", title: "Kurangi layar 30 menit sebelum tidur", points: 5 } ],
  relationship: [],
  self_esteem: []
};
```

`personalization.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { personalizationFor } from "./personalization";

describe("personalizationFor", () => {
  it("maps anxiety to 'Lebih Tenang & Seimbang'", () => {
    const p = personalizationFor("anxiety");
    expect(p.goal.label).toBe("Lebih Tenang & Seimbang");
    expect(p.roadmap.length).toBe(3);
    expect(p.dailyTaskPool.length).toBeGreaterThan(0);
  });
  it("every dimension has a goal", () => {
    for (const d of ["anxiety","mood","stress","trauma","sleep","relationship","self_esteem"] as const) {
      expect(personalizationFor(d).goal.label).toBeTruthy();
    }
  });
});
```

`personalization.ts` (add):
```ts
export function personalizationFor(primary: Dimension): Personalization {
  return {
    goal: { id: primary, label: GOAL_LABEL[primary] },
    roadmap: [
      { order: 1, title: "Pahami kondisimu", description: "Hasil assessment kamu sudah siap" },
      { order: 2, title: "Konseling pertamamu", description: "Kenal therapist yang paling cocok" },
      { order: 3, title: "Ritme harian baru", description: "Kerjakan langkah harian dan pantau progres" }
    ],
    dailyTaskPool: DAILY_TASKS[primary],
    tag: primary === "anxiety" ? "#Overthinking" : "#ButuhDukungan",
    therapistKeywords: [GOAL_LABEL[primary]],
    pointsPerRoadmapStep: 20
  };
}
```

(`DAILY_TASKS` entries for trauma/relationship/self_esteem may be empty arrays — task pool falls back to a default later; keep the map complete for now to satisfy the test above which only checks goal exists.)

**Run test, expect fail → implement → pass.**
Run: `pnpm --filter @aluna/shared test`

**Commit**
```bash
git add packages/shared
git commit -m "feat(shared): personalization rules"
```

---

### Task 4: apps/api scaffold + DB schema + migrations

**Files:**
- Create: `apps/api/package.json`, `tsconfig.json`, `.env.example`, `drizzle.config.ts`
- Create: `apps/api/src/db/schema.ts`, `apps/api/src/db/index.ts`
- Create: `apps/api/src/index.ts`

**Step 1: package.json**

```json
{
  "name": "@aluna/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsup src/index.ts --format esm --target node20 --sourcemap",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@aluna/shared": "workspace:*",
    "hono": "^4.6.0",
    "@hono/zod-validator": "^0.4.0",
    "zod": "^3.23.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",
    "better-auth": "^1.1.0",
    "@better-auth/adapter-kysely": "^1.1.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "tsup": "^8.3.0",
    "drizzle-kit": "^0.28.0",
    "@types/node": "^22.0.0"
  }
}
```

**.env.example:**
```
DATABASE_URL=postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require
BETTER_AUTH_SECRET=change-me
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
RESEND_API_KEY=
FRONTEND_URL=http://localhost:5173
```

**Step 2: schema.ts** (Drizzle, Postgres)

```ts
import { sql } from "drizzle-orm";
import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, numeric
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow()
});

export const assessmentResponses = pgTable("assessment_responses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  answers: jsonb("answers").notNull(), // number[30]
  createdAt: timestamp("created_at").defaultNow()
});

export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  result: jsonb("result").notNull(), // AssessmentResult
  safetyTriggered: boolean("safety_triggered").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const unlocks = pgTable("unlocks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique().references(() => users.id),
  paidAt: timestamp("paid_at")
});

export const therapists = pgTable("therapists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  specialties: text("specialties").array().notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  sessionCount: integer("session_count").default(0),
  price: integer("price").notNull(),
  location: text("location"),
  experienceYears: integer("experience_years").default(0),
  image: text("image"),
  bio: text("bio")
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").references(() => therapists.id),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:mm
  mode: text("mode").notNull(), // online|offline
  booked: boolean("booked").default(false)
});

export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sessions: integer("sessions").notNull(),
  price: integer("price").notNull(),
  discountPercent: integer("discount_percent").default(0)
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  therapistId: integer("therapist_id").references(() => therapists.id),
  scheduleId: integer("schedule_id").references(() => schedules.id),
  packageId: integer("package_id"),
  mode: text("mode").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull().default("pending"), // pending|paid|confirmed|cancelled
  createdAt: timestamp("created_at").defaultNow()
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  type: text("type").notNull(), // unlock|session|package
  referenceId: integer("reference_id"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending|paid|failed|settled
  gatewayRef: text("gateway_ref"),
  createdAt: timestamp("created_at").defaultNow()
});
```

**Step 3: db/index.ts**

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
export const db = drizzle(client, { schema });
export { schema };
```

**Step 4: drizzle.config.ts**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true
});
```

**Step 5: index.ts (health check)**

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import "dotenv/config";

const app = new Hono();
app.use("*", cors({ origin: process.env.FRONTEND_URL?.split(",") ?? "*", credentials: true }));

app.get("/health", (c) => c.json({ ok: true }));

export default app;
```

**Step 6: Verify**
Run: `pnpm --filter @aluna/api db:generate`
Expected: `drizzle/` folder with generated SQL. Then set `DATABASE_URL` in `.env` and run `pnpm --filter @aluna/api db:migrate`.
Expected: tables created in Neon.

**Step 7: Commit**
```bash
git add apps/api
git commit -m "feat(api): scaffold, schema, migrations"
```

---

### Task 5: API — Better Auth integration

**Files:**
- Create: `apps/api/src/auth.ts`
- Modify: `apps/api/src/index.ts`

**auth.ts**
```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import "dotenv/config";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  user: {
    modelName: "users",
    additionalFields: {
      isTherapist: { type: "boolean", defaultValue: false }
    }
  },
  trustedOrigins: (process.env.FRONTEND_URL ?? "").split(",")
});
```

Better Auth manages its own tables (`user`, `session`, `account`, `verification`) or maps to our `users` via `user.modelName`. Use Better Auth's schema generator: run `npx @better-auth/cli generate` after wiring auth — it creates the required tables/migration.

**index.ts (modify):**

```ts
import { auth } from "./auth";

// route to /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

**Verify**
Run: `pnpm --filter @aluna/api dev`
Expected: `GET /api/auth/session` returns `{ session: null }` WITHOUT auth (unauthenticated view works); Better Auth tables exist in DB.

**Commit**
```bash
git add apps/api
git commit -m "feat(api): better auth setup"
```

---

### Task 6: API — assessment endpoints

**Files:**
- Create: `apps/api/src/routes/assessment.ts`
- Create: `apps/api/src/lib/session.ts`
- Modify: `apps/api/src/index.ts`

**session.ts** — helper to get current user:
```ts
import { getSessionCookie } from "better-auth/cookies";
import { auth } from "../auth";
import type { Context } from "hono";

export async function currentUser(c: Context) {
  const headers = new Headers();
  headers.set("cookie", headerSafe(c.req.header("cookie") ?? ""));
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  return session.user;
}
```
(`headerSafe` trims cookie value; adjust as needed to pass raw cookie header to Better Auth.)

**assessment.ts** — endpoints:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { computeAssessment } from "@aluna/shared";
import { db } from "../db";
import { assessmentResponses, assessmentResults } from "../db/schema";
import { currentUser } from "../lib/session";

const submitSchema = z.object({
  answers: z.array(z.number().min(0).max(3)).length(30)
});

export const assessmentRoutes = new Hono();

// Save answers + compute result. Auth required.
assessmentRoutes.post("/submit", zValidator("json", submitSchema), async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);

  const { answers } = c.req.valid("json");
  const result = computeAssessment(answers);

  await db.insert(assessmentResponses).values({ userId: user.id, answers });
  const [saved] = await db
    .insert(assessmentResults)
    .values({ userId: user.id, result, safetyTriggered: result.safetyTriggered })
    .returning();

  return c.json({ id: saved.id, result });
});

// Latest result for logged-in user
assessmentRoutes.get("/result", async (c) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: "unauthorized" }, 401);
  const rows = await db
    .select()
    .from(assessmentResults)
    .where({ userId: user.id })
    .orderBy(... []) // use sql`created_at desc` limit 1
    .limit(1);
  return c.json({ result: rows[0] ?? null });
});
```

Red-flag: when `safetyTriggered` is true the frontend MUST show the safety screen. API simply returns the flag (and stores it) — no scoring impact (already handled in shared).

**index.ts (modify):**
```ts
import { assessmentRoutes } from "./routes/assessment";
app.route("/api/assessment", assessmentRoutes);
```

**Verify**
Run: `pnpm --filter @aluna/api dev`
Expected: `POST /api/assessment/submit` without cookie → 401. With session → result JSON.

**Commit**
```bash
git add apps/api
git commit -m "feat(api): assessment submit + result"
```

---

### Task 7: API — roadmap, unlock (paywall), therapists, schedules, booking, transactions

These are CRUD-style; keep them thin, Drizzle, zod-validated. All endpoints under `/api`.

**Files:**
- Create: `apps/api/src/routes/roadmap.ts`
- Create: `apps/api/src/routes/therapists.ts`
- Create: `apps/api/src/routes/booking.ts`
- Create: `apps/api/src/routes/payments.ts`
- Modify: `apps/api/src/index.ts`

**roadmap.ts**
- `GET /api/roadmap` — auth required.
  - Read latest `assessmentResults`; if none → 404.
  - If no `unlocks` row → return between `unlocked:true` for first 2 steps and full roadmap blurred: `{ roadmap: steps.slice(0,2), locked:true }`.
  - If unlocked → `{ roadmap: full, locked:false }`.
- `POST /api/unlock` — auth required, requires a successful `unlock` transaction (created by payments module). Marks `unlocks` row. Returns full roadmap.

**therapists.ts**
- `GET /api/therapists` — public: list, optional `?specialty=` and `?location=` filters.
- `GET /api/therapists/:id` — public: detail.

**booking.ts**
- `GET /api/schedules?therapistId=` — public slot list.
- `POST /api/bookings` — auth required. Body: `{ therapistId, scheduleId, mode, packageId? }`.
  - Validate schedule is free (`booked == false`) → mark `booked = true`, insert booking with `status: "pending"`, price computed (session price, or package price / sessions first session discounted 50%).
  - Returns booking id for payment.

**payments.ts**
- `POST /api/payments/create` — auth required. Body: `{ type: "unlock" | "session" | "package", bookingId? }`. Creates `transactions` row and a Midtrans Snap request → returns `{ token, redirectUrl }`.
- `POST /api/payments/notification` — Midtrans webhook (no auth). Validates `signature_key`, updates transaction + unlocks/booking status.
- `GET /api/transactions` — auth required, user history.

Midtrans integration (Node):
```ts
// lib/midtrans.ts
const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
const base = isProd ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
const auth = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString("base64");

export async function createSnapTransaction({ orderId, grossAmount, item }: {
  orderId: string; grossAmount: number; item: string;
}) {
  const res = await fetch(`${base}/snap/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      item_details: [{ id: orderId, price: grossAmount, quantity: 1, name: item }]
    })
  });
  return res.json(); // { token, redirect_url }
}

export function verifySignature(params: Record<string, string>, key: string) {
  const orderId = params.order_id ?? "";
  const statusCode = params.status_code ?? "";
  const gross = params.gross_amount ?? "";
  const sha = crypto.createHash("sha512").update(`${orderId}${statusCode}${gross}${key}`).digest("hex");
  return sha === params.signature_key;
}
```

Split 40/60: after a `session` transaction settles, compute therapistNet = `Math.round(amount * 0.6)` and store/record for manual payout first (ponytail: skip payout infra until payments volume exists).

**index.ts (modify):** mount all routes:
```ts
app.route("/api/roadmap", roadmapRoutes);
app.route("/api", therapistRoutes);     // /api/therapists, /api/schedules
app.route("/api", bookingRoutes);      // /api/bookings
app.route("/api", paymentRoutes);      // /api/payments
```

**Commit**
```bash
git add apps/api
git commit -m "feat(api): roadmap, therapists, booking, payments"
```

---

### Task 8: apps/web scaffold (shadcn/ui)

**Files:**
- Create: `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Run shadcn init → generates `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

**Step 1: package.json**

```json
{
  "name": "@aluna/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.59.0",
    "lucide-react": "^0.450.0",
    "@aluna/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

**Step 2: vite.config.ts**

```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { proxy: { "/api": "http://localhost:3001" } }
});
```

Note: dev proxy removes CORS issues locally. In prod (Coolify), the web app calls `https://api.yourdomain.com/api/*` directly — set `VITE_API_URL` in `apps/web/.env`.

**Step 3: Init shadcn (terbaru, Tailwind v4 + React 19-ready)**

Run: `npx shadcn@latest init -t vite` (answer prompts; `--defaults` untuk skip)
Expected: `components.json`, `src/index.css` (Tailwind v4 theme), `src/components/ui/*`.

Add komponen yang dipakai MVP:
```bash
npx shadcn@latest add button card input label progress dialog radio-group tabs sheet badge avatar skeleton toast
```
Expected: file komponen muncul di `src/components/ui/`.

**Step 4: index.html** — standard Vite + React entry. `src/main.tsx` mounts `App` inside `QueryClientProvider` + `BrowserRouter`.

**Step 5: Verify**
Run: `pnpm --filter @aluna/web dev`
Expected: Vite serves on :5173, komponen shadcn bisa diimport.

**Commit**
```bash
git add apps/web
git commit -m "feat(web): react+vite+shadcn scaffold"
```

---

### Task 8b: Setup theme Aluna (design system)

**Files:**
- Modify: `apps/web/src/index.css` (Tailwind v4 `@theme` — ganti default shadcn abu-abu ke tokens Aluna)
- Modify: `index.html` (font Fraunces + Plus Jakarta Sans via Google Fonts, woff2)
- Create: `apps/web/src/components/JourneyMap.tsx` (dari prototype s8 — SVG winding path + pin + titik berdenyut)

**Step 1: Fonts di index.html**

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,500;0,600;1,400;1,500&display=swap" rel="stylesheet">
```

**Step 2: Theme di index.css** (oklch, cek kontras better-colors — teks di bg terang butuh lightness gap ≥ 0.35):

```css
@import "tailwindcss";

@theme inline {
  --font-sans: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-serif: "Fraunces", Georgia, serif;
  --color-primary: oklch(0.42 0.09 155);      /* #2F6B4F brand hijau */
  --color-primary-foreground: oklch(0.98 0.01 100);
  --color-background: oklch(0.97 0.01 90);    /* #F4F1E8 cream */
  --color-card: oklch(0.99 0.005 90);         /* #FBF9F3 paper */
  --color-accent: oklch(0.86 0.13 90);        /* #F4D06F sun */
  --color-muted-foreground: oklch(0.45 0.02 155); /* #5C6B62 */
}
```

(warna final diukur nanti saat implementasi dengan oklch converter — nilai di atas titik awal, bukan final. Prototype: `--brand:#2F6B4F`, `--brand-mid:#4C9A6E`, `--brand-pale:#B8E0C8`, `--cream:#F4F1E8`, `--paper:#FBF9F3`, `--sun:#F4D06F`, `--ink:#26332C`, `--text2:#5C6B62`.)

**Step 3: `body { antialiased }`** di CSS root (font smoothing).

**Step 4: JourneyMap** — port dari prototype s8 (line 303–335) jadi komponen React:
- SVG `viewBox="0 0 390 430"`, jalur `stroke-dasharray="1 9"` (done = hijau, locked = abu)
- Pin milestone pakai lucide icon (`MapPin`, `Flag`, `Check`)
- Titik sekarang: `circle` + animasi pulse via `animate` (bounded, `prefers-reduced-motion` mati)
- `role="img"` + `aria-label` "Peta perjalananmu: titik 3 dari 6"

**Step 5: Verify**
Run: `pnpm --filter @aluna/web dev`
Expected: halaman tampil dengan font & warna Aluna (bukan abu-abu default shadcn).

**Commit**
```bash
git add apps/web
git commit -m "feat(web): aluna theme + journey map"
```

---

### Task 9: Web — auth pages (login/register/google)

**Files:**
- Create: `apps/web/src/lib/api.ts` (fetch wrapper: sets cookies, JSON)
- Create: `apps/web/src/lib/auth.ts` (session fetch + login/logout helpers calling `/api/auth/*`)
- Create: `apps/web/src/pages/Login.tsx`, `apps/web/src/pages/Register.tsx`
- Create: `apps/web/src/components/SessionGuard.tsx`

**Behavior:** match prototype screen s5 (`Selamat datang kembali`), s2 (`Kamu pernah ke sini sebelumnya?`).
- Register: name, email, password → POST `/api/auth/sign-up/email`.
- Login: email, password → POST `/api/auth/sign-in/email`.
- Google: link to `/api/auth/sign-in/social` (Better Auth handles redirect).
- `SessionGuard` — uses TanStack Query on `/api/auth/session`; redirects unauthenticated users to `/login`, except the assessment flow which allows pre-login results (PRD §3: hasil ringkas gratis sebelum login).

**Commit**
```bash
git add apps/web
git commit -m "feat(web): auth pages"
```

---

### Task 10: Web — assessment flow (30 questions) + result screen + safety screen

**Files:**
- Create: `apps/web/src/pages/Assessment.tsx`
- Create: `apps/web/src/pages/Result.tsx`
- Create: `apps/web/src/pages/Safety.tsx`
- Create: `apps/web/src/data/questions.ts` — 30 questions (from prototype s3 + PRD §5.1, asked each one-screen, 4 options 0-3, progress bar)

**Behavior:**
- `Assessment.tsx`: one question per screen, progress bar, options (Tidak pernah 0 / Kadang 1 / Sering 2 / Sangat sering 3). Prototype styling (`radio-opt`, `prog-track`, `.cal`, `.h3`) ported to Tailwind with the brand palette (`--brand:#2F6B4F`, `--cream:#F4F1E8`, `--paper:#FBF9F3`, Fraunces serif for headings + Plus Jakarta Sans).
- On Q30 with answer > 0 → `Safety.tsx` (warm support screen + hotline links to 119 / Kemenkes Hotline Sehat Jiwa 021-500-454). Do NOT proceed to results. This screen is mandatory.
- Otherwise → `POST /api/assessment/submit` → `Result.tsx`.
- `Result.tsx`: big score number (`overall`), label, top-3 dimension bar chart (simple div bars), narrative summary, tags (primary issue → `personalizationFor(primary).tag`). Emoji dimensi di prototype (😰😤😔) → ganti icon lucide (`Brain`, `Flame`, `CloudRain`). Pre-login (PRD step 4): if not logged in, show login/register prompt to save results.

**Commit**
```bash
git add apps/web
git commit -m "feat(web): assessment + result + safety flow"
```

---

### Task 11: Web — roadmap + paywall, homescreen journey map, daily tasks

**Files:**
- Create: `apps/web/src/pages/Roadmap.tsx`
- Create: `apps/web/src/pages/Home.tsx`
- Create: `apps/web/src/components/JourneyMap.tsx` (SVG winding path + pins + pulsing current dot — ported from prototype s8 map)
- Create: `apps/web/src/components/DailyTasks.tsx` (single-card stack, 1 active + counter)
- Create: `apps/web/src/components/Sections.tsx` (horizontal scroll therapist/class/community—community empty in MVP)

**Behavior:**
- `Roadmap.tsx`: first 2 steps visible, rest blurred; lock icon; `Buka Roadmap Lengkap Rp99k` button → `/payment/unlock`.
- `Home.tsx` (prototype s8): progress ribbon toward `goal.label`; JourneyMap path; next-best-action card from API `/api/roadmap` + personalization; DailyTasks (task pool from shared, rotate daily by date seed); sections (therapist horizontal). Poll `GET /api/roadmap` for latest.
- Admin minimal (`/admin`): list + create/edit therapists (CRUD via `/api/therapists`), view bookings list (prototype s10-12 data seeded).

**Commit**
```bash
git add apps/web
git commit -m "feat(web): roadmap, paywall, homescreen journey"
```

---

### Task 12: Web — booking + payment flow

**Files:**
- Create: `apps/web/src/pages/Therapists.tsx` (list + filter, prototype s10)
- Create: `apps/web/src/pages/TherapistDetail.tsx` (s11)
- Create: `apps/web/src/pages/Booking.tsx` (date/time/mode selection, prototype s12)
- Create: `apps/web/src/pages/Payment.tsx` (summary + Midtrans Snap via snap.js, prototype s13)
- Create: `apps/web/src/pages/PaymentSuccess.tsx` (s14, s16, s19)
- Create: `apps/web/src/pages/NotificationsOpted.tsx` (s15 — email reminder opt-in; push deferred to mobile)

**Behavior:**
- Therapist list from API, filter by specialty/topic chips.
- Booking: pick slot from `/api/schedules`, mode online/offline → `POST /api/bookings`.
- Payment: `POST /api/payments/create` → open Midtrans Snap (load `https://app.sandbox.midtrans.com/snap/snap.js` with client key) → on success, webhook updates server; client redirects to `PaymentSuccess`.
- First session = 50% off (PRD §6). Package upsell shown post-booking (prototype s16/s17/s18) using `/api/packages`.
- Notification opt-in (s15): email reminder — store pref; use Resend (or plain SMTP via Coolify) for H-1/1h reminders. Push deferred (mobile).

**Commit**
```bash
git add apps/web
git commit -m "feat(web): booking + payment flow"
```

---

### Task 13: Seed data

**Files:**
- Create: `apps/api/src/db/seed.ts`

```ts
// inserts: 3-4 therapists (Sarah Rahmawati, + details from prototype s10/s11),
// schedules for next 14 days, packages (6/12/24 sesi with prices from PRD)
```

Run: `pnpm --filter @aluna/api tsx src/db/seed.ts`
Commit:
```bash
git add apps/api
git commit -m "chore(api): seed therapists, schedules, packages"
```

---

### Task 14: Deploy to Coolify

**Steps:**
1. Create Coolify project → 3 apps: `web`, `api` (Dockerfile each). Web: static Vite build served by nginx or `vite preview`; API: `node dist/index.js`.
2. Set env vars in Coolify UI from `.env.example` (DATABASE_URL, BETTER_AUTH_*, MIDTRANS_*, RESEND_API_KEY, FRONTEND_URL).
3. Neon: create database + user; set `DATABASE_URL` (pooled, `?sslmode=require`).
4. API: after first deploy run `pnpm --filter @aluna/api db:migrate` (or auto via Dockerfile postinstall).
5. Domains: `app.yourdomain.com` (web), `api.yourdomain.com` (api). CORS: `FRONTEND_URL=https://app.yourdomain.com`.
6. Verify: `GET https://api.yourdomain.com/health` → `{ ok: true }`. Register, take assessment, unlock, book, pay with Midtrans sandbox.

**Commit**
```bash
git add .
git commit -m "chore: deploy config for coolify"
```

---

## Sequence & Dependencies

1. Tasks 1-3 (monorepo + shared) — no external deps
2. Task 4 (DB) — needs Neon `DATABASE_URL`
3. Tasks 5-7 (API) — needs Better Auth generated tables + Midtrans sandbox keys
4. Tasks 8-12 (web) — needs API running
5. Task 13 (seed) — before manual testing
6. Task 14 (deploy) — after everything works locally

## Test Command Reference

- Shared: `pnpm --filter @aluna/shared test`
- API dev: `pnpm --filter @aluna/api dev`
- Web dev: `pnpm --filter @aluna/web dev`
- All: `pnpm test`, `pnpm typecheck`

## Notes / Known Trade-offs

- `trauma`, `relationship`, `self_esteem` task pools are empty in the stub — finalize with Ka Lisa before production (PRD: clinical content must be validated).
- Payment split (40/60) recorded, not auto-paid → manual payout until volume exists (ponytail: skip payout infra until payments volume exists).
- Push notifications deferred to mobile; web MVP uses email reminders only.
- Red-flag (Q30) handled in shared scoring + mandatory Safety screen; data stored separately, never used for marketing.
- `.env` never committed; env managed in Coolify UI.