import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  longtext,
  timestamp,
  bigint,
  int,
  double,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  linkedinUrl: varchar("linkedinUrl", { length: 320 }),
  termsAcceptedAt: timestamp("termsAcceptedAt"),
  termsVersion: varchar("termsVersion", { length: 16 }),
  role: mysqlEnum("role", ["candidate", "mentor", "campus", "admin", "superadmin"])
    .default("candidate")
    .notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------- mentors

export const mentorProfiles = mysqlTable("mentor_profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  publicSlug: varchar("publicSlug", { length: 64 }).unique(),
  headline: varchar("headline", { length: 255 }),
  bschool: varchar("bschool", { length: 255 }),
  company: varchar("company", { length: 255 }),
  expertise: varchar("expertise", { length: 512 }), // comma separated tags
  yearsExp: int("yearsExp").default(0).notNull(),
  bio: text("bio"),
  whatsapp: varchar("whatsapp", { length: 32 }),
  linkedinUrl: varchar("linkedinUrl", { length: 320 }),
  price: int("price").default(9999).notNull(), // INR, full mentorship package
  mockGds: int("mockGds").default(3).notNull(), // mock GDs included
  mockPis: int("mockPis").default(3).notNull(), // mock PIs included
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MentorProfile = typeof mentorProfiles.$inferSelect;

// ------------------------------------------------------------ mentorships

export const mentorships = mysqlTable("mentorships", {
  id: serial("id").primaryKey(),
  candidateId: bigint("candidateId", { mode: "number", unsigned: true })
    .notNull(),
  mentorProfileId: bigint("mentorProfileId", { mode: "number", unsigned: true })
    .notNull(),
  plan: varchar("plan", { length: 64 }).default("Standard").notNull(),
  price: int("price").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"])
    .default("active")
    .notNull(),
  gdTotal: int("gdTotal").notNull(),
  gdUsed: int("gdUsed").default(0).notNull(),
  piTotal: int("piTotal").notNull(),
  piUsed: int("piUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Mentorship = typeof mentorships.$inferSelect;

export const mockSessions = mysqlTable("mock_sessions", {
  id: serial("id").primaryKey(),
  mentorshipId: bigint("mentorshipId", { mode: "number", unsigned: true })
    .notNull(),
  type: mysqlEnum("type", ["gd", "pi"]).notNull(),
  topic: varchar("topic", { length: 255 }),
  scheduledNote: varchar("scheduledNote", { length: 255 }),
  status: mysqlEnum("status", ["requested", "scheduled", "completed"])
    .default("requested")
    .notNull(),
  score: int("score"),
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MockSession = typeof mockSessions.$inferSelect;

// -------------------------------------------------------------- playbooks

export const playbooks = mysqlTable("playbooks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 128 }).default("GDPI").notNull(),
  price: int("price").notNull(),
  pages: int("pages").default(40).notNull(),
  emoji: varchar("emoji", { length: 16 }).default("📘").notNull(),
  coverImage: varchar("coverImage", { length: 512 }),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Playbook = typeof playbooks.$inferSelect;

export const playbookPurchases = mysqlTable(
  "playbook_purchases",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    playbookId: bigint("playbookId", { mode: "number", unsigned: true })
      .notNull(),
    price: int("price").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("pb_user_unique").on(t.userId, t.playbookId)],
);

// ----------------------------------------------------------------- events

export const events = mysqlTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  rules: text("rules"),
  type: mysqlEnum("type", ["hackathon", "case_competition"])
    .default("hackathon")
    .notNull(),
  prize: varchar("prize", { length: 255 }),
  emoji: varchar("emoji", { length: 16 }).default("🏆").notNull(),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  status: mysqlEnum("status", ["draft", "live", "closed"])
    .default("draft")
    .notNull(),
  createdBy: bigint("createdBy", { mode: "number", unsigned: true }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmbarkEvent = typeof events.$inferSelect;

export const submissions = mysqlTable(
  "submissions",
  {
    id: serial("id").primaryKey(),
    eventId: bigint("eventId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    teamName: varchar("teamName", { length: 255 }),
    title: varchar("title", { length: 255 }),
    note: text("note"),
    fileName: varchar("fileName", { length: 255 }),
    fileMime: varchar("fileMime", { length: 128 }),
    fileData: longtext("fileData"), // base64 payload
    fileSize: int("fileSize").default(0).notNull(),
    score: int("score"),
    feedback: text("feedback"),
    status: mysqlEnum("status", [
      "submitted",
      "shortlisted",
      "winner",
      "rejected",
    ])
      .default("submitted")
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("sub_event_user_unique").on(t.eventId, t.userId)],
);

export type Submission = typeof submissions.$inferSelect;

// --------------------------------------------------------------- colleges

export const colleges = mysqlTable("colleges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("shortName", { length: 64 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  type: varchar("type", { length: 64 }).default("Private").notNull(), // IIM / IIT / Govt / Private
  nirfRank: int("nirfRank"),
  fees: int("fees").notNull(), // total programme fee in INR
  avgPackage: double("avgPackage"), // LPA
  highestPackage: double("highestPackage"), // LPA
  exams: varchar("exams", { length: 255 }), // CAT, XAT, GMAT...
  cutoff: varchar("cutoff", { length: 128 }), // e.g. "99+ %ile CAT"
  established: int("established"),
  website: varchar("website", { length: 255 }),
  logoUrl: varchar("logoUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type College = typeof colleges.$inferSelect;

// ------------------------------------------------------- guest lectures

export const guestLectureRequests = mysqlTable("guest_lecture_requests", {
  id: serial("id").primaryKey(),
  campusId: bigint("campusId", { mode: "number", unsigned: true }).notNull(),
  mentorProfileId: bigint("mentorProfileId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"])
    .default("pending")
    .notNull(),
  proposedDate: timestamp("proposedDate"),
  confirmedDate: timestamp("confirmedDate"),
  campusNote: text("campusNote"),
  mentorNote: text("mentorNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type GuestLectureRequest = typeof guestLectureRequests.$inferSelect;
