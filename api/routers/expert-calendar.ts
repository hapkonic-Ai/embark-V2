import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  expertAvailabilityExceptions,
  expertAvailabilityRules,
  expertBookings,
  mentorServices,
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
import { format } from "date-fns";

function generateBookingReference(): string {
  const rnd = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  const suffix = Date.now().toString().slice(-4);
  return `EMB-${format(new Date(), "yyyyMMdd")}-${rnd}-${suffix}`;
}

const expert = roleQuery("expert");

const DAY_OF_WEEK_ENUM = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM");

const ruleInputSchema = z.object({
  dayOfWeek: z.enum(DAY_OF_WEEK_ENUM),
  startTime: timeSchema,
  endTime: timeSchema,
  isActive: z.boolean().default(true),
});

const exceptionInputSchema = z.object({
  exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(["block", "override"]),
  startTime: timeSchema.optional().nullable(),
  endTime: timeSchema.optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

function assertOwnsException(userId: number, exceptionId: number) {
  return getDb()
    .select({ id: expertAvailabilityExceptions.id })
    .from(expertAvailabilityExceptions)
    .where(
      and(
        eq(expertAvailabilityExceptions.id, exceptionId),
        eq(expertAvailabilityExceptions.userId, userId),
      ),
    )
    .limit(1)
    .then((r) => {
      if (!r[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Exception not found.",
        });
      }
    });
}

export const expertCalendarRouter = createRouter({
  getRules: expert.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(expertAvailabilityRules)
      .where(eq(expertAvailabilityRules.userId, ctx.user.id))
      .orderBy(expertAvailabilityRules.dayOfWeek, expertAvailabilityRules.startTime);
  }),

  setRules: expert
    .input(z.array(ruleInputSchema))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (input.length > 50) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Too many rules. Max 50.",
        });
      }
      for (const rule of input) {
        const startMin =
          Number(rule.startTime.split(":")[0]) * 60 +
          Number(rule.startTime.split(":")[1]);
        const endMin =
          Number(rule.endTime.split(":")[0]) * 60 +
          Number(rule.endTime.split(":")[1]);
        if (endMin <= startMin) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `End time must be after start time on ${rule.dayOfWeek}.`,
          });
        }
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(expertAvailabilityRules)
          .where(eq(expertAvailabilityRules.userId, ctx.user.id));
        if (input.length > 0) {
          await tx.insert(expertAvailabilityRules).values(
            input.map((r) => ({
              userId: ctx.user.id,
              dayOfWeek: r.dayOfWeek,
              startTime: r.startTime,
              endTime: r.endTime,
              isActive: r.isActive,
            })),
          );
        }
      });

      return getDb()
        .select()
        .from(expertAvailabilityRules)
        .where(eq(expertAvailabilityRules.userId, ctx.user.id))
        .orderBy(expertAvailabilityRules.dayOfWeek, expertAvailabilityRules.startTime);
    }),

  listExceptions: expert.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(expertAvailabilityExceptions)
      .where(eq(expertAvailabilityExceptions.userId, ctx.user.id))
      .orderBy(desc(expertAvailabilityExceptions.exceptionDate));
  }),

  createException: expert
    .input(exceptionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (
        input.type === "override" &&
        (!input.startTime || !input.endTime)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Override exceptions require start and end times.",
        });
      }
      if (input.startTime && input.endTime) {
        if (input.endTime <= input.startTime) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "End time must be after start time.",
          });
        }
      }
      const tz = await getExpertTimezone(ctx.user.id);
      const [created] = await db
        .insert(expertAvailabilityExceptions)
        .values({
          userId: ctx.user.id,
          exceptionDate: input.exceptionDate,
          type: input.type,
          startTime: input.startTime || null,
          endTime: input.endTime || null,
          timezone: tz,
          reason: input.reason || null,
        })
        .$returningId();
      return db
        .select()
        .from(expertAvailabilityExceptions)
        .where(eq(expertAvailabilityExceptions.id, created.id))
        .limit(1)
        .then((r) => r[0]!);
    }),

  updateException: expert
    .input(
      z.object({
        id: z.number(),
        data: exceptionInputSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertOwnsException(ctx.user.id, input.id);
      await db
        .update(expertAvailabilityExceptions)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(expertAvailabilityExceptions.id, input.id));
      return db
        .select()
        .from(expertAvailabilityExceptions)
        .where(eq(expertAvailabilityExceptions.id, input.id))
        .limit(1)
        .then((r) => r[0]!);
    }),

  deleteException: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await assertOwnsException(ctx.user.id, input.id);
      await db
        .delete(expertAvailabilityExceptions)
        .where(eq(expertAvailabilityExceptions.id, input.id));
      return { success: true };
    }),

  listBookings: expert.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        booking: expertBookings,
        studentName: users.name,
        serviceTitle: mentorServices.title,
      })
      .from(expertBookings)
      .innerJoin(users, eq(users.id, expertBookings.studentId))
      .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
      .where(eq(expertBookings.userId, ctx.user.id))
      .orderBy(desc(expertBookings.startAt));
  }),

  updateBookingStatus: expert
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select({ userId: expertBookings.userId, status: expertBookings.status })
        .from(expertBookings)
        .where(eq(expertBookings.id, input.id))
        .limit(1)
        .then((r) => r[0]);
      if (!row || row.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found.",
        });
      }
      if (row.status === "cancelled" || row.status === "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking is already finalised.",
        });
      }
      await db
        .update(expertBookings)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(expertBookings.id, input.id));
      return db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, input.id))
        .limit(1)
        .then((r) => r[0]!);
    }),

  getMySlots: expert
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
        serviceId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = parseIsoDateTime(input.from);
      const to = parseIsoDateTime(input.to);
      if (!from || !to) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid date range.",
        });
      }
      const tz = await getExpertTimezone(ctx.user.id);
      let duration = 30;
      if (input.serviceId) {
        const svc = await getDb()
          .select({ durationMinutes: mentorServices.durationMinutes })
          .from(mentorServices)
          .where(
            and(
              eq(mentorServices.id, input.serviceId),
              eq(mentorServices.userId, ctx.user.id),
            ),
          )
          .limit(1)
          .then((r) => r[0]);
        if (svc?.durationMinutes) duration = svc.durationMinutes;
      }
      const slots = await computeAvailableSlots({
        userId: ctx.user.id,
        timezone: tz,
        durationMinutes: duration,
        from,
        to,
        minNoticeMinutes: 0,
      });
      return slots.map((s) => ({
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
      }));
    }),

  createBooking: authedQuery
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
        })
        .from(mentorServices)
        .where(eq(mentorServices.id, input.serviceId))
        .limit(1)
        .then((r) => r[0]);
      if (!service) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Service not found." });
      }
      if (service.status !== "published") {
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
      const startAt = parseIsoDateTime(input.startAt);
      const endAt = parseIsoDateTime(input.endAt);
      if (!startAt || !endAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid dates." });
      }
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
      const [created] = await db
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
          },
        })
        .$returningId();
      return db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, created.id))
        .limit(1)
        .then((r) => r[0]!);
    }),

  myBookings: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select({
        booking: expertBookings,
        expertName: users.name,
        serviceTitle: mentorServices.title,
      })
      .from(expertBookings)
      .innerJoin(users, eq(users.id, expertBookings.userId))
      .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
      .where(eq(expertBookings.studentId, ctx.user.id))
      .orderBy(desc(expertBookings.startAt));
  }),
});
