import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { mentorServices, mentorProfiles } from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import { slugify } from "../lib/expert-page";

const expert = roleQuery("expert");

const SERVICE_TYPE_ENUM = z.enum(["one_on_one", "review", "consultation", "mentorship"]);
const DELIVERY_MODE_ENUM = z.enum(["online", "offline", "async", "hybrid"]);
const STATUS_ENUM = z.enum(["draft", "published", "unpublished", "archived"]);
const COMMUNICATION_MODE_ENUM = z.enum([
  "none",
  "whatsapp_direct",
  "whatsapp_group",
  "whatsapp_direct_and_group",
]);
const WHATSAPP_POLICY_ENUM = z.enum([
  "after_booking",
  "after_payment",
  "after_completion",
  "manual",
]);

const serviceInput = z.object({
  title: z.string().min(2).max(255),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  description: z.string().max(4000).optional().or(z.literal("")),
  serviceType: SERVICE_TYPE_ENUM,
  price: z.number().int().min(0).max(10_000_000),
  currency: z.string().min(3).max(3).default("INR"),
  durationMinutes: z.number().int().min(1).max(8 * 60).optional(),
  deliveryMode: DELIVERY_MODE_ENUM.default("online"),
  requirements: z.string().max(2000).optional().or(z.literal("")),
  outcomes: z.string().max(2000).optional().or(z.literal("")),
  image: z.string().max(12_000_000).optional().or(z.literal("")),
  status: STATUS_ENUM.default("draft"),
  displayOrder: z.number().int().min(0).default(0),
  communicationMode: COMMUNICATION_MODE_ENUM.default("none"),
  whatsappDirectNumber: z.string().max(32).optional().or(z.literal("")),
  whatsappGroupInviteUrl: z.string().url().max(512).optional().or(z.literal("")),
  whatsappGroupAccessPolicy: WHATSAPP_POLICY_ENUM.default("after_payment"),
});

async function ensureUniqueSlug(userId: number, desired: string, excludeId?: number) {
  const db = getDb();
  let candidate = slugify(desired).slice(0, 60) || "service";
  let attempts = 0;
  while (attempts < 20) {
    const existing = await db
      .select({ id: mentorServices.id })
      .from(mentorServices)
      .where(and(eq(mentorServices.userId, userId), eq(mentorServices.slug, candidate)))
      .limit(1)
      .then((r) => r[0]);
    if (!existing || existing.id === excludeId) return candidate;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${candidate.slice(0, 55)}-${suffix}`;
    attempts++;
  }
  throw new TRPCError({ code: "CONFLICT", message: "Could not generate a unique slug." });
}

async function verifyServiceOwner(userId: number, serviceId: number) {
  const db = getDb();
  const row = await db
    .select()
    .from(mentorServices)
    .where(eq(mentorServices.id, serviceId))
    .limit(1)
    .then((r) => r[0]);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Service not found." });
  }
  if (row.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this service." });
  }
  return row;
}

function sanitizeInput(input: z.infer<typeof serviceInput>): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === "" || value === undefined) {
      if (key === "durationMinutes") set[key] = null;
      else if (key === "image") set[key] = null;
      else if (key === "description") set[key] = null;
      else if (key === "requirements") set[key] = null;
      else if (key === "outcomes") set[key] = null;
      else if (key === "whatsappDirectNumber") set[key] = null;
      else if (key === "whatsappGroupInviteUrl") set[key] = null;
      else set[key] = value;
    } else {
      set[key] = value;
    }
  }
  return set;
}

export const expertServicesRouter = createRouter({
  listMyServices: expert.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(mentorServices)
      .where(eq(mentorServices.userId, ctx.user.id))
      .orderBy(asc(mentorServices.displayOrder), desc(mentorServices.updatedAt));
  }),

  getServiceById: expert
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await db
        .select()
        .from(mentorServices)
        .where(eq(mentorServices.id, input.id))
        .limit(1)
        .then((r) => r[0]);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Service not found." });
      }
      if (row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this service." });
      }
      return row;
    }),

  createService: expert
    .input(serviceInput.partial({ slug: true }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const slug = input.slug
        ? await ensureUniqueSlug(ctx.user.id, input.slug)
        : await ensureUniqueSlug(ctx.user.id, slugify(input.title));

      const [max] = await db
        .select({ n: mentorServices.displayOrder })
        .from(mentorServices)
        .where(eq(mentorServices.userId, ctx.user.id))
        .orderBy(desc(mentorServices.displayOrder))
        .limit(1);
      const displayOrder = (max?.n ?? -1) + 1;

      const [created] = await db
        .insert(mentorServices)
        .values({
          userId: ctx.user.id,
          title: input.title,
          slug,
          description: input.description || null,
          serviceType: input.serviceType,
          price: input.price,
          currency: input.currency.toUpperCase(),
          durationMinutes: input.durationMinutes ?? null,
          deliveryMode: input.deliveryMode,
          requirements: input.requirements || null,
          outcomes: input.outcomes || null,
          image: input.image || null,
          status: input.status,
          displayOrder,
          communicationMode: input.communicationMode,
          whatsappDirectNumber:
            input.communicationMode.includes("direct") ? input.whatsappDirectNumber || null : null,
          whatsappGroupInviteUrl:
            input.communicationMode.includes("group") ? input.whatsappGroupInviteUrl || null : null,
          whatsappGroupAccessPolicy: input.whatsappGroupAccessPolicy,
        })
        .$returningId();

      const row = await db
        .select()
        .from(mentorServices)
        .where(eq(mentorServices.id, created.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, service: row };
    }),

  updateService: expert
    .input(
      z.object({
        id: z.number(),
        data: serviceInput.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await verifyServiceOwner(ctx.user.id, input.id);

      const set = sanitizeInput(input.data as z.infer<typeof serviceInput>);
      if (input.data.slug !== undefined) {
        const desired = slugify(input.data.slug);
        set.slug = await ensureUniqueSlug(ctx.user.id, desired, input.id);
      }

      const mode = input.data.communicationMode ?? existing.communicationMode;
      if (!mode?.includes("direct")) set.whatsappDirectNumber = null;
      if (!mode?.includes("group")) set.whatsappGroupInviteUrl = null;

      await db
        .update(mentorServices)
        .set({ ...set, updatedAt: new Date() })
        .where(eq(mentorServices.id, input.id));

      const row = await db
        .select()
        .from(mentorServices)
        .where(eq(mentorServices.id, input.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, service: row };
    }),

  publishService: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const row = await verifyServiceOwner(ctx.user.id, input.id);
      if (row.status === "archived") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Archived services cannot be published. Restore by editing status.",
        });
      }

      const service = await db
        .select()
        .from(mentorServices)
        .where(eq(mentorServices.id, input.id))
        .limit(1)
        .then((r) => r[0]!);

      // Validate publication requirements.
      if (!service.title || service.title.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Service title is required." });
      }
      if (!service.description || service.description.length < 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Service description must be at least 10 characters.",
        });
      }
      if (service.price < 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Service price is invalid." });
      }

      // Verify expert is verified/active before publishing.
      const profile = await db
        .select({ verificationStatus: mentorProfiles.verificationStatus, isVerified: mentorProfiles.isVerified })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, ctx.user.id))
        .limit(1)
        .then((r) => r[0]);
      if (!profile || (profile.verificationStatus !== "verified" && !profile.isVerified)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your expert profile must be verified before publishing services.",
        });
      }

      await db
        .update(mentorServices)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(mentorServices.id, input.id));

      return { success: true, status: "published" };
    }),

  unpublishService: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyServiceOwner(ctx.user.id, input.id);
      await db
        .update(mentorServices)
        .set({ status: "unpublished", updatedAt: new Date() })
        .where(eq(mentorServices.id, input.id));
      return { success: true, status: "unpublished" };
    }),

  archiveService: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyServiceOwner(ctx.user.id, input.id);
      await db
        .update(mentorServices)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(mentorServices.id, input.id));
      return { success: true, status: "archived" };
    }),

  reorderServices: expert
    .input(
      z.array(
        z.object({
          id: z.number(),
          displayOrder: z.number().int().min(0),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ids = input.map((i) => i.id);
      const rows = await db
        .select({ id: mentorServices.id })
        .from(mentorServices)
        .where(and(eq(mentorServices.userId, ctx.user.id), inArray(mentorServices.id, ids)));
      if (rows.length !== input.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid service ids." });
      }

      await db.transaction(async (tx) => {
        for (const item of input) {
          await tx
            .update(mentorServices)
            .set({ displayOrder: item.displayOrder, updatedAt: new Date() })
            .where(eq(mentorServices.id, item.id));
        }
      });

      return { success: true };
    }),
});
