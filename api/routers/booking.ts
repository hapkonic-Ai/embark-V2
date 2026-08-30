import { and, desc, eq } from "drizzle-orm";
import type { MySql2Database, MySql2Transaction } from "drizzle-orm/mysql2";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { z } from "zod";
import {
  expertBookings,
  mentorServices,
  orders,
  payments,
  sessions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { authedQuery, createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import {
  computeAvailableSlots,
  getExpertTimezone,
  parseIsoDateTime,
} from "../lib/calendar";

const candidate = roleQuery("candidate");
const expert = roleQuery("expert");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = MySql2Database<any> | MySql2Transaction<any, any>;

function generateBookingReference(): string {
  const rnd = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  const suffix = Date.now().toString().slice(-4);
  return `EMB-${format(new Date(), "yyyyMMdd")}-${rnd}-${suffix}`;
}

function parseDateTime(value: string): Date {
  const d = parseIsoDateTime(value);
  if (!d) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid date/time." });
  }
  return d;
}

async function fetchBookingWithOwnership(
  db: ReturnType<typeof getDb>,
  bookingId: number,
  userId: number,
) {
  const row = await db
    .select({
      booking: expertBookings,
      expertName: users.name,
      serviceTitle: mentorServices.title,
    })
    .from(expertBookings)
    .innerJoin(users, eq(users.id, expertBookings.userId))
    .innerJoin(
      mentorServices,
      eq(mentorServices.id, expertBookings.serviceId),
    )
    .where(eq(expertBookings.id, bookingId))
    .limit(1)
    .then((r) => r[0]);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  }
  if (
    row.booking.studentId !== userId &&
    row.booking.userId !== userId
  ) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
  }
  return row;
}

async function createSessionForBooking(
  db: DbClient,
  booking: { id: number; startAt: Date; endAt: Date },
) {
  const existing = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.bookingId, booking.id))
    .limit(1)
    .then((r: { id: number }[]) => r[0]);
  if (existing) return;
  await db.insert(sessions).values({
    bookingId: booking.id,
    startAt: booking.startAt,
    endAt: booking.endAt,
    status: "scheduled",
  });
}

export const bookingRouter = createRouter({
  create: candidate
    .input(
      z.object({
        serviceId: z.number(),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
        intakeResponses: z.record(z.string(), z.string()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const service = await db
        .select({
          id: mentorServices.id,
          userId: mentorServices.userId,
          title: mentorServices.title,
          price: mentorServices.price,
          currency: mentorServices.currency,
          durationMinutes: mentorServices.durationMinutes,
          status: mentorServices.status,
          isBookable: mentorServices.isBookable,
          requiresPayment: mentorServices.requiresPayment,
          communicationMode: mentorServices.communicationMode,
          whatsappDirectNumber: mentorServices.whatsappDirectNumber,
          whatsappGroupInviteUrl: mentorServices.whatsappGroupInviteUrl,
          whatsappGroupAccessPolicy: mentorServices.whatsappGroupAccessPolicy,
        })
        .from(mentorServices)
        .where(eq(mentorServices.id, input.serviceId))
        .limit(1)
        .then((r) => r[0]);

      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Service not found." });
      }
      if (service.status !== "published" || !service.isBookable) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service is not available for booking.",
        });
      }
      if (service.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot book your own service.",
        });
      }

      const startAt = parseDateTime(input.startAt);
      const endAt = parseDateTime(input.endAt);
      const durationMinutes = (endAt.getTime() - startAt.getTime()) / 60_000;
      if (
        !service.durationMinutes ||
        Math.abs(durationMinutes - service.durationMinutes) > 0.1
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Slot duration does not match service duration.",
        });
      }

      const tz = await getExpertTimezone(service.userId);
      const available = await computeAvailableSlots({
        userId: service.userId,
        timezone: tz,
        durationMinutes: service.durationMinutes,
        from: startAt,
        to: endAt,
      });
      const exact = available.find(
        (s) =>
          s.startAt.getTime() === startAt.getTime() &&
          s.endAt.getTime() === endAt.getTime(),
      );
      if (!exact) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That slot is no longer available.",
        });
      }

      return await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(expertBookings)
          .values({
            userId: service.userId,
            studentId: ctx.user.id,
            serviceId: service.id,
            bookingReference: generateBookingReference(),
            timezone: tz,
            startAt,
            endAt,
            status: "pending",
            intakeResponses: input.intakeResponses,
            serviceSnapshot: {
              title: service.title,
              durationMinutes: service.durationMinutes,
              price: service.price,
              currency: service.currency,
              communicationMode: service.communicationMode,
              whatsappDirectNumber: service.whatsappDirectNumber,
              whatsappGroupInviteUrl: service.whatsappGroupInviteUrl,
              whatsappGroupAccessPolicy: service.whatsappGroupAccessPolicy,
            },
          })
          .$returningId();

        const booking = await tx
          .select()
          .from(expertBookings)
          .where(eq(expertBookings.id, created.id))
          .limit(1)
          .then((r) => r[0]!);

        if (service.requiresPayment) {
          const [order] = await tx
            .insert(orders)
            .values({
              bookingId: booking.id,
              studentId: ctx.user.id,
              amount: service.price,
              currency: service.currency,
              status: "pending",
              snapshot: {
                title: service.title,
                price: service.price,
                currency: service.currency,
                durationMinutes: service.durationMinutes,
              },
            })
            .$returningId();
          await tx
            .update(expertBookings)
            .set({ orderId: order.id, updatedAt: new Date() })
            .where(eq(expertBookings.id, booking.id));
        } else {
          await tx
            .update(expertBookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(expertBookings.id, booking.id));
          await createSessionForBooking(tx, booking);
        }

        return tx
          .select()
          .from(expertBookings)
          .where(eq(expertBookings.id, booking.id))
          .limit(1)
          .then((r) => r[0]!);
      });
    }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const { booking, expertName, serviceTitle } = await fetchBookingWithOwnership(
        db,
        input.id,
        ctx.user.id,
      );
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.bookingId, booking.id))
        .limit(1)
        .then((r) => r[0] ?? null);
      const order = booking.orderId
        ? await db
            .select()
            .from(orders)
            .where(eq(orders.id, booking.orderId))
            .limit(1)
            .then((r) => r[0] ?? null)
        : null;
      const payment = order
        ? await db
            .select()
            .from(payments)
            .where(and(eq(payments.orderId, order.id), eq(payments.status, "success")))
            .limit(1)
            .then((r) => r[0] ?? null)
        : null;
      return { booking, session, order, payment, expertName, serviceTitle };
    }),

  listForStudent: candidate.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        booking: expertBookings,
        expertName: users.name,
        serviceTitle: mentorServices.title,
      })
      .from(expertBookings)
      .innerJoin(users, eq(users.id, expertBookings.userId))
      .innerJoin(
        mentorServices,
        eq(mentorServices.id, expertBookings.serviceId),
      )
      .where(eq(expertBookings.studentId, ctx.user.id))
      .orderBy(desc(expertBookings.startAt));
  }),

  listForExpert: expert.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        booking: expertBookings,
        studentName: users.name,
        serviceTitle: mentorServices.title,
      })
      .from(expertBookings)
      .innerJoin(users, eq(users.id, expertBookings.studentId))
      .innerJoin(
        mentorServices,
        eq(mentorServices.id, expertBookings.serviceId),
      )
      .where(eq(expertBookings.userId, ctx.user.id))
      .orderBy(desc(expertBookings.startAt));
  }),

  cancel: authedQuery
    .input(
      z.object({
        bookingId: z.number(),
        reason: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );

      const canCancel =
        ctx.user.id === booking.studentId ||
        ctx.user.id === booking.userId;
      if (!canCancel) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot cancel this booking." });
      }
      if (booking.status === "cancelled" || booking.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is already finalised.",
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

        const session = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(eq(sessions.bookingId, booking.id))
          .limit(1)
          .then((r) => r[0]);
        if (session) {
          await tx
            .update(sessions)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(sessions.id, session.id));
        }

        if (booking.orderId) {
          await tx
            .update(orders)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(orders.id, booking.orderId));
        }
      });

      return { success: true };
    }),

  confirm: expert
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }
      if (booking.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is not pending.",
        });
      }

      const service = await db
        .select({ durationMinutes: mentorServices.durationMinutes, userId: mentorServices.userId })
        .from(mentorServices)
        .where(eq(mentorServices.id, booking.serviceId))
        .limit(1)
        .then((r) => r[0]);
      if (!service?.durationMinutes) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Service not found." });
      }

      const tz = await getExpertTimezone(booking.userId);
      const available = await computeAvailableSlots({
        userId: booking.userId,
        timezone: tz,
        durationMinutes: service.durationMinutes,
        from: booking.startAt,
        to: booking.endAt,
        excludeBookingId: booking.id,
      });
      const exact = available.find(
        (s) =>
          s.startAt.getTime() === booking.startAt.getTime() &&
          s.endAt.getTime() === booking.endAt.getTime(),
      );
      if (!exact) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This slot is no longer available.",
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(expertBookings)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(expertBookings.id, booking.id));
        await createSessionForBooking(tx, booking);
      });

      return { success: true };
    }),

  complete: expert
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }
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

  markNoShow: expert
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }
      if (booking.status !== "confirmed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only confirmed bookings can be marked no-show.",
        });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(expertBookings)
          .set({ status: "no_show", updatedAt: new Date() })
          .where(eq(expertBookings.id, booking.id));
        await tx
          .update(sessions)
          .set({ status: "no_show", updatedAt: new Date() })
          .where(eq(sessions.bookingId, booking.id));
      });

      return { success: true };
    }),

  setSessionMeetingUrl: expert
    .input(
      z.object({
        bookingId: z.number(),
        meetingUrl: z.string().url().max(512),
        meetingProvider: z.string().max(32).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }

      const existing = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.bookingId, booking.id))
        .limit(1)
        .then((r) => r[0]);

      if (existing) {
        await db
          .update(sessions)
          .set({
            meetingUrl: input.meetingUrl,
            meetingProvider: input.meetingProvider ?? null,
            updatedAt: new Date(),
          })
          .where(eq(sessions.id, existing.id));
      } else {
        await db.insert(sessions).values({
          bookingId: booking.id,
          startAt: booking.startAt,
          endAt: booking.endAt,
          status: "scheduled",
          meetingUrl: input.meetingUrl,
          meetingProvider: input.meetingProvider ?? null,
        });
      }

      return { success: true };
    }),

  addSessionNotes: expert
    .input(
      z.object({
        bookingId: z.number(),
        notes: z.string().max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { booking } = await fetchBookingWithOwnership(
        db,
        input.bookingId,
        ctx.user.id,
      );
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your booking." });
      }
      await db
        .update(sessions)
        .set({ notes: input.notes, updatedAt: new Date() })
        .where(eq(sessions.bookingId, booking.id));
      return { success: true };
    }),
});
