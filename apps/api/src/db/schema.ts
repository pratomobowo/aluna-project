import {
  boolean,
  index,
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
  isTherapist: boolean("is_therapist").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull()
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

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

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    gender: text("gender"),
    birthYear: integer("birth_year"),
    city: text("city"),
    referralSource: text("referral_source"),
    updatedAt: timestamp("updated_at").defaultNow()
  },
  (table) => [index("profiles_userId_idx").on(table.userId)]
);

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
  scheduleId: integer("schedule_id").unique().references(() => schedules.id),
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
  therapistId: integer("therapist_id").references(() => therapists.id),
  therapistNet: integer("therapist_net"),
  status: text("status").default("pending"),
  gatewayRef: text("gateway_ref"),
  createdAt: timestamp("created_at").defaultNow()
});

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    mood: integer("mood").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => [
    uniqueIndex("journal_entries_userId_date_idx").on(table.userId, table.date)
  ]
);

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  mode: text("mode").notNull(),
  price: integer("price").notNull().default(0),
  category: text("category").notNull(),
  icon: text("icon")
});

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  memberCount: integer("member_count").notNull().default(0),
  schedule: text("schedule"),
  icon: text("icon")
});

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  tag: text("tag").notNull(),
  points: integer("points").notNull(),
  icon: text("icon"),
  active: boolean("active").notNull().default(true)
});

export const pointsTransactions = pgTable(
  "points_transactions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => [index("points_transactions_userId_idx").on(table.userId)]
);

export const dailyTaskCompletions = pgTable(
  "daily_task_completions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: text("task_id").notNull(),
    date: text("date").notNull(),
    points: integer("points").notNull(),
    createdAt: timestamp("created_at").defaultNow()
  },
  (table) => [
    uniqueIndex("daily_task_completions_userId_date_taskId_idx").on(
      table.userId,
      table.date,
      table.taskId
    )
  ]
);

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id")
    .notNull()
    .references(() => rewards.id),
  pointsSpent: integer("points_spent").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
