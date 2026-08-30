import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  events,
  mentorProfiles,
  mentorships,
  mockSessions,
  playbookPurchases,
  playbooks,
  submissions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";

const candidate = roleQuery("candidate");

const ACCEPTED_MIMES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export const candidateRouter = createRouter({
  // ---------------------------------------------------------- mentorships
  purchaseMentorship: candidate
    .input(z.object({ mentorProfileId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select({ profile: mentorProfiles, name: users.name })
        .from(mentorProfiles)
        .innerJoin(users, eq(users.id, mentorProfiles.userId))
        .where(eq(mentorProfiles.id, input.mentorProfileId))
        .limit(1);
      const mentor = rows[0];
      const isVerified = mentor?.profile.isVerified || mentor?.profile.verificationStatus === "verified";
      if (!mentor || !isVerified) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mentor not found" });
      }
      const dup = await db
        .select({ id: mentorships.id })
        .from(mentorships)
        .where(
          and(
            eq(mentorships.candidateId, ctx.user.id),
            eq(mentorships.mentorProfileId, input.mentorProfileId),
            eq(mentorships.status, "active"),
          ),
        )
        .limit(1);
      if (dup.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have an active mentorship with this mentor.",
        });
      }
      await db.insert(mentorships).values({
        candidateId: ctx.user.id,
        mentorProfileId: input.mentorProfileId,
        price: mentor.profile.price,
        gdTotal: mentor.profile.mockGds,
        piTotal: mentor.profile.mockPis,
      });
      return { success: true, whatsapp: mentor.profile.whatsapp };
    }),

  myMentorships: candidate.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        mentorship: mentorships,
        profile: mentorProfiles,
        mentorName: users.name,
      })
      .from(mentorships)
      .innerJoin(
        mentorProfiles,
        eq(mentorProfiles.id, mentorships.mentorProfileId),
      )
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .where(eq(mentorships.candidateId, ctx.user.id))
      .orderBy(desc(mentorships.createdAt));
    const all = await Promise.all(
      rows.map(async (r) => {
        const s = await db
          .select()
          .from(mockSessions)
          .where(eq(mockSessions.mentorshipId, r.mentorship.id))
          .orderBy(desc(mockSessions.createdAt));
        return { ...r, sessions: s };
      }),
    );
    return all;
  }),

  requestMock: candidate
    .input(
      z.object({
        mentorshipId: z.number(),
        type: z.enum(["gd", "pi"]),
        topic: z.string().max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(mentorships)
        .where(
          and(
            eq(mentorships.id, input.mentorshipId),
            eq(mentorships.candidateId, ctx.user.id),
          ),
        )
        .limit(1);
      const m = rows[0];
      if (!m || m.status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mentorship not found" });
      }
      const used = input.type === "gd" ? m.gdUsed : m.piUsed;
      const total = input.type === "gd" ? m.gdTotal : m.piTotal;
      const pending = await db
        .select({ id: mockSessions.id })
        .from(mockSessions)
        .where(
          and(
            eq(mockSessions.mentorshipId, m.id),
            eq(mockSessions.type, input.type),
            eq(mockSessions.status, "requested"),
          ),
        );
      if (used + pending.length >= total) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `No ${input.type === "gd" ? "mock GD" : "mock interview"} sessions left in your package.`,
        });
      }
      await db.insert(mockSessions).values({
        mentorshipId: m.id,
        type: input.type,
        topic: input.topic,
      });
      return { success: true };
    }),

  // ----------------------------------------------------------- playbooks
  purchasePlaybook: candidate
    .input(z.object({ playbookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const pb = await db
        .select()
        .from(playbooks)
        .where(eq(playbooks.id, input.playbookId))
        .limit(1);
      if (!pb[0] || !pb[0].isPublished) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Playbook not found" });
      }
      const dup = await db
        .select({ id: playbookPurchases.id })
        .from(playbookPurchases)
        .where(
          and(
            eq(playbookPurchases.userId, ctx.user.id),
            eq(playbookPurchases.playbookId, input.playbookId),
          ),
        )
        .limit(1);
      if (dup.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already own this playbook.",
        });
      }
      await db.insert(playbookPurchases).values({
        userId: ctx.user.id,
        playbookId: input.playbookId,
        price: pb[0].price,
      });
      return { success: true };
    }),

  myPlaybooks: candidate.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({ purchase: playbookPurchases, playbook: playbooks })
      .from(playbookPurchases)
      .innerJoin(playbooks, eq(playbooks.id, playbookPurchases.playbookId))
      .where(eq(playbookPurchases.userId, ctx.user.id))
      .orderBy(desc(playbookPurchases.createdAt));
  }),

  // -------------------------------------------------------------- events
  submitEvent: candidate
    .input(
      z.object({
        eventId: z.number(),
        teamName: z.string().min(1).max(255),
        title: z.string().min(1).max(255),
        note: z.string().max(2000).optional(),
        fileName: z.string().min(1).max(255),
        fileMime: z.string().max(128),
        fileBase64: z.string().max(12_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!ACCEPTED_MIMES.includes(input.fileMime)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only PDF, PPT, PPTX, DOC or DOCX files are accepted.",
        });
      }
      const approxBytes = Math.floor(input.fileBase64.length * 0.75);
      if (approxBytes > MAX_FILE_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File too large — maximum 8 MB.",
        });
      }
      const ev = await db
        .select()
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1);
      if (!ev[0] || ev[0].status !== "live") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This event is not accepting submissions.",
        });
      }
      if (ev[0].endAt && new Date(ev[0].endAt) < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The submission deadline has passed.",
        });
      }
      const existing = await db
        .select()
        .from(submissions)
        .where(
          and(
            eq(submissions.eventId, input.eventId),
            eq(submissions.userId, ctx.user.id),
          ),
        )
        .limit(1);
      if (existing[0]) {
        if (existing[0].status === "winner") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Winning submissions can't be replaced.",
          });
        }
        await db
          .update(submissions)
          .set({
            teamName: input.teamName,
            title: input.title,
            note: input.note,
            fileName: input.fileName,
            fileMime: input.fileMime,
            fileData: input.fileBase64,
            fileSize: approxBytes,
            status: "submitted",
            score: null,
            feedback: null,
          })
          .where(eq(submissions.id, existing[0].id));
        return { success: true, updated: true };
      }
      await db.insert(submissions).values({
        eventId: input.eventId,
        userId: ctx.user.id,
        teamName: input.teamName,
        title: input.title,
        note: input.note,
        fileName: input.fileName,
        fileMime: input.fileMime,
        fileData: input.fileBase64,
        fileSize: approxBytes,
      });
      return { success: true, updated: false };
    }),

  mySubmissions: candidate.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ submission: submissions, event: events })
      .from(submissions)
      .innerJoin(events, eq(events.id, submissions.eventId))
      .where(eq(submissions.userId, ctx.user.id))
      .orderBy(desc(submissions.createdAt));
    return rows.map((r) => ({
      ...r,
      submission: { ...r.submission, fileData: undefined },
    }));
  }),

  downloadSubmission: candidate
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(submissions)
        .where(
          and(eq(submissions.id, input.id), eq(submissions.userId, ctx.user.id)),
        )
        .limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
      }
      const s = rows[0];
      return {
        fileName: s.fileName,
        fileMime: s.fileMime,
        fileBase64: s.fileData,
      };
    }),
});
