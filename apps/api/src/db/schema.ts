import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const assessmentResponses = pgTable("assessment_responses", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  answers: jsonb("answers").notNull().$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow()
});

export const assessmentResults = pgTable("assessment_results", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  result: jsonb("result").notNull(),
  safetyTriggered: boolean("safety_triggered").default(false),
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
  date: text("date").notNull(),
  time: text("time").notNull(),
  mode: text("mode").notNull(),
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
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  type: text("type").notNull(),
  referenceId: integer("reference_id"),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  gatewayRef: text("gateway_ref"),
  createdAt: timestamp("created_at").defaultNow()
});
