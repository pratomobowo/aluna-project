import { eq } from "drizzle-orm";
import { db } from "./index";
import { packages, schedules, therapists } from "./schema";

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

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function seed() {
  const existing = await db.select({ id: therapists.id }).from(therapists).limit(1);
  if (existing.length > 0) {
    console.log("Therapists already exist — already seeded, skipping.");
    process.exit(0);
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
  process.exit(0);
}

// ponytail: package prices are draft, validate with Ka Lisa before prod
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
