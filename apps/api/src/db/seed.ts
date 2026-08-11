import type { PgTable } from "drizzle-orm/pg-core";
import { and, eq } from "drizzle-orm";
import { computeAssessment } from "@aluna/shared";
import { auth } from "../auth";
import { db } from "./index";
import {
  assessmentResponses,
  assessmentResults,
  bookings,
  classes,
  communities,
  dailyTaskCompletions,
  packages,
  pointsTransactions,
  rewards,
  schedules,
  therapists,
  transactions,
  unlocks,
  users
} from "./schema";

const DEMO_EMAIL = "demo@aluna.app";
const DEMO_PASSWORD = "demo12345";
const DEMO_NAME = "Demo Aluna";

const THERAPISTS = [
  {
    name: "Dr. Sarah Rahmawati, M.Psi",
    title: "Psikolog Klinis",
    specialties: ["Anxiety", "Trauma"],
    rating: "4.9",
    sessionCount: 127,
    price: 250000,
    location: "Jakarta",
    experienceYears: 5,
    image: null,
    bio: "Psikolog klinis berpengalaman fokus anxiety disorder & trauma. Pendekatan CBT dan mindfulness-based therapy."
  },
  {
    name: "M. Hendra Putra",
    title: "Psikolog",
    specialties: ["Depresi", "Stress"],
    rating: "4.8",
    sessionCount: 98,
    price: 220000,
    location: "Online",
    experienceYears: 4,
    image: null,
    bio: "Fokus membantu klien mengelola depresi dan stress dengan pendekatan terapi yang praktis dan suportif."
  },
  {
    name: "Ayu Kusuma, M.Psi",
    title: "Psikolog",
    specialties: ["Burnout", "CBT"],
    rating: "4.7",
    sessionCount: 84,
    price: 200000,
    location: "Jakarta",
    experienceYears: 4,
    image: null,
    bio: "Membantu profesional mengatasi burnout dan membangun keseimbangan hidup melalui CBT."
  },
  {
    name: "Rina Marlina, M.Psi",
    title: "Psikolog",
    specialties: ["Stress", "Self-esteem"],
    rating: "4.6",
    sessionCount: 56,
    price: 180000,
    location: "Bandung",
    experienceYears: 3,
    image: null,
    bio: "Spesialis penanganan stress dan penguatan harga diri untuk remaja dan dewasa muda."
  }
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

const PACKAGES = [
  { name: "Paket 6 Sesi", sessions: 6, price: 1200000, discountPercent: 20 },
  { name: "Paket 12 Sesi", sessions: 12, price: 2160000, discountPercent: 28 },
  { name: "Paket 24 Sesi", sessions: 24, price: 3840000, discountPercent: 36 }
];

const CLASSES = [
  {
    title: "Mindfulness untuk Pemula",
    description: "Kelas pengenalan mindfulness untuk menenangkan pikiran dan mengurangi stress.",
    mode: "online",
    price: 0,
    category: "Kelas",
    icon: "Flower2"
  },
  {
    title: "Journaling Workshop",
    description: "Workshop menulis jurnal untuk memproses emosi dan melatih refleksi diri.",
    mode: "offline",
    price: 50000,
    category: "Workshop",
    icon: "NotebookPen"
  }
];

const COMMUNITIES = [
  {
    name: "Dear Community",
    description: "Safe space untuk berbagi cerita dan saling mendukung.",
    memberCount: 2400,
    schedule: "Terbuka",
    icon: "Sprout"
  },
  {
    name: "Support Group Anxiety",
    description: "Komunitas pendukung untuk berbagi pengalaman mengelola kecemasan.",
    memberCount: 340,
    schedule: "Mingguan",
    icon: "MessagesSquare"
  }
];

const REWARDS = [
  {
    title: "Teh Chamomile (min. 50rb)",
    description: "Potongan 15rb untuk teh relaksasi",
    tag: "Katalog · Nutrisi",
    points: 300,
    icon: "Coffee"
  },
  {
    title: "E-book Kelola Overthinking",
    description: "Panduan digital dari psikolog",
    tag: "Katalog · Digital",
    points: 400,
    icon: "BookOpen"
  },
  {
    title: "Diskon 20rb sesi ke-2",
    description: "Berlaku untuk booking berikutnya",
    tag: "Diskon · Konseling",
    points: 600,
    icon: "Ticket"
  },
  {
    title: "Kelas Healing grup gratis",
    description: "Akses 1 kelas online",
    tag: "Katalog · Kelas",
    points: 1000,
    icon: "Flower2"
  },
  {
    title: "Diskon 50rb Healthy Food",
    description: "Paket makanan sehat mingguan",
    tag: "Diskon · Nutrisi",
    points: 1500,
    icon: "Salad"
  }
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextWeekday(targetDay: number): string {
  const d = new Date();
  const daysUntil = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return formatDate(d);
}

async function seedIfEmpty<T extends PgTable>(
  table: T,
  rows: T["$inferInsert"][],
  label: string
): Promise<void> {
  const existing = await db.select().from(table).limit(1);
  if (existing.length > 0) {
    console.log(`${label} already seeded, skipping.`);
    return;
  }
  const inserted = await db.insert(table).values(rows).returning();
  console.log(`Seeded ${inserted.length} ${label}`);
}

async function seedTherapistsSchedulesPackages(): Promise<void> {
  const existing = await db.select({ id: therapists.id }).from(therapists).limit(1);
  if (existing.length > 0) {
    console.log("Therapists already exist — skipping therapist seed.");
    return;
  }

  const inserted = await db.insert(therapists).values(THERAPISTS).returning();

  const scheduleValues = inserted.flatMap((t, i) => {
    const isOnlineOnly = t.location === "Online" || !t.location;
    const rows: typeof schedules.$inferInsert[] = [];
    for (let day = 0; day < 14; day++) {
      const d = new Date();
      d.setDate(d.getDate() + day);
      if (d < new Date()) continue;
      const date = formatDate(d);
      TIME_SLOTS.forEach((time, j) => {
        rows.push({
          therapistId: t.id,
          date,
          time,
          mode: isOnlineOnly ? "online" : j % 2 === 0 ? "online" : "offline",
          booked: false
        });
      });
    }
    return rows;
  });

  if (scheduleValues.length > 0) {
    await db.insert(schedules).values(scheduleValues);
  }

  await seedIfEmpty(packages, PACKAGES, "packages");

  console.log(`Seeded ${inserted.length} therapists, ${scheduleValues.length} schedules`);
}

async function getOrCreateDemoUser() {
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing) {
    console.log(`Demo user already exists (${DEMO_EMAIL}), reusing.`);
    return existing;
  }

  console.log(`Creating demo user (${DEMO_EMAIL}) via better-auth signUpEmail...`);
  try {
    const res = await auth.api.signUpEmail({
      body: { name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD }
    });
    console.log(`Demo user created: ${res.user.email}`);
    return res.user;
  } catch (err) {
    // ponytail: race guard — another instance may have created it concurrently
    const [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    if (user) return user;
    throw err;
  }
}

async function seedDemoUserData(): Promise<void> {
  const user = await getOrCreateDemoUser();
  const uid = user.id;

  const [existingAssessment] = await db
    .select({ id: assessmentResults.id })
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, uid))
    .limit(1);
  if (existingAssessment) {
    console.log("Demo assessment already exists, skipping.");
  } else {
    const answers = Array(10).fill(0) as number[];
    const result = computeAssessment(answers);
    await db.insert(assessmentResponses).values({ userId: uid, answers });
    await db.insert(assessmentResults).values({ userId: uid, result, safetyTriggered: result.safetyTriggered });
    console.log("Seeded demo assessment (10 zeros).");
  }

  const [existingUnlock] = await db.select().from(unlocks).where(eq(unlocks.userId, uid)).limit(1);
  if (existingUnlock) {
    console.log("Demo unlock already exists, skipping.");
  } else {
    await db.insert(unlocks).values({ userId: uid, paidAt: new Date() });
    console.log("Seeded demo unlock.");
  }

  const [existingPoints] = await db
    .select({ id: pointsTransactions.id })
    .from(pointsTransactions)
    .where(eq(pointsTransactions.userId, uid))
    .limit(1);
  if (existingPoints) {
    console.log("Demo points already exist, skipping.");
  } else {
    await db.insert(pointsTransactions).values([
      { userId: uid, amount: 10, reason: "daily_task" },
      { userId: uid, amount: 10, reason: "daily_task" },
      { userId: uid, amount: 10, reason: "daily_task" },
      { userId: uid, amount: 20, reason: "bonus_roadmap" }
    ]);
    console.log("Seeded demo points (50 total).");
  }

  const [existingBooking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(eq(bookings.userId, uid), eq(bookings.status, "confirmed")))
    .limit(1);
  if (existingBooking) {
    console.log("Demo booking already exists, skipping.");
  } else {
    let [schedule] = await db
      .select()
      .from(schedules)
      .where(eq(schedules.booked, false))
      .orderBy(schedules.date, schedules.time)
      .limit(1);
    if (!schedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [created] = await db
        .insert(schedules)
        .values({ therapistId: 1, date: formatDate(tomorrow), time: "09:00", mode: "online", booked: false })
        .returning();
      schedule = created;
    }

    const [therapist] = await db.select().from(therapists).where(eq(therapists.id, schedule.therapistId ?? 0)).limit(1);
    const price = therapist?.price ?? 100000;

    const booking = await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(schedules)
        .set({ booked: true })
        .where(and(eq(schedules.id, schedule.id), eq(schedules.booked, false)))
        .returning();
      if (!claimed) return null;
      const [created] = await tx
        .insert(bookings)
        .values({
          userId: uid,
          therapistId: schedule.therapistId,
          scheduleId: schedule.id,
          mode: schedule.mode,
          price,
          status: "confirmed"
        })
        .returning();
      await tx.insert(transactions).values({
        userId: uid,
        type: "session",
        referenceId: created.id,
        amount: price,
        therapistId: schedule.therapistId,
        therapistNet: Math.round(price * 0.6),
        status: "paid"
      });
      return created;
    });

    if (booking) {
      console.log(`Seeded demo booking (schedule ${schedule.id}, price ${price}) + paid transaction.`);
    } else {
      console.log("Demo booking slot taken, skipping.");
    }
  }

  const today = formatDate(new Date());
  const [existingCompletion] = await db
    .select({ id: dailyTaskCompletions.id })
    .from(dailyTaskCompletions)
    .where(and(
      eq(dailyTaskCompletions.userId, uid),
      eq(dailyTaskCompletions.date, today),
      eq(dailyTaskCompletions.taskId, "t1")
    ))
    .limit(1);
  if (existingCompletion) {
    console.log("Demo daily task already completed today, skipping.");
  } else {
    await db.insert(dailyTaskCompletions).values({ userId: uid, taskId: "t1", date: today, points: 10 });
    console.log("Seeded demo daily task completion.");
  }
}

export async function runSeed(): Promise<void> {
  await seedTherapistsSchedulesPackages();
  await seedIfEmpty(classes, [
    { ...CLASSES[0], date: nextWeekday(6), time: "10:00" },
    { ...CLASSES[1], date: nextWeekday(0), time: "14:00" }
  ], "classes");
  await seedIfEmpty(communities, COMMUNITIES, "communities");
  await seedIfEmpty(rewards, REWARDS, "rewards");

  // ponytail: demo account only when enabled — set SEED_DEMO=false in production
  if (process.env.SEED_DEMO !== "false") {
    await seedDemoUserData();
  } else {
    console.log("SEED_DEMO=false — skipping demo user.");
  }
}

// ponytail: detect direct CLI run without breaking CJS bundle (import.meta.url is undefined in dist/index.cjs)
const isMain =
  process.argv[1] != null &&
  ((import.meta as { url?: string }).url?.replace("file://", "") === process.argv[1] ||
    process.argv[1].endsWith("seed.ts") ||
    process.argv[1].endsWith("seed.mjs"));
if (isMain) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

// ponytail: package prices are draft, validate with Ka Lisa before prod
