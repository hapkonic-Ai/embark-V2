import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  expertBookings,
  mentorServices,
  orders,
  payments,
  sessions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";

const candidate = roleQuery("candidate");

export const paymentsRouter = createRouter({
  myOrders: candidate.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        order: orders,
        booking: expertBookings,
        expertName: users.name,
        serviceTitle: mentorServices.title,
      })
      .from(orders)
      .innerJoin(expertBookings, eq(expertBookings.id, orders.bookingId))
      .innerJoin(users, eq(users.id, expertBookings.userId))
      .innerJoin(mentorServices, eq(mentorServices.id, expertBookings.serviceId))
      .where(eq(orders.studentId, ctx.user.id))
      .orderBy(desc(orders.createdAt));

    const orderIds = rows.map((r) => r.order.id);
    const paymentRows = orderIds.length
      ? await db
          .select()
          .from(payments)
          .where(and(eq(payments.status, "success"), ...orderIds.map((id) => eq(payments.orderId, id))))
      : [];

    return rows.map((r) => ({
      ...r,
      payment: paymentRows.find((p) => p.orderId === r.order.id) ?? null,
    }));
  }),

  simulatePay: candidate
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const order = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1)
        .then((r) => r[0]);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found." });
      }
      if (order.studentId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your order." });
      }
      if (order.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Order is already ${order.status}.`,
        });
      }

      const booking = await db
        .select()
        .from(expertBookings)
        .where(eq(expertBookings.id, order.bookingId))
        .limit(1)
        .then((r) => r[0]);
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(orders.id, order.id));
        await tx
          .update(expertBookings)
          .set({ status: "confirmed", updatedAt: new Date() })
          .where(eq(expertBookings.id, booking.id));

        const existingSession = await tx
          .select({ id: sessions.id })
          .from(sessions)
          .where(eq(sessions.bookingId, booking.id))
          .limit(1)
          .then((r) => r[0]);
        if (!existingSession) {
          await tx.insert(sessions).values({
            bookingId: booking.id,
            startAt: booking.startAt,
            endAt: booking.endAt,
            status: "scheduled",
          });
        }

        await tx.insert(payments).values({
          orderId: order.id,
          provider: "mock",
          providerPaymentId: `mock_${nanoid(16)}`,
          amount: order.amount,
          currency: order.currency,
          status: "success",
        });
      });

      return { success: true, orderId: order.id };
    }),
});
