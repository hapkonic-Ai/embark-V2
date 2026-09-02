import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  longtext,
  json,
  timestamp,
  bigint,
  int,
  double,
  boolean,
  uniqueIndex,
  index,
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
  role: mysqlEnum("role", [
    "candidate",
    "mentor",
    "expert",
    "campus",
    "admin",
    "superadmin",
  ])
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

  // legacy mentor fields (preserved)
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

  // expert foundation fields (Phase 1)
  displayName: varchar("displayName", { length: 120 }),
  profileImage: text("profileImage"),
  coverImage: text("coverImage"),
  location: varchar("location", { length: 128 }),
  country: varchar("country", { length: 128 }),
  timezone: varchar("timezone", { length: 64 }),
  currentRole: varchar("currentRole", { length: 255 }),
  industries: varchar("industries", { length: 512 }), // comma separated
  languages: varchar("languages", { length: 512 }), // comma separated
  githubUrl: varchar("githubUrl", { length: 320 }),
  portfolioUrl: varchar("portfolioUrl", { length: 320 }),
  websiteUrl: varchar("websiteUrl", { length: 320 }),

  // lifecycle / state fields
  status: mysqlEnum("status", [
    "draft",
    "onboarding",
    "active",
    "suspended",
    "deactivated",
  ])
    .default("draft")
    .notNull(),
  onboardingStatus: mysqlEnum("onboardingStatus", [
    "not_started",
    "in_progress",
    "completed",
  ])
    .default("not_started")
    .notNull(),
  verificationStatus: mysqlEnum("verificationStatus", [
    "not_started",
    "pending",
    "verified",
    "rejected",
  ])
    .default("not_started")
    .notNull(),
  profileCompletionPercent: int("profileCompletionPercent").default(0).notNull(),

  // legacy verification flag (kept for backward compatibility)
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

export const mentorshipPayments = mysqlTable("mentorship_payments", {
  id: serial("id").primaryKey(),
  mentorshipId: bigint("mentorshipId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  mentorProfileId: bigint("mentorProfileId", { mode: "number", unsigned: true })
    .notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  provider: varchar("provider", { length: 32 }).default("demo").notNull(),
  providerPaymentId: varchar("providerPaymentId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "success", "failed"])
    .default("pending")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MentorshipPayment = typeof mentorshipPayments.$inferSelect;

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
  coverImage: text("coverImage"),
  fileUrl: text("fileUrl"),
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
  coverImage: text("coverImage"),
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
  topic: varchar("topic", { length: 255 }),
  proposedDate: timestamp("proposedDate"),
  confirmedDate: timestamp("confirmedDate"),
  campusNote: text("campusNote"),
  campusContact: text("campusContact"),
  mentorNote: text("mentorNote"),
  mentorContact: text("mentorContact"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type GuestLectureRequest = typeof guestLectureRequests.$inferSelect;

// ============================================================ expert foundation

export const expertOnboarding = mysqlTable("expert_onboarding", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  currentStep: varchar("currentStep", { length: 64 })
    .default("account")
    .notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"])
    .default("not_started")
    .notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  lastCompletedStep: varchar("lastCompletedStep", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ExpertOnboarding = typeof expertOnboarding.$inferSelect;

export const fileAssets = mysqlTable("file_assets", {
  id: serial("id").primaryKey(),
  ownerId: bigint("ownerId", { mode: "number", unsigned: true }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  size: int("size").default(0).notNull(),
  provider: varchar("provider", { length: 64 }).default("database").notNull(),
  storageKey: varchar("storageKey", { length: 512 }),
  url: text("url"),
  data: longtext("data"), // base64 fallback for Phase 1
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type FileAsset = typeof fileAssets.$inferSelect;

export const expertResumes = mysqlTable("expert_resumes", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  fileAssetId: bigint("fileAssetId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  status: mysqlEnum("status", [
    "uploaded",
    "parsing",
    "parsed",
    "review_required",
    "verified",
    "failed",
  ])
    .default("uploaded")
    .notNull(),
  parserStatus: mysqlEnum("parserStatus", [
    "not_started",
    "running",
    "success",
    "partial",
    "failed",
  ])
    .default("not_started")
    .notNull(),
  parserProvider: varchar("parserProvider", { length: 64 })
    .default("text-extractor")
    .notNull(),
  rawText: longtext("rawText"),
  parsedData: json("parsedData"),
  parsingError: text("parsingError"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  parsedAt: timestamp("parsedAt"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ExpertResume = typeof expertResumes.$inferSelect;

export const expertExperience = mysqlTable(
  "expert_experience",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    role: varchar("role", { length: 255 }),
    employmentType: varchar("employmentType", { length: 64 }),
    location: varchar("location", { length: 128 }),
    startDate: varchar("startDate", { length: 32 }),
    endDate: varchar("endDate", { length: 32 }),
    isCurrent: boolean("isCurrent").default(false).notNull(),
    description: text("description"),
    displayOrder: int("displayOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("expert_experience_user_order_unique").on(t.userId, t.displayOrder)],
);

export type ExpertExperience = typeof expertExperience.$inferSelect;

export const expertEducation = mysqlTable(
  "expert_education",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    institution: varchar("institution", { length: 255 }).notNull(),
    degree: varchar("degree", { length: 255 }),
    fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
    startDate: varchar("startDate", { length: 32 }),
    endDate: varchar("endDate", { length: 32 }),
    grade: varchar("grade", { length: 64 }),
    description: text("description"),
    displayOrder: int("displayOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("expert_education_user_order_unique").on(t.userId, t.displayOrder)],
);

export type ExpertEducation = typeof expertEducation.$inferSelect;

export const expertVerifications = mysqlTable("expert_verifications", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
  status: mysqlEnum("status", [
    "not_started",
    "pending",
    "approved",
    "rejected",
  ])
    .default("not_started")
    .notNull(),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: bigint("reviewedBy", { mode: "number", unsigned: true }),
  rejectionReason: text("rejectionReason"),
  verificationType: varchar("verificationType", { length: 64 })
    .default("profile_review")
    .notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ExpertVerification = typeof expertVerifications.$inferSelect;


// ============================================================ expert page (phase 2)

export const expertPages = mysqlTable("expert_pages", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["draft", "published", "unpublished"])
    .default("draft")
    .notNull(),
  metaTitle: varchar("metaTitle", { length: 120 }),
  metaDescription: varchar("metaDescription", { length: 255 }),
  ogImage: text("ogImage"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ExpertPage = typeof expertPages.$inferSelect;

export const expertPageConfigs = mysqlTable("expert_page_configs", {
  id: serial("id").primaryKey(),
  pageId: bigint("pageId", { mode: "number", unsigned: true })
    .notNull()
    .unique(),
  theme: varchar("theme", { length: 32 }).default("professional").notNull(),
  accentColor: varchar("accentColor", { length: 7 }).default("#F97316").notNull(),
  background: varchar("background", { length: 32 }).default("light").notNull(),
  profileImageStyle: varchar("profileImageStyle", { length: 32 })
    .default("rounded")
    .notNull(),
  coverStyle: varchar("coverStyle", { length: 32 }).default("gradient").notNull(),
  buttonStyle: varchar("buttonStyle", { length: 32 }).default("rounded").notNull(),
  ctaType: varchar("ctaType", { length: 32 }).default("none").notNull(),
  ctaLabel: varchar("ctaLabel", { length: 64 }),
  ctaTarget: varchar("ctaTarget", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type ExpertPageConfig = typeof expertPageConfigs.$inferSelect;

export const expertPageSections = mysqlTable(
  "expert_page_sections",
  {
    id: serial("id").primaryKey(),
    pageId: bigint("pageId", { mode: "number", unsigned: true }).notNull(),
    sectionType: varchar("sectionType", { length: 64 }).notNull(),
    displayOrder: int("displayOrder").default(0).notNull(),
    isVisible: boolean("isVisible").default(true).notNull(),
    config: json("config"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("expert_page_sections_page_order_unique").on(t.pageId, t.sectionType)],
);

export type ExpertPageSection = typeof expertPageSections.$inferSelect;

// ============================================================ expert services (phase 3)

export const mentorServices = mysqlTable(
  "mentor_services",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    description: text("description"),
    serviceType: mysqlEnum("serviceType", [
      "one_on_one",
      "review",
      "consultation",
      "mentorship",
    ])
      .default("one_on_one")
      .notNull(),
    price: int("price").default(0).notNull(),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    durationMinutes: int("durationMinutes"),
    deliveryMode: mysqlEnum("deliveryMode", [
      "online",
      "offline",
      "async",
      "hybrid",
    ]).default("online"),
    requirements: text("requirements"),
    outcomes: text("outcomes"),
    image: text("image"),
    status: mysqlEnum("status", [
      "draft",
      "published",
      "unpublished",
      "archived",
    ])
      .default("draft")
      .notNull(),
    displayOrder: int("displayOrder").default(0).notNull(),
    intakeConfiguration: json("intakeConfiguration"),
    isBookable: boolean("isBookable").default(true).notNull(),
    requiresPayment: boolean("requiresPayment").default(true).notNull(),
    communicationMode: mysqlEnum("communicationMode", [
      "none",
      "whatsapp_direct",
      "whatsapp_group",
      "whatsapp_direct_and_group",
    ]).default("none"),
    whatsappDirectNumber: varchar("whatsappDirectNumber", { length: 32 }),
    whatsappGroupInviteUrl: varchar("whatsappGroupInviteUrl", { length: 512 }),
    whatsappGroupAccessPolicy: mysqlEnum("whatsappGroupAccessPolicy", [
      "after_booking",
      "after_payment",
      "after_completion",
      "manual",
    ]).default("after_payment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("mentor_services_user_slug_unique").on(t.userId, t.slug)],
);

export type MentorService = typeof mentorServices.$inferSelect;
export type InsertMentorService = typeof mentorServices.$inferInsert;

export const mentorServicePackages = mysqlTable(
  "mentor_service_packages",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull(),
    description: text("description"),
    image: text("image"),
    price: int("price"),
    currency: varchar("currency", { length: 3 }).default("INR").notNull(),
    status: mysqlEnum("status", ["draft", "published", "unpublished", "archived"])
      .default("draft")
      .notNull(),
    displayOrder: int("displayOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("mentor_service_packages_user_slug_unique").on(t.userId, t.slug)],
);

export type MentorServicePackage = typeof mentorServicePackages.$inferSelect;
export type InsertMentorServicePackage = typeof mentorServicePackages.$inferInsert;

export const mentorServicePackageItems = mysqlTable(
  "mentor_service_package_items",
  {
    id: serial("id").primaryKey(),
    packageId: bigint("packageId", { mode: "number", unsigned: true }).notNull(),
    serviceId: bigint("serviceId", { mode: "number", unsigned: true }).notNull(),
    displayOrder: int("displayOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("mentor_service_package_items_package_service_unique").on(t.packageId, t.serviceId),
  ],
);

export type MentorServicePackageItem = typeof mentorServicePackageItems.$inferSelect;
export type InsertMentorServicePackageItem = typeof mentorServicePackageItems.$inferInsert;

// ============================================================ calendar & availability (phase 4)

export const dayOfWeekEnum = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const expertAvailabilityRules = mysqlTable(
  "expert_availability_rules",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    dayOfWeek: mysqlEnum("dayOfWeek", dayOfWeekEnum).notNull(),
    startTime: varchar("startTime", { length: 5 }).notNull(),
    endTime: varchar("endTime", { length: 5 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("expert_availability_rules_user_day_time_unique").on(
      t.userId,
      t.dayOfWeek,
      t.startTime,
      t.endTime,
    ),
  ],
);

export type ExpertAvailabilityRule = typeof expertAvailabilityRules.$inferSelect;
export type InsertExpertAvailabilityRule = typeof expertAvailabilityRules.$inferInsert;

export const exceptionTypeEnum = ["block", "override"] as const;

export const expertAvailabilityExceptions = mysqlTable(
  "expert_availability_exceptions",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    exceptionDate: varchar("exceptionDate", { length: 10 }).notNull(),
    type: mysqlEnum("type", exceptionTypeEnum).notNull(),
    startTime: varchar("startTime", { length: 5 }),
    endTime: varchar("endTime", { length: 5 }),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("expert_availability_exceptions_user_date_unique").on(t.userId, t.exceptionDate)],
);

export type ExpertAvailabilityException = typeof expertAvailabilityExceptions.$inferSelect;
export type InsertExpertAvailabilityException = typeof expertAvailabilityExceptions.$inferInsert;

export const bookingStatusEnum = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;

export const expertBookings = mysqlTable(
  "expert_bookings",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    studentId: bigint("studentId", { mode: "number", unsigned: true }).notNull(),
    serviceId: bigint("serviceId", { mode: "number", unsigned: true }).notNull(),
    bookingReference: varchar("bookingReference", { length: 32 }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull(),
    startAt: timestamp("startAt").notNull(),
    endAt: timestamp("endAt").notNull(),
    status: mysqlEnum("status", bookingStatusEnum).default("pending").notNull(),
    intakeResponses: json("intakeResponses"),
    serviceSnapshot: json("serviceSnapshot").default({}).notNull(),
    cancellationReason: text("cancellationReason"),
    orderId: bigint("orderId", { mode: "number", unsigned: true }),
    meetingUrl: varchar("meetingUrl", { length: 512 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("expert_bookings_user_start_unique").on(t.userId, t.startAt),
    uniqueIndex("expert_bookings_reference_unique").on(t.bookingReference),
    index("expert_bookings_user_start_end_idx").on(t.userId, t.startAt, t.endAt),
    index("expert_bookings_student_start_idx").on(t.studentId, t.startAt),
    index("expert_bookings_order_idx").on(t.orderId),
  ],
);

export type ExpertBooking = typeof expertBookings.$inferSelect;
export type InsertExpertBooking = typeof expertBookings.$inferInsert;

// ============================================================ booking & session (phase 5)

export const sessionStatusEnum = ["scheduled", "in_progress", "completed", "cancelled", "no_show"] as const;

export const sessions = mysqlTable("sessions", {
  id: serial("id").primaryKey(),
  bookingId: bigint("bookingId", { mode: "number", unsigned: true }).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  status: mysqlEnum("status", sessionStatusEnum).default("scheduled").notNull(),
  meetingUrl: varchar("meetingUrl", { length: 512 }),
  meetingProvider: varchar("meetingProvider", { length: 32 }),
  notes: text("notes"),
  studentFeedback: text("studentFeedback"),
  expertFeedback: text("expertFeedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("sessions_booking_unique").on(t.bookingId),
  index("sessions_start_status_idx").on(t.startAt, t.status),
]);

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export const orderStatusEnum = ["pending", "paid", "failed", "refunded", "cancelled"] as const;

export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  bookingId: bigint("bookingId", { mode: "number", unsigned: true }).notNull(),
  studentId: bigint("studentId", { mode: "number", unsigned: true }).notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  status: mysqlEnum("status", orderStatusEnum).default("pending").notNull(),
  snapshot: json("snapshot").default({}).notNull(),
  provider: varchar("provider", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("orders_booking_unique").on(t.bookingId),
  index("orders_student_idx").on(t.studentId),
]);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const paymentStatusEnum = ["pending", "success", "failed"] as const;

export const payments = mysqlTable("payments", {
  id: serial("id").primaryKey(),
  orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  providerPaymentId: varchar("providerPaymentId", { length: 128 }).notNull(),
  amount: int("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", paymentStatusEnum).default("pending").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  uniqueIndex("payments_provider_ref_unique").on(t.provider, t.providerPaymentId),
  index("payments_order_idx").on(t.orderId),
]);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============================================================ expert operations (phase 6)

export const expertNotes = mysqlTable(
  "expert_notes",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    studentId: bigint("studentId", { mode: "number", unsigned: true }).notNull(),
    bookingId: bigint("bookingId", { mode: "number", unsigned: true }),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("expert_notes_user_student_idx").on(t.userId, t.studentId),
    index("expert_notes_user_booking_idx").on(t.userId, t.bookingId),
  ],
);

export type ExpertNote = typeof expertNotes.$inferSelect;
export type InsertExpertNote = typeof expertNotes.$inferInsert;

export const reviewStatusEnum = ["pending", "approved", "rejected"] as const;

export const reviews = mysqlTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    bookingId: bigint("bookingId", { mode: "number", unsigned: true }).notNull(),
    studentId: bigint("studentId", { mode: "number", unsigned: true }).notNull(),
    expertUserId: bigint("expertUserId", { mode: "number", unsigned: true }).notNull(),
    serviceId: bigint("serviceId", { mode: "number", unsigned: true }).notNull(),
    rating: int("rating").notNull(),
    title: varchar("title", { length: 255 }),
    content: text("content"),
    isPublic: boolean("isPublic").default(true).notNull(),
    status: mysqlEnum("status", reviewStatusEnum).default("approved").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("reviews_booking_unique").on(t.bookingId),
    index("reviews_expert_user_idx").on(t.expertUserId),
    index("reviews_service_idx").on(t.serviceId),
    index("reviews_student_idx").on(t.studentId),
  ],
);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;
