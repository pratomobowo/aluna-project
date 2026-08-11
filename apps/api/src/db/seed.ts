import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "./index";
import { classes, communities, packages, rewards, schedules, therapists } from "./schema";

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

async function seed() {
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

  await db.insert(packages).values(PACKAGES);

  console.log(`Seeded ${inserted.length} therapists, ${scheduleValues.length} schedules, ${PACKAGES.length} packages`);
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

seed()
  .then(async () => {
    await seedIfEmpty(classes, [
      { ...CLASSES[0], date: nextWeekday(6), time: "10:00" },
      { ...CLASSES[1], date: nextWeekday(0), time: "14:00" }
    ], "classes");
    await seedIfEmpty(communities, COMMUNITIES, "communities");
    await seedIfEmpty(rewards, REWARDS, "rewards");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// ponytail: package prices are draft, validate with Ka Lisa before prod
