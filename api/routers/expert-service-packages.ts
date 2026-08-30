import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  mentorServicePackageItems,
  mentorServicePackages,
  mentorServices,
  mentorProfiles,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import { slugify } from "../lib/expert-page";

const expert = roleQuery("expert");

const packageInput = z.object({
  title: z.string().min(2).max(255),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  description: z.string().max(4000).optional().or(z.literal("")).or(z.null()),
  image: z.string().max(12_000_000).optional().or(z.literal("")).or(z.null()),
  price: z.number().int().min(0).max(10_000_000).optional().or(z.null()),
  currency: z.string().min(3).max(3).default("INR"),
  status: z.enum(["draft", "published", "unpublished", "archived"]).default("draft"),
  displayOrder: z.number().int().min(0).default(0),
  serviceIds: z.array(z.number()).default([]),
});

async function ensureUniqueSlug(userId: number, desired: string, excludeId?: number) {
  const db = getDb();
  let candidate = slugify(desired).slice(0, 60) || "package";
  let attempts = 0;
  while (attempts < 20) {
    const existing = await db
      .select({ id: mentorServicePackages.id })
      .from(mentorServicePackages)
      .where(and(eq(mentorServicePackages.userId, userId), eq(mentorServicePackages.slug, candidate)))
      .limit(1)
      .then((r) => r[0]);
    if (!existing || existing.id === excludeId) return candidate;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${candidate.slice(0, 55)}-${suffix}`;
    attempts++;
  }
  throw new TRPCError({ code: "CONFLICT", message: "Could not generate a unique slug." });
}

async function verifyPackageOwner(userId: number, packageId: number) {
  const db = getDb();
  const row = await db
    .select()
    .from(mentorServicePackages)
    .where(eq(mentorServicePackages.id, packageId))
    .limit(1)
    .then((r) => r[0]);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Package not found." });
  }
  if (row.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this package." });
  }
  return row;
}

async function rewritePackageItems(tx: ReturnType<typeof getDb>, packageId: number, serviceIds: number[]) {
  await tx.delete(mentorServicePackageItems).where(eq(mentorServicePackageItems.packageId, packageId));
  if (serviceIds.length) {
    await tx.insert(mentorServicePackageItems).values(
      serviceIds.map((serviceId, index) => ({
        packageId,
        serviceId,
        displayOrder: index,
      })),
    );
  }
}

export const expertServicePackagesRouter = createRouter({
  listMyPackages: expert.query(async ({ ctx }) => {
    const db = getDb();
    const packages = await db
      .select()
      .from(mentorServicePackages)
      .where(eq(mentorServicePackages.userId, ctx.user.id))
      .orderBy(asc(mentorServicePackages.displayOrder), desc(mentorServicePackages.createdAt));
    const items = packages.length
      ? await db
          .select()
          .from(mentorServicePackageItems)
          .where(inArray(mentorServicePackageItems.packageId, packages.map((p) => p.id)))
      : [];
    return packages.map((pkg) => ({
      ...pkg,
      serviceIds: items.filter((i) => i.packageId === pkg.id).map((i) => i.serviceId),
    }));
  }),

  getPackageById: expert
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const row = await verifyPackageOwner(ctx.user.id, input.id);
      const items = await db
        .select()
        .from(mentorServicePackageItems)
        .where(eq(mentorServicePackageItems.packageId, input.id))
        .orderBy(asc(mentorServicePackageItems.displayOrder));
      return { ...row, serviceIds: items.map((i) => i.serviceId) };
    }),

  createPackage: expert.input(packageInput).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const slug = await ensureUniqueSlug(ctx.user.id, input.slug || slugify(input.title));

    const services = await db
      .select({ id: mentorServices.id, userId: mentorServices.userId })
      .from(mentorServices)
      .where(inArray(mentorServices.id, input.serviceIds));
    if (services.length !== input.serviceIds.length) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "One or more services not found." });
    }
    if (services.some((s) => s.userId !== ctx.user.id)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not own all selected services." });
    }

    const price = input.price ?? (await computeDefaultPrice(input.serviceIds));

    const [created] = await db
      .insert(mentorServicePackages)
      .values({
        userId: ctx.user.id,
        title: input.title,
        slug,
        description: input.description ?? null,
        image: input.image ?? null,
        price,
        currency: input.currency,
        status: input.status,
        displayOrder: input.displayOrder,
      })
      .$returningId();

    await rewritePackageItems(db, created.id, input.serviceIds);

    const row = await db
      .select()
      .from(mentorServicePackages)
      .where(eq(mentorServicePackages.id, created.id))
      .limit(1)
      .then((r) => r[0]!);

    return { success: true, package: row };
  }),

  updatePackage: expert
    .input(z.object({ id: z.number(), data: packageInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await verifyPackageOwner(ctx.user.id, input.id);

      const set: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input.data)) {
        if (value === "" || value === undefined) {
          if (["description", "image"].includes(key)) set[key] = null;
          else set[key] = value;
        } else if (value !== null) {
          set[key] = value;
        }
      }

      if (input.data.slug !== undefined) {
        const desired = slugify(input.data.slug || existing.slug);
        set.slug = await ensureUniqueSlug(ctx.user.id, desired, input.id);
      }

      if (input.data.serviceIds !== undefined) {
        const services = await db
          .select({ id: mentorServices.id, userId: mentorServices.userId })
          .from(mentorServices)
          .where(inArray(mentorServices.id, input.data.serviceIds));
        if (services.length !== input.data.serviceIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One or more services not found." });
        }
        if (services.some((s) => s.userId !== ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You do not own all selected services." });
        }
        if (input.data.price === undefined) {
          set.price = await computeDefaultPrice(input.data.serviceIds);
        }
        await rewritePackageItems(db, input.id, input.data.serviceIds);
      }

      await db
        .update(mentorServicePackages)
        .set({ ...set, updatedAt: new Date() })
        .where(eq(mentorServicePackages.id, input.id));

      const row = await db
        .select()
        .from(mentorServicePackages)
        .where(eq(mentorServicePackages.id, input.id))
        .limit(1)
        .then((r) => r[0]!);

      return { success: true, package: row };
    }),

  deletePackage: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPackageOwner(ctx.user.id, input.id);
      await db.delete(mentorServicePackageItems).where(eq(mentorServicePackageItems.packageId, input.id));
      await db.delete(mentorServicePackages).where(eq(mentorServicePackages.id, input.id));
      return { success: true };
    }),

  publishPackage: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await verifyPackageOwner(ctx.user.id, input.id);
      const profile = await db
        .select({ verificationStatus: mentorProfiles.verificationStatus, isVerified: mentorProfiles.isVerified })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, ctx.user.id))
        .limit(1)
        .then((r) => r[0]);
      const isVerified = profile?.isVerified || profile?.verificationStatus === "verified";
      if (!isVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Verified experts can publish packages." });
      }
      if (!existing.title || existing.title.length < 2) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Package title is required." });
      }
      const items = await db
        .select()
        .from(mentorServicePackageItems)
        .where(eq(mentorServicePackageItems.packageId, input.id));
      if (items.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Package must include at least one service." });
      }
      await db
        .update(mentorServicePackages)
        .set({ status: "published", updatedAt: new Date() })
        .where(eq(mentorServicePackages.id, input.id));
      return { success: true };
    }),

  unpublishPackage: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await verifyPackageOwner(ctx.user.id, input.id);
      await db
        .update(mentorServicePackages)
        .set({ status: "unpublished", updatedAt: new Date() })
        .where(eq(mentorServicePackages.id, input.id));
      return { success: true };
    }),
});

async function computeDefaultPrice(serviceIds: number[]): Promise<number | null> {
  if (!serviceIds.length) return null;
  const db = getDb();
  const rows = await db
    .select({ price: mentorServices.price })
    .from(mentorServices)
    .where(inArray(mentorServices.id, serviceIds));
  return rows.reduce((sum, r) => sum + (r.price ?? 0), 0) || null;
}
