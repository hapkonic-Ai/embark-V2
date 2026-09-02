import { desc, eq, sql, and, ne, or, asc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  colleges,
  events,
  expertPages,
  mentorProfiles,
  mentorServicePackageItems,
  mentorServicePackages,
  mentorServices,
  playbooks,
  submissions,
  users,
} from "@db/schema";
import { isExpertEnabled } from "@contracts/features";
import { getDb } from "../queries/connection";
import { createRouter, publicQuery } from "../middleware";
import { getPublishedExpertPageBySlug } from "../lib/expert-page";
import { resolveAssetFields } from "../lib/file-assets";
import {
  computeAvailableSlots,
  getExpertTimezone,
  parseIsoDateTime,
} from "../lib/calendar";

const expertPublic = publicQuery.use(({ next }) => {
  if (!isExpertEnabled()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
  }
  return next();
});

export const catalogRouter = createRouter({
  stats: publicQuery.query(async () => {
    const db = getDb();
    const [mentorCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.isVerified, true));
    const [collegeCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(colleges);
    const [eventCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(events)
      .where(ne(events.status, "draft"));
    const [candidateCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "candidate"));
    return {
      mentors: Number(mentorCount?.n ?? 0),
      colleges: Number(collegeCount?.n ?? 0),
      events: Number(eventCount?.n ?? 0),
      candidates: Number(candidateCount?.n ?? 0),
    };
  }),

  mentors: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        profile: mentorProfiles,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .where(
        and(
          or(
            eq(mentorProfiles.isVerified, true),
            eq(mentorProfiles.verificationStatus, "verified"),
          ),
          eq(users.isActive, true),
        ),
      )
      .orderBy(desc(mentorProfiles.createdAt));
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        profile: await resolveAssetFields(row.profile, ["profileImage", "coverImage"], db),
      })),
    );
  }),

  mentor: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({
          profile: mentorProfiles,
          name: users.name,
          email: users.email,
          role: users.role,
          expertPageSlug: expertPages.slug,
        })
        .from(mentorProfiles)
        .innerJoin(users, eq(users.id, mentorProfiles.userId))
        .leftJoin(expertPages, eq(expertPages.userId, mentorProfiles.userId))
        .where(eq(mentorProfiles.id, input.id))
        .limit(1);
      const row = rows[0] ?? null;
      if (!row) return null;
      return {
        ...row,
        profile: await resolveAssetFields(row.profile, ["profileImage", "coverImage"], db),
      };
    }),

  mentorBySlug: publicQuery
    .input(z.object({ slug: z.string().max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ profile: mentorProfiles, name: users.name, email: users.email, role: users.role })
        .from(mentorProfiles)
        .innerJoin(users, eq(users.id, mentorProfiles.userId))
        .where(eq(mentorProfiles.publicSlug, input.slug))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      const resolvedProfile = await resolveAssetFields(row.profile, ["profileImage", "coverImage"], db);
      const isVerified = row.profile.isVerified || row.profile.verificationStatus === "verified";
      if (!isVerified || !row.email) {
        return { ...row, profile: resolvedProfile, email: null };
      }
      return { ...row, profile: resolvedProfile };
    }),

  playbooks: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(playbooks)
      .where(eq(playbooks.isPublished, true))
      .orderBy(desc(playbooks.createdAt));
  }),

  playbook: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(playbooks)
        .where(and(eq(playbooks.id, input.id), eq(playbooks.isPublished, true)))
        .limit(1);
      return rows[0] ?? null;
    }),

  events: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db
      .select({
        event: events,
        submissionCount: sql<number>`(
          select count(*) from ${submissions} s where s.eventId = ${events.id}
        )`,
      })
      .from(events)
      .where(ne(events.status, "draft"))
      .orderBy(desc(events.createdAt));
    return rows.map((r) => ({
      ...r.event,
      submissionCount: Number(r.submissionCount),
    }));
  }),

  event: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const ev = await db
        .select()
        .from(events)
        .where(eq(events.id, input.id))
        .limit(1);
      if (!ev[0]) return null;
      const winners = await db
        .select({
          id: submissions.id,
          teamName: submissions.teamName,
          title: submissions.title,
          score: submissions.score,
          name: users.name,
        })
        .from(submissions)
        .innerJoin(users, eq(users.id, submissions.userId))
        .where(
          and(
            eq(submissions.eventId, input.id),
            eq(submissions.status, "winner"),
          ),
        );
      return { ...ev[0], winners };
    }),

  colleges: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(colleges)
      .orderBy(sql`coalesce(${colleges.nirfRank}, 999)`, colleges.name);
  }),

  expertPageBySlug: expertPublic
    .input(z.object({ slug: z.string().max(64) }))
    .query(async ({ input }) => {
      const page = await getPublishedExpertPageBySlug(input.slug);
      if (!page) return null;
      return page;
    }),

  expertServicesBySlug: expertPublic
    .input(z.object({ slug: z.string().max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const page = await db
        .select({ userId: expertPages.userId })
        .from(expertPages)
        .where(eq(expertPages.slug, input.slug))
        .limit(1)
        .then((r) => r[0]);
      if (!page) return [];
      return db
        .select({
          id: mentorServices.id,
          title: mentorServices.title,
          slug: mentorServices.slug,
          description: mentorServices.description,
          serviceType: mentorServices.serviceType,
          price: mentorServices.price,
          currency: mentorServices.currency,
          durationMinutes: mentorServices.durationMinutes,
          deliveryMode: mentorServices.deliveryMode,
          requirements: mentorServices.requirements,
          outcomes: mentorServices.outcomes,
          image: mentorServices.image,
          displayOrder: mentorServices.displayOrder,
          communicationMode: mentorServices.communicationMode,
        })
        .from(mentorServices)
        .where(
          and(
            eq(mentorServices.userId, page.userId),
            eq(mentorServices.status, "published"),
          ),
        )
        .orderBy(mentorServices.displayOrder);
    }),

  expertServiceBySlug: expertPublic
    .input(
      z.object({
        expertSlug: z.string().max(64),
        serviceSlug: z.string().max(64),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = await db
        .select({ userId: expertPages.userId })
        .from(expertPages)
        .where(eq(expertPages.slug, input.expertSlug))
        .limit(1)
        .then((r) => r[0]);
      if (!page) return null;
      return db
        .select({
          id: mentorServices.id,
          title: mentorServices.title,
          slug: mentorServices.slug,
          description: mentorServices.description,
          serviceType: mentorServices.serviceType,
          price: mentorServices.price,
          currency: mentorServices.currency,
          durationMinutes: mentorServices.durationMinutes,
          deliveryMode: mentorServices.deliveryMode,
          requirements: mentorServices.requirements,
          outcomes: mentorServices.outcomes,
          image: mentorServices.image,
          displayOrder: mentorServices.displayOrder,
          communicationMode: mentorServices.communicationMode,
        })
        .from(mentorServices)
        .where(
          and(
            eq(mentorServices.userId, page.userId),
            eq(mentorServices.slug, input.serviceSlug),
            eq(mentorServices.status, "published"),
          ),
        )
        .limit(1)
        .then((r) => r[0] ?? null);
    }),

  expertServiceSlots: expertPublic
    .input(
      z.object({
        expertSlug: z.string().max(64),
        serviceSlug: z.string().max(64),
        from: z.string().datetime(),
        to: z.string().datetime(),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = await db
        .select({
          userId: expertPages.userId,
          publishedAt: expertPages.publishedAt,
        })
        .from(expertPages)
        .where(eq(expertPages.slug, input.expertSlug))
        .limit(1)
        .then((r) => r[0]);
      if (!page || !page.publishedAt) return [];

      const profile = await db
        .select({
          isVerified: mentorProfiles.isVerified,
          verificationStatus: mentorProfiles.verificationStatus,
        })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, page.userId))
        .limit(1)
        .then((r) => r[0]);
      if (
        !profile ||
        (!profile.isVerified && profile.verificationStatus !== "verified")
      ) {
        return [];
      }

      const service = await db
        .select({
          id: mentorServices.id,
          durationMinutes: mentorServices.durationMinutes,
          status: mentorServices.status,
        })
        .from(mentorServices)
        .where(
          and(
            eq(mentorServices.userId, page.userId),
            eq(mentorServices.slug, input.serviceSlug),
            eq(mentorServices.status, "published"),
          ),
        )
        .limit(1)
        .then((r) => r[0]);
      if (!service?.durationMinutes) return [];

      const from = parseIsoDateTime(input.from);
      const to = parseIsoDateTime(input.to);
      if (!from || !to) return [];

      const tz = await getExpertTimezone(page.userId);
      const slots = await computeAvailableSlots({
        userId: page.userId,
        timezone: tz,
        durationMinutes: service.durationMinutes,
        from,
        to,
      });
      return slots.map((s) => ({
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
      }));
    }),

  expertPackagesBySlug: expertPublic
    .input(z.object({ slug: z.string().max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const page = await db
        .select({ userId: expertPages.userId })
        .from(expertPages)
        .where(eq(expertPages.slug, input.slug))
        .limit(1)
        .then((r) => r[0]);
      if (!page) return [];
      const packages = await db
        .select()
        .from(mentorServicePackages)
        .where(
          and(
            eq(mentorServicePackages.userId, page.userId),
            eq(mentorServicePackages.status, "published"),
          ),
        )
        .orderBy(asc(mentorServicePackages.displayOrder));
      if (!packages.length) return [];
      const items = await db
        .select()
        .from(mentorServicePackageItems)
        .where(inArray(mentorServicePackageItems.packageId, packages.map((p) => p.id)))
        .orderBy(asc(mentorServicePackageItems.displayOrder));
      const services = await db
        .select()
        .from(mentorServices)
        .where(
          inArray(
            mentorServices.id,
            items.map((i) => i.serviceId),
          ),
        );
      return packages.map((pkg) => ({
        ...pkg,
        items: items
          .filter((i) => i.packageId === pkg.id)
          .map((i) => ({
            ...i,
            service: services.find((s) => s.id === i.serviceId)!,
          })),
      }));
    }),

  expertPackageBySlug: expertPublic
    .input(
      z.object({
        expertSlug: z.string().max(64),
        packageSlug: z.string().max(64),
      }),
    )
    .query(async ({ input }) => {
      const db = getDb();
      const page = await db
        .select({ userId: expertPages.userId })
        .from(expertPages)
        .where(eq(expertPages.slug, input.expertSlug))
        .limit(1)
        .then((r) => r[0]);
      if (!page) return null;
      const pkg = await db
        .select()
        .from(mentorServicePackages)
        .where(
          and(
            eq(mentorServicePackages.userId, page.userId),
            eq(mentorServicePackages.slug, input.packageSlug),
            eq(mentorServicePackages.status, "published"),
          ),
        )
        .limit(1)
        .then((r) => r[0] ?? null);
      if (!pkg) return null;
      const items = await db
        .select()
        .from(mentorServicePackageItems)
        .where(eq(mentorServicePackageItems.packageId, pkg.id))
        .orderBy(asc(mentorServicePackageItems.displayOrder));
      const services = await db
        .select()
        .from(mentorServices)
        .where(inArray(mentorServices.id, items.map((i) => i.serviceId)));
      return {
        ...pkg,
        items: items.map((i) => ({
          ...i,
          service: services.find((s) => s.id === i.serviceId)!,
        })),
      };
    }),
});
