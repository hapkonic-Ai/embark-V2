import { and, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  expertEducation,
  expertExperience,
  expertPageConfigs,
  expertPageSections,
  expertPages,
  mentorProfiles,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter } from "../middleware";
import { roleQuery } from "../rbac";
import {
  generateUniqueSlug,
  getExpertPageWithDetails,
  getOrCreateExpertPage,
  slugify,
} from "../lib/expert-page";
import { resolveAssetFields } from "../lib/file-assets";

const expert = roleQuery("expert");

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const sectionTypeSchema = z.enum([
  "hero",
  "about",
  "experience",
  "education",
  "skills",
  "services",
  "reviews",
  "social_links",
  "cta",
]);

export const expertPageRouter = createRouter({
  myPage: expert.query(async ({ ctx }) => {
    const db = getDb();
    const pageDetails = await getExpertPageWithDetails(ctx.user.id);

    const [profile, experiences, educations] = await Promise.all([
      db
        .select()
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, ctx.user.id))
        .limit(1)
        .then((r) => r[0] ?? null),
      db
        .select()
        .from(expertExperience)
        .where(eq(expertExperience.userId, ctx.user.id))
        .orderBy(expertExperience.displayOrder),
      db
        .select()
        .from(expertEducation)
        .where(eq(expertEducation.userId, ctx.user.id))
        .orderBy(expertEducation.displayOrder),
    ]);

    const resolvedProfile = profile
      ? await resolveAssetFields(profile, ["profileImage", "coverImage"], db)
      : profile;

    return {
      ...pageDetails,
      profile: resolvedProfile,
      experiences,
      educations,
    };
  }),

  updatePageConfig: expert
    .input(
      z.object({
        metaTitle: z.string().max(120).optional().or(z.literal("")),
        metaDescription: z.string().max(255).optional().or(z.literal("")),
        ogImage: z.string().max(12_000_000).optional().or(z.literal("")),
        theme: z.enum(["minimal", "professional", "modern"]).optional(),
        accentColor: z
          .string()
          .max(7)
          .regex(hexColorRegex, "Accent color must be a valid hex color like #F97316")
          .optional(),
        background: z.enum(["light", "dark", "muted"]).optional(),
        profileImageStyle: z.enum(["rounded", "square", "circle"]).optional(),
        coverStyle: z.enum(["gradient", "image", "solid", "none"]).optional(),
        buttonStyle: z.enum(["rounded", "square", "pill"]).optional(),
        ctaType: z
          .enum(["none", "booking", "service", "external_url", "contact"])
          .optional(),
        ctaLabel: z.string().max(64).optional().or(z.literal("")),
        ctaTarget: z.string().max(320).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const page = await getOrCreateExpertPage(ctx.user.id);

      const pageSet: Record<string, unknown> = {};
      if (input.metaTitle !== undefined) pageSet.metaTitle = input.metaTitle || null;
      if (input.metaDescription !== undefined)
        pageSet.metaDescription = input.metaDescription || null;
      if (input.ogImage !== undefined) pageSet.ogImage = input.ogImage || null;

      const configSet: Record<string, unknown> = {};
      if (input.theme !== undefined) configSet.theme = input.theme;
      if (input.accentColor !== undefined) configSet.accentColor = input.accentColor;
      if (input.background !== undefined) configSet.background = input.background;
      if (input.profileImageStyle !== undefined)
        configSet.profileImageStyle = input.profileImageStyle;
      if (input.coverStyle !== undefined) configSet.coverStyle = input.coverStyle;
      if (input.buttonStyle !== undefined) configSet.buttonStyle = input.buttonStyle;
      if (input.ctaType !== undefined) configSet.ctaType = input.ctaType;
      if (input.ctaLabel !== undefined) configSet.ctaLabel = input.ctaLabel || null;
      if (input.ctaTarget !== undefined) configSet.ctaTarget = input.ctaTarget || null;

      await db.transaction(async (tx) => {
        if (Object.keys(pageSet).length) {
          await tx
            .update(expertPages)
            .set({ ...pageSet, updatedAt: new Date() })
            .where(eq(expertPages.id, page.id));
        }
        if (Object.keys(configSet).length) {
          await tx
            .update(expertPageConfigs)
            .set({ ...configSet, updatedAt: new Date() })
            .where(eq(expertPageConfigs.pageId, page.id));
        }
      });

      return { success: true };
    }),

  updatePageSections: expert
    .input(
      z.object({
        sections: z.array(
          z.object({
            sectionType: sectionTypeSchema,
            displayOrder: z.number().int(),
            isVisible: z.boolean(),
            config: z.record(z.string(), z.unknown()).default({}),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const page = await getOrCreateExpertPage(ctx.user.id);

      const sectionTypes = input.sections.map((s) => s.sectionType);
      const existing = await db
        .select()
        .from(expertPageSections)
        .where(
          and(
            eq(expertPageSections.pageId, page.id),
            inArray(expertPageSections.sectionType, sectionTypes),
          ),
        );

      const existingMap = new Map(existing.map((e) => [e.sectionType, e]));

      await db.transaction(async (tx) => {
        for (const s of input.sections) {
          const existingRow = existingMap.get(s.sectionType);
          const configJson =
            s.config && Object.keys(s.config).length ? s.config : {};
          if (existingRow) {
            await tx
              .update(expertPageSections)
              .set({
                displayOrder: s.displayOrder,
                isVisible: s.isVisible,
                config: configJson,
                updatedAt: new Date(),
              })
              .where(eq(expertPageSections.id, existingRow.id));
          } else {
            await tx.insert(expertPageSections).values({
              pageId: page.id,
              sectionType: s.sectionType,
              displayOrder: s.displayOrder,
              isVisible: s.isVisible,
              config: configJson,
            });
          }
        }
      });

      return { success: true };
    }),

  publishPage: expert.mutation(async ({ ctx }) => {
    const db = getDb();
    const page = await getOrCreateExpertPage(ctx.user.id);

    if (!page.slug) {
      const [profile] = await db
        .select({ displayName: mentorProfiles.displayName })
        .from(mentorProfiles)
        .where(eq(mentorProfiles.userId, ctx.user.id))
        .limit(1);
      const base = profile?.displayName || ctx.user.name || "expert";
      const slug = await generateUniqueSlug(base);
      await db
        .update(expertPages)
        .set({ slug })
        .where(eq(expertPages.id, page.id));
      page.slug = slug;
    }

    await db
      .update(expertPages)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(expertPages.id, page.id));

    return { success: true, slug: page.slug, status: "published" };
  }),

  unpublishPage: expert.mutation(async ({ ctx }) => {
    const db = getDb();
    const page = await getOrCreateExpertPage(ctx.user.id);

    await db
      .update(expertPages)
      .set({ status: "unpublished", updatedAt: new Date() })
      .where(eq(expertPages.id, page.id));

    return { success: true, status: "unpublished" };
  }),

  updateSlug: expert
    .input(
      z.object({
        slug: z
          .string()
          .min(1)
          .max(64)
          .regex(
            /^[a-z0-9-]+$/,
            "Slug may only contain lowercase letters, numbers, and hyphens.",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const page = await getOrCreateExpertPage(ctx.user.id);

      const desired = slugify(input.slug);
      const conflict = await db
        .select({ id: expertPages.id })
        .from(expertPages)
        .where(eq(expertPages.slug, desired))
        .limit(1)
        .then((r) => r[0]);

      if (conflict && conflict.id !== page.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That slug is already taken.",
        });
      }

      await db
        .update(expertPages)
        .set({ slug: desired, updatedAt: new Date() })
        .where(eq(expertPages.id, page.id));

      return { success: true, slug: desired };
    }),
});
