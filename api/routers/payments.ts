import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  expertBookings,
  mentorProfiles,
  mentorServices,
  mentorships,
  orders,
  payments,
  playbookPurchases,
  playbooks,
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
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.studentId, ctx.user.id))
      .orderBy(desc(orders.createdAt));

    const bookingIds = allOrders
      .map((o) => o.bookingId)
      .filter((id): id is number => id !== null);
    const mentorshipIds = allOrders
      .map((o) => o.mentorshipId)
      .filter((id): id is number => id !== null);
    const playbookPurchaseIds = allOrders
      .map((o) => o.playbookPurchaseId)
      .filter((id): id is number => id !== null);

    const [bookingRows, mentorshipRows, playbookRows] = await Promise.all([
      bookingIds.length
        ? db
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
            .where(inArray(expertBookings.id, bookingIds))
        : Promise.resolve([]),
      mentorshipIds.length
        ? db
            .select({
              mentorship: mentorships,
              mentorName: users.name,
            })
            .from(mentorships)
            .innerJoin(
              mentorProfiles,
              eq(mentorProfiles.id, mentorships.mentorProfileId),
            )
            .innerJoin(users, eq(users.id, mentorProfiles.userId))
            .where(inArray(mentorships.id, mentorshipIds))
        : Promise.resolve([]),
      playbookPurchaseIds.length
        ? db
            .select({
              purchase: playbookPurchases,
              playbookTitle: playbooks.title,
            })
            .from(playbookPurchases)
            .innerJoin(
              playbooks,
              eq(playbooks.id, playbookPurchases.playbookId),
            )
            .where(inArray(playbookPurchases.id, playbookPurchaseIds))
        : Promise.resolve([]),
    ]);

    const orderIds = allOrders.map((o) => o.id);
    const paymentRows = orderIds.length
      ? await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.status, "success"),
              inArray(payments.orderId, orderIds),
            ),
          )
      : [];

    return allOrders.map((order) => {
      const payment = paymentRows.find((p) => p.orderId === order.id) ?? null;
      if (order.bookingId) {
        const row = bookingRows.find((r) => r.booking.id === order.bookingId)!;
        return {
          type: "booking" as const,
          order,
          booking: row.booking,
          title: row.serviceTitle,
          expertName: row.expertName,
          payment,
        };
      }
      if (order.mentorshipId) {
        const row = mentorshipRows.find(
          (r) => r.mentorship.id === order.mentorshipId,
        )!;
        return {
          type: "mentorship" as const,
          order,
          mentorship: row.mentorship,
          title: `Mentorship with ${row.mentorName}`,
          expertName: row.mentorName,
          payment,
        };
      }
      const row = playbookRows.find(
        (r) => r.purchase.id === order.playbookPurchaseId,
      )!;
      return {
        type: "playbook" as const,
        order,
        purchase: row.purchase,
        title: row.playbookTitle,
        expertName: null,
        payment,
      };
    });
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

      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(orders.id, order.id));

        if (order.bookingId) {
          const booking = await tx
            .select()
            .from(expertBookings)
            .where(eq(expertBookings.id, order.bookingId))
            .limit(1)
            .then((r) => r[0]);
          if (booking) {
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
          }
        }

        // Playbook purchases are owned once the purchase row exists;
        // the order records payment status for accounting.

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
