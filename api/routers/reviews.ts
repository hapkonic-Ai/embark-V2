import { and, avg, count, desc, eq, isNull, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { expertBookings, mentorServices, reviews, sessions, users } from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter, publicQuery } from "../middleware";
import { roleQuery } from "../rbac";

const candidate = roleQuery("candidate");

export const reviewsRouter = createRouter({
  create: candidate
    .input(
      z.object({
        bookingId: z.number(),
        rating: z.number().int().min(1).max(5),
        title: z.string().max(255).optional().or(z.literal("")),
        content: z.string().max(4000).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({
          booking: expertBookings,
          session: sessions,
        })
        .from(expertBookings)
        .leftJoin(sessions, eq(sessions.bookingId, expertBookings.id))
        .where(eq(expertBookings.id, input.bookingId))
        .limit(1)
        .then((r) => r[0]);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }
      if (row.booking.studentId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }
      if (row.booking.status !== "completed" && row.session?.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking must be completed to leave a review.",
        });
      }

      const existing = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.bookingId, input.bookingId))
        .limit(1)
        .then((r) => r[0]);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Review already exists for this booking.",
        });
      }

      const [created] = await db
        .insert(reviews)
        .values({
          bookingId: input.bookingId,
          studentId: ctx.user.id,
          expertUserId: row.booking.userId,
          serviceId: row.booking.serviceId,
          rating: input.rating,
          title: input.title || null,
          content: input.content || null,
          status: "approved",
        })
        .$returningId();

      return { success: true, reviewId: created.id };
    }),

  listForExpert: publicQuery
    .input(
      z.object({
        expertUserId: z.number(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const where = and(
        eq(reviews.expertUserId, input.expertUserId),
        eq(reviews.status, "approved"),
        eq(reviews.isPublic, true),
      )!;

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            review: reviews,
            studentName: users.name,
            serviceTitle: mentorServices.title,
          })
          .from(reviews)
          .innerJoin(users, eq(users.id, reviews.studentId))
          .innerJoin(mentorServices, eq(mentorServices.id, reviews.serviceId))
          .where(where)
          .orderBy(desc(reviews.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(reviews)
          .where(where)
          .then((r) => r[0]),
      ]);

      return {
        reviews: rows,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      };
    }),

  listForService: publicQuery
    .input(
      z.object({
        serviceId: z.number(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const where = and(
        eq(reviews.serviceId, input.serviceId),
        eq(reviews.status, "approved"),
        eq(reviews.isPublic, true),
      )!;

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            review: reviews,
            studentName: users.name,
            serviceTitle: mentorServices.title,
          })
          .from(reviews)
          .innerJoin(users, eq(users.id, reviews.studentId))
          .innerJoin(mentorServices, eq(mentorServices.id, reviews.serviceId))
          .where(where)
          .orderBy(desc(reviews.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(reviews)
          .where(where)
          .then((r) => r[0]),
      ]);

      return {
        reviews: rows,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      };
    }),

  summaryForExpert: publicQuery
    .input(z.object({ expertUserId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const row = await db
        .select({
          averageRating: avg(reviews.rating),
          reviewCount: count(),
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.expertUserId, input.expertUserId),
            eq(reviews.status, "approved"),
            eq(reviews.isPublic, true),
          )!,
        )
        .then((r) => r[0]);

      return {
        averageRating: row?.averageRating ? Number(row.averageRating) : 0,
        reviewCount: Number(row?.reviewCount ?? 0),
      };
    }),

  canReview: candidate
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({
          booking: expertBookings,
          session: sessions,
          reviewId: reviews.id,
        })
        .from(expertBookings)
        .leftJoin(sessions, eq(sessions.bookingId, expertBookings.id))
        .leftJoin(reviews, eq(reviews.bookingId, expertBookings.id))
        .where(eq(expertBookings.id, input.bookingId))
        .limit(1)
        .then((r) => r[0]);

      if (!row) return false;
      if (row.booking.studentId !== ctx.user.id) return false;
      if (row.booking.status !== "completed" && row.session?.status !== "completed")
        return false;
      if (row.reviewId) return false;

      return true;
    }),

  pendingForExpert: candidate
    .input(z.object({ expertUserId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({ bookingId: expertBookings.id })
        .from(expertBookings)
        .leftJoin(sessions, eq(sessions.bookingId, expertBookings.id))
        .leftJoin(reviews, eq(reviews.bookingId, expertBookings.id))
        .where(
          and(
            eq(expertBookings.studentId, ctx.user.id),
            eq(expertBookings.userId, input.expertUserId),
            or(eq(expertBookings.status, "completed"), eq(sessions.status, "completed")),
            isNull(reviews.id),
          ),
        )
        .orderBy(desc(expertBookings.startAt))
        .limit(1)
        .then((r) => r[0]);

      return row ?? null;
    }),
});
