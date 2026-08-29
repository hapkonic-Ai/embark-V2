import {
  and,
  avg,
  count,
  desc,
  eq,
  like,
  max,
  min,
  or,
  sql,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  bookingStatusEnum,
  expertBookings,
  expertNotes,
  mentorServices,
  orders,
  payments,
  reviews,
  sessions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import { computeAvailableSlots, getExpertTimezone, parseIsoDateTime } from "../lib/calendar";
import { getWhatsAppAccessForBooking } from "../lib/whatsapp-access";

const expert = roleQuery("expert");

const BookingStatusSchema = z.enum(bookingStatusEnum);

function parseDateTime(value: string): Date {
  const d = parseIsoDateTime(value);
  if (!d) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid date/time." });
  }
  return d;
}

function assertExpertBooking(booking: { userId: number }, expertUserId: number) {
  if (booking.userId !== expertUserId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
  }
}

export const expertOperationsRouter = createRouter({
  listBookings: expert
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        status: BookingStatusSchema.optional(),
        serviceId: z.number().optional(),
        query: z.string().max(255).optional(),
        customerId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(expertBookings.userId, ctx.user.id)];
      if (input.status) conditions.push(eq(expertBookings.status, input.status));
      if (input.serviceId) conditions.push(eq(expertBookings.serviceId, input.serviceId));
      if (input.customerId) conditions.push(eq(expertBookings.studentId, input.customerId));
      if (input.query) {
        const q = `%${input.query}%`;
        conditions.push(
          or(
            like(users.name, q),
            like(users.email, q),
            like(expertBookings.bookingReference, q),
            like(mentorServices.title, q),
          )!,
        );
      }

      const where = and(...conditions)!;

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            booking: expertBookings,
            studentName: users.name,
            serviceTitle: mentorServices.title,
          })
          .from(expertBookings)
          .innerJoin(users, eq(users.id, expertBookings.studentId))
          .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
          .where(where)
          .orderBy(desc(expertBookings.startAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(expertBookings)
          .innerJoin(users, eq(users.id, expertBookings.studentId))
          .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
          .where(where)
          .then((r) => r[0]),
      ]);

      return {
        bookings: rows,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      };
    }),

  getBooking: expert
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({
          booking: expertBookings,
          session: sessions,
          order: orders,
          service: mentorServices,
          student: {
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          },
        })
        .from(expertBookings)
        .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
        .innerJoin(users, eq(users.id, expertBookings.studentId))
        .leftJoin(sessions, eq(sessions.bookingId, expertBookings.id))
        .leftJoin(orders, eq(orders.id, expertBookings.orderId))
        .where(eq(expertBookings.id, input.id))
        .limit(1)
        .then((r) => r[0]);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }
      assertExpertBooking(row.booking, ctx.user.id);

      const whatsappAccess = getWhatsAppAccessForBooking(
        row.booking,
        row.order ?? undefined,
        row.service,
      );

      return { ...row, whatsappAccess };
    }),

  listCustomers: expert
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(200).default(20),
        query: z.string().max(255).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(expertBookings.userId, ctx.user.id)];
      if (input.query) {
        const q = `%${input.query}%`;
        conditions.push(
          or(like(users.name, q), like(users.email, q), like(users.phone, q))!,
        );
      }

      const where = and(...conditions)!;

      const base = db
        .select({
          studentId: expertBookings.studentId,
          name: users.name,
          email: users.email,
          phone: users.phone,
          bookingCount: count(expertBookings.id),
          firstBookingAt: min(expertBookings.createdAt),
          lastBookingAt: max(expertBookings.createdAt),
          totalSpent:
            sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} = 'paid' THEN ${orders.amount} ELSE 0 END), 0)`,
        })
        .from(expertBookings)
        .innerJoin(users, eq(users.id, expertBookings.studentId))
        .leftJoin(orders, eq(orders.bookingId, expertBookings.id))
        .where(where)
        .groupBy(expertBookings.studentId, users.name, users.email, users.phone);

      const [rows, totalRow] = await Promise.all([
        base.orderBy(desc(max(expertBookings.createdAt))).limit(pageSize).offset(offset),
        db
          .select({
            count: sql<number>`count(distinct ${expertBookings.studentId})`,
          })
          .from(expertBookings)
          .innerJoin(users, eq(users.id, expertBookings.studentId))
          .where(where)
          .then((r) => r[0]),
      ]);

      return {
        customers: rows,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      };
    }),

  getCustomer: expert
    .input(z.object({ studentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const relationship = await db
        .select({ id: expertBookings.id })
        .from(expertBookings)
        .where(
          and(
            eq(expertBookings.userId, ctx.user.id),
            eq(expertBookings.studentId, input.studentId),
          ),
        )
        .limit(1)
        .then((r) => r[0]);
      if (!relationship) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No relationship with this customer." });
      }

      const student = await db
        .select()
        .from(users)
        .where(eq(users.id, input.studentId))
        .limit(1)
        .then((r) => r[0]);
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student not found." });
      }

      const serviceRows = await db
        .select({
          id: mentorServices.id,
          title: mentorServices.title,
          slug: mentorServices.slug,
          serviceType: mentorServices.serviceType,
          price: mentorServices.price,
          currency: mentorServices.currency,
          status: mentorServices.status,
        })
        .from(mentorServices)
        .innerJoin(expertBookings, eq(expertBookings.serviceId, mentorServices.id))
        .where(
          and(
            eq(expertBookings.userId, ctx.user.id),
            eq(expertBookings.studentId, input.studentId),
          ),
        )
        .groupBy(
          mentorServices.id,
          mentorServices.title,
          mentorServices.slug,
          mentorServices.serviceType,
          mentorServices.price,
          mentorServices.currency,
          mentorServices.status,
        )
        .orderBy(desc(mentorServices.updatedAt));

      const bookingRows = await db
        .select({
          booking: expertBookings,
          session: sessions,
          order: orders,
          service: {
            title: mentorServices.title,
            slug: mentorServices.slug,
          },
        })
        .from(expertBookings)
        .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
        .leftJoin(sessions, eq(sessions.bookingId, expertBookings.id))
        .leftJoin(orders, eq(orders.id, expertBookings.orderId))
        .where(
          and(
            eq(expertBookings.userId, ctx.user.id),
            eq(expertBookings.studentId, input.studentId),
          ),
        )
        .orderBy(desc(expertBookings.startAt));

      const noteRows = await db
        .select()
        .from(expertNotes)
        .where(
          and(
            eq(expertNotes.userId, ctx.user.id),
            eq(expertNotes.studentId, input.studentId),
          ),
        )
        .orderBy(desc(expertNotes.createdAt));

      const reviewRows = await db
        .select({
          review: reviews,
          serviceTitle: mentorServices.title,
        })
        .from(reviews)
        .innerJoin(mentorServices, eq(mentorServices.id, reviews.serviceId))
        .where(
          and(
            eq(reviews.expertUserId, ctx.user.id),
            eq(reviews.studentId, input.studentId),
          ),
        )
        .orderBy(desc(reviews.createdAt));

      const paymentRows = await db
        .select({
          payment: payments,
          orderStatus: orders.status,
          bookingReference: expertBookings.bookingReference,
        })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .innerJoin(expertBookings, eq(expertBookings.orderId, orders.id))
        .where(
          and(
            eq(expertBookings.userId, ctx.user.id),
            eq(expertBookings.studentId, input.studentId),
          ),
        )
        .orderBy(desc(payments.createdAt));

      return {
        student,
        services: serviceRows,
        bookings: bookingRows,
        notes: noteRows,
        reviews: reviewRows,
        payments: paymentRows,
      };
    }),

  listNotes: expert
    .input(
      z.object({
        studentId: z.number().optional(),
        bookingId: z.number().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(expertNotes.userId, ctx.user.id)];
      if (input.studentId) conditions.push(eq(expertNotes.studentId, input.studentId));
      if (input.bookingId) conditions.push(eq(expertNotes.bookingId, input.bookingId));
      const where = and(...conditions)!;

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            note: expertNotes,
            studentName: users.name,
          })
          .from(expertNotes)
          .leftJoin(users, eq(users.id, expertNotes.studentId))
          .where(where)
          .orderBy(desc(expertNotes.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: count() })
          .from(expertNotes)
          .where(where)
          .then((r) => r[0]),
      ]);

      return {
        notes: rows,
        total: Number(totalRow?.count ?? 0),
        page,
        pageSize,
      };
    }),

  getNote: expert
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select()
        .from(expertNotes)
        .where(and(eq(expertNotes.id, input.id), eq(expertNotes.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
      }
      return row;
    }),

  listReviews: expert
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        serviceId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const page = input.page;
      const pageSize = input.pageSize;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(reviews.expertUserId, ctx.user.id)];
      if (input.serviceId) conditions.push(eq(reviews.serviceId, input.serviceId));
      const where = and(...conditions)!;

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

  reviewSummary: expert.query(async ({ ctx }) => {
    const db = getDb();
    const row = await db
      .select({
        averageRating: avg(reviews.rating),
        reviewCount: count(),
      })
      .from(reviews)
      .where(eq(reviews.expertUserId, ctx.user.id))
      .then((r) => r[0]);

    return {
      averageRating: row?.averageRating ? Number(row.averageRating) : 0,
      reviewCount: Number(row?.reviewCount ?? 0),
    };
  }),

  rescheduleBooking: expert
    .input(
      z.object({
        bookingId: z.number(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({
          booking: expertBookings,
          service: mentorServices,
        })
        .from(expertBookings)
        .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
        .where(eq(expertBookings.id, input.bookingId))
        .limit(1)
        .then((r) => r[0]);

      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }
      assertExpertBooking(row.booking, ctx.user.id);

      if (row.booking.status !== "confirmed" && row.booking.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking cannot be rescheduled.",
        });
      }

      const startAt = parseDateTime(input.startAt);
      const endAt = parseDateTime(input.endAt);
      const durationMinutes = (endAt.getTime() - startAt.getTime()) / 60_000;
      if (
        !row.service.durationMinutes ||
        Math.abs(durationMinutes - row.service.durationMinutes) > 0.1
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slot duration does not match service duration.",
        });
      }

      const tz = await getExpertTimezone(ctx.user.id);
      const available = await computeAvailableSlots({
        userId: ctx.user.id,
        timezone: tz,
        durationMinutes: row.service.durationMinutes,
        from: startAt,
        to: endAt,
        excludeBookingId: row.booking.id,
      });
      const exact = available.find(
        (s) =>
          s.startAt.getTime() === startAt.getTime() &&
          s.endAt.getTime() === endAt.getTime(),
      );
      if (!exact) {
        throw new TRPCError({ code: "CONFLICT", message: "Slot is no longer available." });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(expertBookings)
          .set({ startAt, endAt, updatedAt: new Date() })
          .where(eq(expertBookings.id, row.booking.id));
        await tx
          .update(sessions)
          .set({ startAt, endAt, updatedAt: new Date() })
          .where(eq(sessions.bookingId, row.booking.id));
      });

      const updated = await db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, row.booking.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, booking: updated };
    }),

  cancelBooking: expert
    .input(
      z.object({
        bookingId: z.number(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const booking = await db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, input.bookingId))
        .limit(1)
        .then((r) => r[0]);

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }
      assertExpertBooking(booking, ctx.user.id);

      if (
        booking.status === "cancelled" ||
        booking.status === "completed" ||
        booking.status === "no_show"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking cannot be cancelled.",
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(expertBookings)
          .set({
            status: "cancelled",
            cancellationReason: input.reason ?? null,
            updatedAt: new Date(),
          })
          .where(eq(expertBookings.id, booking.id));
        await tx
          .update(sessions)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(eq(sessions.bookingId, booking.id));
        if (booking.orderId) {
          await tx
            .update(orders)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(orders.id, booking.orderId));
        }
      });

      return { success: true };
    }),

  completeBooking: expert
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const booking = await db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, input.bookingId))
        .limit(1)
        .then((r) => r[0]);

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }
      assertExpertBooking(booking, ctx.user.id);

      if (booking.status !== "confirmed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only confirmed bookings can be completed.",
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(expertBookings)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(expertBookings.id, booking.id));
        await tx
          .update(sessions)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(sessions.bookingId, booking.id));
      });

      return { success: true };
    }),

  createNote: expert
    .input(
      z.object({
        studentId: z.number(),
        bookingId: z.number().optional(),
        content: z.string().max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (input.bookingId) {
        const booking = await db
          .select({ userId: expertBookings.userId, studentId: expertBookings.studentId })
          .from(expertBookings)
          .where(eq(expertBookings.id, input.bookingId))
          .limit(1)
          .then((r) => r[0]);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
        }
        assertExpertBooking(booking, ctx.user.id);
        if (booking.studentId !== input.studentId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Booking does not belong to this student.",
          });
        }
      }

      const [created] = await db
        .insert(expertNotes)
        .values({
          userId: ctx.user.id,
          studentId: input.studentId,
          bookingId: input.bookingId ?? null,
          content: input.content,
        })
        .$returningId();

      const note = await db
        .select()
        .from(expertNotes)
        .where(eq(expertNotes.id, created.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, note };
    }),

  updateNote: expert
    .input(
      z.object({
        id: z.number(),
        content: z.string().max(4000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const note = await db
        .select()
        .from(expertNotes)
        .where(and(eq(expertNotes.id, input.id), eq(expertNotes.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);
      if (!note) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
      }

      await db
        .update(expertNotes)
        .set({ content: input.content, updatedAt: new Date() })
        .where(eq(expertNotes.id, input.id));

      const updated = await db
        .select()
        .from(expertNotes)
        .where(eq(expertNotes.id, input.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, note: updated };
    }),

  deleteNote: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const note = await db
        .select()
        .from(expertNotes)
        .where(and(eq(expertNotes.id, input.id), eq(expertNotes.userId, ctx.user.id)))
        .limit(1)
        .then((r) => r[0]);
      if (!note) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Note not found." });
      }

      await db.delete(expertNotes).where(eq(expertNotes.id, input.id));
      return { success: true };
    }),
});
