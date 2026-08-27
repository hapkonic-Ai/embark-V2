import { desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  events,
  mentorProfiles,
  playbooks,
  submissions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";

const admin = roleQuery("admin", "superadmin");
const superadmin = roleQuery("superadmin");

const eventInput = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(8000).optional(),
  rules: z.string().max(8000).optional(),
  type: z.enum(["hackathon", "case_competition"]),
  prize: z.string().max(255).optional(),
  emoji: z.string().max(16).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  status: z.enum(["draft", "live", "closed"]).default("draft"),
});

const playbookInput = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(8000).optional(),
  category: z.string().max(128).default("GDPI"),
  price: z.number().int().min(0).max(100000),
  pages: z.number().int().min(1).max(2000).default(40),
  emoji: z.string().max(16).default("📘"),
  coverImage: z.string().max(512).optional().or(z.literal("")),
  isPublished: z.boolean().default(true),
});

export const adminRouter = createRouter({
  overview: admin.query(async () => {
    const db = getDb();
    const [u] = await db.select({ n: sql<number>`count(*)` }).from(users);
    const [m] = await db
      .select({ n: sql<number>`count(*)` })
      .from(mentorProfiles);
    const [e] = await db.select({ n: sql<number>`count(*)` }).from(events);
    const [s] = await db
      .select({ n: sql<number>`count(*)` })
      .from(submissions);
    return {
      users: Number(u?.n ?? 0),
      mentors: Number(m?.n ?? 0),
      events: Number(e?.n ?? 0),
      submissions: Number(s?.n ?? 0),
    };
  }),

  // --------------------------------------------------------------- events
  listEvents: admin.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        event: events,
        submissionCount: sql<number>`(
          select count(*) from ${submissions} s where s.eventId = ${events.id}
        )`,
      })
      .from(events)
      .orderBy(desc(events.createdAt));
    return rows.map((r) => ({
      ...r.event,
      submissionCount: Number(r.submissionCount),
    }));
  }),

  createEvent: admin.input(eventInput).mutation(async ({ ctx, input }) => {
    await getDb()
      .insert(events)
      .values({ ...input, createdBy: ctx.user.id });
    return { success: true };
  }),

  updateEvent: admin
    .input(eventInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await getDb().update(events).set(data).where(eq(events.id, id));
      return { success: true };
    }),

  deleteEvent: admin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(submissions).where(eq(submissions.eventId, input.id));
      await db.delete(events).where(eq(events.id, input.id));
      return { success: true };
    }),

  // ----------------------------------------------------------- submissions
  submissionsForEvent: admin
    .input(z.object({ eventId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ submission: submissions, name: users.name, email: users.email })
        .from(submissions)
        .innerJoin(users, eq(users.id, submissions.userId))
        .where(eq(submissions.eventId, input.eventId))
        .orderBy(desc(submissions.createdAt));
      return rows.map((r) => ({
        ...r,
        submission: { ...r.submission, fileData: undefined },
      }));
    }),

  downloadSubmission: admin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(submissions)
        .where(eq(submissions.id, input.id))
        .limit(1);
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        fileName: rows[0].fileName,
        fileMime: rows[0].fileMime,
        fileBase64: rows[0].fileData,
      };
    }),

  evaluateSubmission: admin
    .input(
      z.object({
        id: z.number(),
        score: z.number().int().min(0).max(100).optional(),
        feedback: z.string().max(4000).optional(),
        status: z.enum(["submitted", "shortlisted", "winner", "rejected"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await getDb().update(submissions).set(data).where(eq(submissions.id, id));
      return { success: true };
    }),

  // ----------------------------------------------------------- playbooks
  listPlaybooks: admin.query(async () => {
    return getDb().select().from(playbooks).orderBy(desc(playbooks.createdAt));
  }),

  createPlaybook: admin.input(playbookInput).mutation(async ({ input }) => {
    await getDb().insert(playbooks).values({
      ...input,
      coverImage: input.coverImage || null,
    });
    return { success: true };
  }),

  updatePlaybook: admin
    .input(playbookInput.partial().extend({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const set: Partial<typeof playbooks.$inferInsert> = { ...data };
      if (data.coverImage === "") set.coverImage = null;
      await getDb().update(playbooks).set(set).where(eq(playbooks.id, id));
      return { success: true };
    }),

  deletePlaybook: admin
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(playbooks).where(eq(playbooks.id, input.id));
      return { success: true };
    }),

  // --------------------------------------------------------------- users
  listUsers: admin.query(async () => {
    return getDb()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  }),

  // -------------------------------------------------------- superadmin only
  listMentorProfiles: superadmin.query(async () => {
    const db = getDb();
    return db
      .select({ profile: mentorProfiles, name: users.name, email: users.email })
      .from(mentorProfiles)
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .orderBy(desc(mentorProfiles.createdAt));
  }),

  verifyMentor: superadmin
    .input(z.object({ profileId: z.number(), verified: z.boolean() }))
    .mutation(async ({ input }) => {
      await getDb()
        .update(mentorProfiles)
        .set({ isVerified: input.verified })
        .where(eq(mentorProfiles.id, input.profileId));
      return { success: true };
    }),

  setUserRole: superadmin
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["candidate", "mentor", "admin", "superadmin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't change your own role.",
        });
      }
      const db = getDb();
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));
      if (input.role === "mentor") {
        const existing = await db
          .select({ id: mentorProfiles.id })
          .from(mentorProfiles)
          .where(eq(mentorProfiles.userId, input.userId))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(mentorProfiles).values({ userId: input.userId });
        }
      }
      return { success: true };
    }),

  toggleUserActive: superadmin
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't deactivate yourself.",
        });
      }
      await getDb()
        .update(users)
        .set({ isActive: input.isActive })
        .where(eq(users.id, input.userId));
      return { success: true };
    }),
});
