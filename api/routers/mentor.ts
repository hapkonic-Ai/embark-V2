import { and, count, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { guestLectureRequests, mentorProfiles, mentorships, mockSessions, reviews, users } from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";

const mentor = roleQuery("mentor");

async function getMyProfile(userId: number) {
  const rows = await getDb()
    .select()
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export const mentorRouter = createRouter({
  myProfile: mentor.query(async ({ ctx }) => getMyProfile(ctx.user.id)),

  upsertProfile: mentor
    .input(
      z.object({
        headline: z.string().max(255).optional(),
        bschool: z.string().max(255).optional(),
        company: z.string().max(255).optional(),
        expertise: z.string().max(512).optional(),
        yearsExp: z.number().int().min(0).max(50).optional(),
        bio: z.string().max(4000).optional(),
        whatsapp: z.string().max(32).optional(),
        linkedinUrl: z.string().regex(/^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/, "Enter a valid LinkedIn URL").optional().or(z.literal("")),
        price: z.number().int().min(499).max(200000).optional(),
        mockGds: z.number().int().min(0).max(30).optional(),
        mockPis: z.number().int().min(0).max(30).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await getMyProfile(ctx.user.id);
      if (existing) {
        await db
          .update(mentorProfiles)
          .set(input)
          .where(eq(mentorProfiles.id, existing.id));
      } else {
        await db.insert(mentorProfiles).values({ userId: ctx.user.id, ...input });
      }
      return { success: true };
    }),

  myMentees: mentor
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(10),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 10;
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) return { rows: [], total: 0, page, pageSize };
      const offset = (page - 1) * pageSize;
      const [totalRow, rows] = await Promise.all([
        db
          .select({ count: count() })
          .from(mentorships)
          .where(eq(mentorships.mentorProfileId, profile.id)),
        db
          .select({
            mentorship: mentorships,
            candidateName: users.name,
            candidateEmail: users.email,
            candidatePhone: users.phone,
          })
          .from(mentorships)
          .innerJoin(users, eq(users.id, mentorships.candidateId))
          .where(eq(mentorships.mentorProfileId, profile.id))
          .orderBy(desc(mentorships.createdAt))
          .limit(pageSize)
          .offset(offset),
      ]);
      const withSessions = await Promise.all(
        rows.map(async (r) => {
          const [sessions, review] = await Promise.all([
            db
              .select()
              .from(mockSessions)
              .where(eq(mockSessions.mentorshipId, r.mentorship.id))
              .orderBy(desc(mockSessions.createdAt)),
            db
              .select()
              .from(reviews)
              .where(eq(reviews.mentorshipId, r.mentorship.id))
              .limit(1)
              .then((x) => x[0] ?? null),
          ]);
          return { ...r, sessions, review };
        }),
      );
      return { rows: withSessions, total: Number(totalRow[0]?.count ?? 0), page, pageSize };
    }),

  scheduleSession: mentor
    .input(
      z.object({
        sessionId: z.number(),
        scheduledNote: z.string().min(2).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const rows = await db
        .select({ session: mockSessions, mentorship: mentorships })
        .from(mockSessions)
        .innerJoin(mentorships, eq(mentorships.id, mockSessions.mentorshipId))
        .where(eq(mockSessions.id, input.sessionId))
        .limit(1);
      const row = rows[0];
      if (!row || row.mentorship.mentorProfileId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      await db
        .update(mockSessions)
        .set({ status: "scheduled", scheduledNote: input.scheduledNote })
        .where(eq(mockSessions.id, input.sessionId));
      return { success: true };
    }),

  completeSession: mentor
    .input(
      z.object({
        sessionId: z.number(),
        score: z.number().int().min(1).max(10),
        feedback: z.string().min(2).max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const rows = await db
        .select({ session: mockSessions, mentorship: mentorships })
        .from(mockSessions)
        .innerJoin(mentorships, eq(mentorships.id, mockSessions.mentorshipId))
        .where(eq(mockSessions.id, input.sessionId))
        .limit(1);
      const row = rows[0];
      if (!row || row.mentorship.mentorProfileId !== profile.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
      }
      if (row.session.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Session already completed",
        });
      }
      await db
        .update(mockSessions)
        .set({
          status: "completed",
          score: input.score,
          feedback: input.feedback,
        })
        .where(eq(mockSessions.id, input.sessionId));
      const field = row.session.type === "gd" ? "gdUsed" : "piUsed";
      const newUsed =
        row.session.type === "gd"
          ? row.mentorship.gdUsed + 1
          : row.mentorship.piUsed + 1;
      const completed =
        (row.session.type === "gd" ? newUsed : row.mentorship.gdUsed) ===
          row.mentorship.gdTotal &&
        (row.session.type === "pi" ? newUsed : row.mentorship.piUsed) ===
          row.mentorship.piTotal;
      await db
        .update(mentorships)
        .set({
          [field]: newUsed,
          status: completed ? "completed" : row.mentorship.status,
        })
        .where(eq(mentorships.id, row.mentorship.id));
      return { success: true, mentorshipCompleted: completed };
    }),

  toggleMentorship: mentor
    .input(
      z.object({
        mentorshipId: z.number(),
        status: z.enum(["active", "completed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      await db
        .update(mentorships)
        .set({ status: input.status })
        .where(
          and(
            eq(mentorships.id, input.mentorshipId),
            eq(mentorships.mentorProfileId, profile.id),
          ),
        );
      return { success: true };
    }),

  myGuestRequests: mentor.query(async ({ ctx }) => {
    const db = getDb();
    const profile = await getMyProfile(ctx.user.id);
    if (!profile) return [];
    const rows = await db
      .select({
        request: guestLectureRequests,
        campusName: users.name,
        campusEmail: users.email,
        campusPhone: users.phone,
      })
      .from(guestLectureRequests)
      .innerJoin(users, eq(users.id, guestLectureRequests.campusId))
      .where(eq(guestLectureRequests.mentorProfileId, profile.id))
      .orderBy(desc(guestLectureRequests.createdAt));
    return rows;
  }),

  respondToGuestRequest: mentor
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["accepted", "rejected"]),
        confirmedDate: z.string().datetime().optional(),
        mentorContact: z.string().max(255).optional(),
        mentorNote: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
      const row = await db
        .select()
        .from(guestLectureRequests)
        .where(
          and(
            eq(guestLectureRequests.id, input.requestId),
            eq(guestLectureRequests.mentorProfileId, profile.id),
          ),
        )
        .limit(1);
      const req = row[0];
      if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (req.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request already responded to" });
      }
      await db
        .update(guestLectureRequests)
        .set({
          status: input.status,
          confirmedDate: input.confirmedDate ? new Date(input.confirmedDate) : req.proposedDate,
          mentorContact: input.mentorContact,
          mentorNote: input.mentorNote,
        })
        .where(eq(guestLectureRequests.id, input.requestId));
      return { success: true };
    }),
});
