import { and, count, desc, eq, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Buffer } from "node:buffer";
import {
  events,
  mentorProfiles,
  mentorships,
  mockSessions,
  orders,
  playbookPurchases,
  playbooks,
  reviews,
  studentOnboarding,
  submissions,
  users,
  fileAssets,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import { parseDataUrl, resolveAssetUrl } from "../lib/file-assets";
import { getObject, parsePublicObjectUrl } from "../lib/s3-client";
import { regexParser } from "../lib/resume-parsers/regex-parser";

const STUDENT_RESUME_MIMES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_STUDENT_RESUME_BYTES = 8 * 1024 * 1024;
const linkedinUrlCheck = (v: string) =>
  !v || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//.test(v);

const candidate = roleQuery("candidate");

const ACCEPTED_MIMES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_BYTES = 8 * 1024 * 1024;

type MentorshipBaseRow = {
  mentorship: typeof mentorships.$inferSelect;
  profile: typeof mentorProfiles.$inferSelect;
  mentorName: string | null;
};

async function withMentorshipDetails(
  db: ReturnType<typeof getDb>,
  rows: MentorshipBaseRow[],
  candidateId: number,
) {
  return Promise.all(
    rows.map(async (r) => {
      const [s, order, review] = await Promise.all([
        db
          .select()
          .from(mockSessions)
          .where(eq(mockSessions.mentorshipId, r.mentorship.id))
          .orderBy(desc(mockSessions.createdAt)),
        db
          .select()
          .from(orders)
          .where(eq(orders.mentorshipId, r.mentorship.id))
          .orderBy(desc(orders.createdAt))
          .limit(1)
          .then((x) => x[0] ?? null),
        db
          .select()
          .from(reviews)
          .where(
            and(
              eq(reviews.mentorshipId, r.mentorship.id),
              eq(reviews.studentId, candidateId),
            ),
          )
          .limit(1)
          .then((x) => x[0] ?? null),
      ]);
      return { ...r, sessions: s, order, review };
    }),
  );
}

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
      const result = await db.transaction(async (tx) => {
        const [m] = await tx
          .insert(mentorships)
          .values({
            candidateId: ctx.user.id,
            mentorProfileId: input.mentorProfileId,
            price: mentor.profile.price,
            gdTotal: mentor.profile.mockGds,
            piTotal: mentor.profile.mockPis,
          })
          .$returningId();
        const [order] = await tx
          .insert(orders)
          .values({
            studentId: ctx.user.id,
            mentorshipId: m.id,
            amount: mentor.profile.price,
            currency: "INR",
            status: "pending",
            snapshot: {
              type: "mentorship",
              mentorProfileId: input.mentorProfileId,
              mentorName: mentor.name,
              gdTotal: mentor.profile.mockGds,
              piTotal: mentor.profile.mockPis,
            },
          })
          .$returningId();
        return { mentorshipId: m.id, orderId: order.id };
      });
      return { success: true, whatsapp: mentor.profile.whatsapp, ...result };
    }),

  myMentorships: candidate
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(10),
        status: z.enum(["active", "completed", "cancelled"]).optional(),
        search: z.string().max(100).optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const db = getDb();
      const offset = (page - 1) * pageSize;
      const search = input?.search?.trim();
      const conds = [
        eq(mentorships.candidateId, ctx.user.id),
        ...(input?.status ? [eq(mentorships.status, input.status)] : []),
        ...(search ? [like(users.name, `%${search}%`)] : []),
      ];
      const where = and(...conds);
      const [totalRow, statusRows, rows] = await Promise.all([
        db
          .select({ count: count() })
          .from(mentorships)
          .innerJoin(
            mentorProfiles,
            eq(mentorProfiles.id, mentorships.mentorProfileId),
          )
          .innerJoin(users, eq(users.id, mentorProfiles.userId))
          .where(where),
        db
          .select({ status: mentorships.status, n: count() })
          .from(mentorships)
          .where(eq(mentorships.candidateId, ctx.user.id))
          .groupBy(mentorships.status),
        db
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
          .where(where)
          .orderBy(desc(mentorships.createdAt))
          .limit(pageSize)
          .offset(offset),
      ]);
      const statusCounts = { active: 0, completed: 0, cancelled: 0 };
      for (const r of statusRows) {
        if (r.status === "active") statusCounts.active = Number(r.n);
        else if (r.status === "completed") statusCounts.completed = Number(r.n);
        else statusCounts.cancelled = Number(r.n);
      }
      const all = await withMentorshipDetails(db, rows, ctx.user.id);
      return { rows: all, total: Number(totalRow[0]?.count ?? 0), page, pageSize, statusCounts };
    }),

  myMentorshipDetail: candidate
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
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
        .where(
          and(
            eq(mentorships.id, input.id),
            eq(mentorships.candidateId, ctx.user.id),
          ),
        )
        .limit(1);
      if (!rows[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mentorship not found" });
      }
      const [row] = await withMentorshipDetails(db, rows, ctx.user.id);
      return row;
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
      const [order] = await db
        .select({ status: orders.status })
        .from(orders)
        .where(eq(orders.mentorshipId, m.id))
        .orderBy(desc(orders.createdAt))
        .limit(1);
      if (order && order.status !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete payment for this mentorship before requesting sessions.",
        });
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
      const offerPct = pb[0].offerPercent ?? 0;
      const effectivePrice =
        offerPct > 0
          ? Math.round((pb[0].price * (100 - offerPct)) / 100)
          : pb[0].price;
      const { orderId } = await db.transaction(async (tx) => {
        const [purchase] = await tx
          .insert(playbookPurchases)
          .values({
            userId: ctx.user.id,
            playbookId: input.playbookId,
            price: effectivePrice,
          })
          .$returningId();
        const [order] = await tx
          .insert(orders)
          .values({
            studentId: ctx.user.id,
            playbookPurchaseId: purchase.id,
            amount: effectivePrice,
            currency: "INR",
            status: "pending",
            snapshot: {
              type: "playbook",
              playbookId: input.playbookId,
              playbookTitle: pb[0].title,
              originalPrice: pb[0].price,
              offerPercent: offerPct,
            },
          })
          .$returningId();
        return { orderId: order.id };
      });
      return { success: true, orderId };
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

  downloadPlaybook: candidate
    .input(z.object({ playbookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const purchase = await db
        .select({ id: playbookPurchases.id })
        .from(playbookPurchases)
        .where(
          and(
            eq(playbookPurchases.userId, ctx.user.id),
            eq(playbookPurchases.playbookId, input.playbookId),
          ),
        )
        .limit(1);
      if (!purchase[0]) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this playbook.",
        });
      }
      const pb = await db
        .select()
        .from(playbooks)
        .where(eq(playbooks.id, input.playbookId))
        .limit(1);
      if (!pb[0] || !pb[0].fileUrl) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playbook file not found.",
        });
      }
      const resolved = await resolveAssetUrl(pb[0].fileUrl, db);
      if (!resolved) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Playbook file could not be resolved.",
        });
      }
      const parsed = parseDataUrl(resolved);
      if (parsed) {
        return {
          fileName: `${pb[0].title}.${parsed.mimeType.split("/").pop() ?? "txt"}`,
          fileMime: parsed.mimeType,
          fileBase64: parsed.base64,
        };
      }
      if (/^https?:\/\//.test(resolved)) {
        const s3Key = parsePublicObjectUrl(resolved);
        if (s3Key) {
          const obj = await getObject(s3Key);
          const fileMime = obj.contentType || "application/pdf";
          return {
            fileName: `${pb[0].title}.${fileMime.split("/").pop() ?? "pdf"}`,
            fileMime,
            fileBase64: obj.body.toString("base64"),
          };
        }
        const fileRes = await fetch(resolved);
        if (!fileRes.ok) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Playbook file could not be fetched from storage.",
          });
        }
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        const fileMime = fileRes.headers.get("content-type")?.split(";")[0] || "application/pdf";
        return {
          fileName: `${pb[0].title}.${fileMime.split("/").pop() ?? "pdf"}`,
          fileMime,
          fileBase64: buffer.toString("base64"),
        };
      }
      return {
        fileName: `${pb[0].title}.txt`,
        fileMime: "text/plain",
        fileBase64: "",
      };
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

  // ------------------------------------------------------ student onboarding
  studentOnboarding: candidate.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(studentOnboarding)
      .where(eq(studentOnboarding.userId, ctx.user.id))
      .limit(1);
    const row = rows[0] ?? null;
    let resumeFileName: string | null = null;
    if (row?.resumeFileAssetId) {
      const assets = await db
        .select({ fileName: fileAssets.fileName })
        .from(fileAssets)
        .where(eq(fileAssets.id, row.resumeFileAssetId))
        .limit(1);
      resumeFileName = assets[0]?.fileName ?? null;
    }
    return row
      ? { ...row, resumeFileName, parsedData: row.parsedData ?? null }
      : { status: "not_started" as const, currentStep: "resume" as const, parsedData: null, resumeFileName: null };
  }),

  uploadStudentResume: candidate
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        fileMime: z.string().max(128),
        fileBase64: z.string().min(1).max(12_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (!STUDENT_RESUME_MIMES.includes(input.fileMime)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported file type. Accepted: PDF, TXT, DOC, DOCX.",
        });
      }
      const approxBytes = Math.floor(input.fileBase64.length * 0.75);
      if (approxBytes > MAX_STUDENT_RESUME_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Resume too large — maximum 8 MB.",
        });
      }

      const existing = await db
        .select()
        .from(studentOnboarding)
        .where(eq(studentOnboarding.userId, ctx.user.id))
        .limit(1);

      const [fileAsset] = await db
        .insert(fileAssets)
        .values({
          ownerId: ctx.user.id,
          fileName: input.fileName,
          mimeType: input.fileMime,
          size: approxBytes,
          provider: "database",
          data: input.fileBase64,
        })
        .$returningId();

      // Replace any previously uploaded resume file.
      if (existing[0]?.resumeFileAssetId) {
        await db
          .delete(fileAssets)
          .where(eq(fileAssets.id, existing[0].resumeFileAssetId));
      }

      const parseResult = await regexParser.parse(input.fileBase64, input.fileMime);

      const values = {
        currentStep: "review",
        status: "in_progress" as const,
        resumeFileAssetId: fileAsset.id,
        parsedData: parseResult.parsed,
        startedAt: existing[0]?.startedAt ?? new Date(),
      };
      if (existing[0]) {
        await db
          .update(studentOnboarding)
          .set(values)
          .where(eq(studentOnboarding.id, existing[0].id));
      } else {
        await db.insert(studentOnboarding).values({ userId: ctx.user.id, ...values });
      }

      return {
        success: true,
        parsed: parseResult.parsed,
        error: parseResult.error,
        parserStatus: parseResult.partial
          ? "partial"
          : parseResult.success
            ? "success"
            : "failed",
      };
    }),

  completeStudentOnboarding: candidate
    .input(
      z.object({
        name: z.string().min(2).max(120),
        phone: z.string().min(3).max(32),
        linkedinUrl: z
          .string()
          .max(320)
          .refine(linkedinUrlCheck, "Enter a valid LinkedIn URL like https://linkedin.com/in/your-handle"),
        headline: z.string().max(255).optional().or(z.literal("")),
        summary: z.string().max(4000).optional().or(z.literal("")),
        skills: z.array(z.string().max(80)).max(60).default([]),
        education: z
          .array(
            z.object({
              institution: z.string().max(255).optional().or(z.literal("")),
              degree: z.string().max(255).optional().or(z.literal("")),
              fieldOfStudy: z.string().max(255).optional().or(z.literal("")),
              startDate: z.string().max(32).optional().or(z.literal("")),
              endDate: z.string().max(32).optional().or(z.literal("")),
              grade: z.string().max(64).optional().or(z.literal("")),
              description: z.string().max(2000).optional().or(z.literal("")),
            }),
          )
          .max(20)
          .default([]),
        experience: z
          .array(
            z.object({
              company: z.string().max(255).optional().or(z.literal("")),
              role: z.string().max(255).optional().or(z.literal("")),
              location: z.string().max(128).optional().or(z.literal("")),
              startDate: z.string().max(32).optional().or(z.literal("")),
              endDate: z.string().max(32).optional().or(z.literal("")),
              isCurrent: z.boolean().default(false),
              description: z.string().max(2000).optional().or(z.literal("")),
            }),
          )
          .max(30)
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(users)
        .set({
          name: input.name.trim(),
          phone: input.phone.trim(),
          linkedinUrl: input.linkedinUrl.trim(),
        })
        .where(eq(users.id, ctx.user.id));

      const parsedData = {
        headline: input.headline,
        summary: input.summary,
        skills: input.skills,
        education: input.education,
        experience: input.experience,
      };

      const existing = await db
        .select()
        .from(studentOnboarding)
        .where(eq(studentOnboarding.userId, ctx.user.id))
        .limit(1);

      const values = {
        currentStep: "done",
        status: "completed" as const,
        parsedData,
        completedAt: new Date(),
        startedAt: existing[0]?.startedAt ?? new Date(),
      };
      if (existing[0]) {
        await db
          .update(studentOnboarding)
          .set(values)
          .where(eq(studentOnboarding.id, existing[0].id));
      } else {
        await db.insert(studentOnboarding).values({ userId: ctx.user.id, ...values });
      }

      return { success: true };
    }),
});
