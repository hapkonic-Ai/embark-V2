import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { guestLectureRequests, mentorProfiles, users } from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";

const campus = roleQuery("campus");

export const campusRouter = createRouter({
  myRequests: campus.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        request: guestLectureRequests,
        mentorName: users.name,
        profile: mentorProfiles,
      })
      .from(guestLectureRequests)
      .innerJoin(mentorProfiles, eq(mentorProfiles.id, guestLectureRequests.mentorProfileId))
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .where(eq(guestLectureRequests.campusId, ctx.user.id))
      .orderBy(desc(guestLectureRequests.createdAt));
    return rows;
  }),

  createRequest: campus
    .input(
      z.object({
        mentorProfileId: z.number(),
        topic: z.string().min(1).max(255),
        proposedDate: z.string().datetime(),
        campusContact: z.string().min(1).max(255),
        campusNote: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const mentor = await db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.id, input.mentorProfileId))
        .limit(1);
      if (!mentor[0] || !mentor[0].isVerified) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mentor not found" });
      }
      const dup = await db
        .select({ id: guestLectureRequests.id })
        .from(guestLectureRequests)
        .where(
          and(
            eq(guestLectureRequests.campusId, ctx.user.id),
            eq(guestLectureRequests.mentorProfileId, input.mentorProfileId),
            eq(guestLectureRequests.status, "pending"),
          ),
        )
        .limit(1);
      if (dup.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending request for this mentor.",
        });
      }
      await db.insert(guestLectureRequests).values({
        campusId: ctx.user.id,
        mentorProfileId: input.mentorProfileId,
        topic: input.topic,
        proposedDate: new Date(input.proposedDate),
        campusContact: input.campusContact,
        campusNote: input.campusNote,
      });
      return { success: true };
    }),
});
