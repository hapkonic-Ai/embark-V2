import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  expertEducation,
  expertExperience,
  expertOnboarding,
  expertPages,
  expertResumes,
  expertVerifications,
  fileAssets,
  mentorProfiles,
} from "@db/schema";
import { calculateProfileCompletion } from "../lib/profile-completion";
import { regexParser } from "../lib/resume-parsers/regex-parser";
import { getDb } from "../queries/connection";
import { createRouter, authedQuery } from "../middleware";
import {
  approxBase64Bytes,
  isDataUrl,
  parseAssetRef,
  parseDataUrl,
  resolveAssetFields,
} from "../lib/file-assets";
import { isValidTimezone } from "../lib/calendar";
import { uploadObject } from "../lib/s3-client";
import { nanoid } from "nanoid";
import { slugify } from "../lib/expert-page";

const expert = authedQuery.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "mentor" && ctx.user.role !== "expert") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Requires role: mentor or expert",
    });
  }
  return next({ ctx });
});

const ACCEPTED_RESUME_MIMES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_RESUME_BYTES = 8 * 1024 * 1024;

const ACCEPTED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadBase64Image(userId: number, dataUrlOrBase64: string, fileName = "upload"): Promise<string> {
  const parsed = parseDataUrl(dataUrlOrBase64);
  const mimeType = parsed?.mimeType ?? "image/png";
  const base64 = parsed?.base64 ?? dataUrlOrBase64;
  if (!ACCEPTED_IMAGE_MIMES.includes(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported image type. Accepted: JPG, PNG, GIF, WebP.",
    });
  }
  const approxBytes = approxBase64Bytes(base64);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Image must be under 5 MB." });
  }
  const buffer = Buffer.from(base64, "base64");
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `users/${userId}/images/${nanoid(8)}-${safeName}`;
  return uploadObject(key, buffer, mimeType);
}

async function getMyProfile(userId: number) {
  const rows = await getDb()
    .select()
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

async function ensureOnboarding(userId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(expertOnboarding)
    .where(eq(expertOnboarding.userId, userId))
    .limit(1);
  if (rows[0]) return rows[0];
  await db.insert(expertOnboarding).values({
    userId,
    currentStep: "account",
    status: "in_progress",
    startedAt: new Date(),
  });
  return db
    .select()
    .from(expertOnboarding)
    .where(eq(expertOnboarding.userId, userId))
    .then((r) => r[0]!);
}

async function computeAndPersistCompletion(userId: number) {
  const db = getDb();
  const [profile, experiences, educations] = await Promise.all([
    getMyProfile(userId),
    db
      .select({ id: expertExperience.id })
      .from(expertExperience)
      .where(eq(expertExperience.userId, userId)),
    db
      .select({ id: expertEducation.id })
      .from(expertEducation)
      .where(eq(expertEducation.userId, userId)),
  ]);
  const completion = calculateProfileCompletion(
    profile ?? {},
    experiences.length,
    educations.length,
  );
  await db
    .update(mentorProfiles)
    .set({ profileCompletionPercent: completion.percentage })
    .where(eq(mentorProfiles.userId, userId));
  return completion;
}

export const expertRouter = createRouter({
  // -------------------------------------------------------------------- me
  me: expert.query(async ({ ctx }) => {
    const db = getDb();
    const [onboarding, profile] = await Promise.all([
      ensureOnboarding(ctx.user.id),
      getMyProfile(ctx.user.id),
    ]);
    const completion = await computeAndPersistCompletion(ctx.user.id);
    const latestVerification = await db
      .select()
      .from(expertVerifications)
      .where(eq(expertVerifications.userId, ctx.user.id))
      .orderBy(desc(expertVerifications.createdAt))
      .limit(1)
      .then((r) => r[0] ?? null);
    const resolvedProfile = profile
      ? await resolveAssetFields(profile, ["profileImage", "coverImage"], db)
      : profile;
    return {
      user: {
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        phone: ctx.user.phone,
        role: ctx.user.role,
        isActive: ctx.user.isActive,
      },
      onboarding,
      isOnboardingComplete: onboarding.status === "completed",
      profile: resolvedProfile,
      completion,
      verification: latestVerification,
    };
  }),

  // ------------------------------------------------------------- profile
  myProfile: expert.query(async ({ ctx }) => {
    const db = getDb();
    const [profile, experiences, educations] = await Promise.all([
      getMyProfile(ctx.user.id),
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
    const completion = await computeAndPersistCompletion(ctx.user.id);
    return { profile: resolvedProfile, experiences, educations, completion };
  }),

  checkSlugAvailability: expert
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
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const desired = slugify(input.slug);
      const [profile, page] = await Promise.all([
        db
          .select({ userId: mentorProfiles.userId })
          .from(mentorProfiles)
          .where(eq(mentorProfiles.publicSlug, desired))
          .limit(1)
          .then((r) => r[0] ?? null),
        db
          .select({ userId: expertPages.userId })
          .from(expertPages)
          .where(eq(expertPages.slug, desired))
          .limit(1)
          .then((r) => r[0] ?? null),
      ]);

      const takenByOther =
        (profile && profile.userId !== ctx.user.id) ||
        (page && page.userId !== ctx.user.id);

      return { available: !takenByOther, slug: desired };
    }),

  upsertProfile: expert
    .input(
      z.object({
        displayName: z.string().min(2).max(120).optional().or(z.literal("")),
        headline: z.string().max(255).optional().or(z.literal("")),
        bio: z.string().max(4000).optional().or(z.literal("")),
        profileImage: z.string().max(6_000_000).optional().or(z.literal("")),
        coverImage: z.string().max(6_000_000).optional().or(z.literal("")),
        location: z.string().max(128).optional().or(z.literal("")),
        country: z.string().max(128).optional().or(z.literal("")),
        timezone: z
          .string()
          .max(64)
          .refine((v) => !v || isValidTimezone(v), {
            message: "Invalid timezone. Use a valid IANA zone such as Asia/Kolkata.",
          })
          .optional()
          .or(z.literal("")),
        currentRole: z.string().max(255).optional().or(z.literal("")),
        company: z.string().max(255).optional().or(z.literal("")),
        expertise: z.string().max(512).optional().or(z.literal("")),
        industries: z.string().max(512).optional().or(z.literal("")),
        languages: z.string().max(512).optional().or(z.literal("")),
        linkedinUrl: z.string().max(320).optional().or(z.literal("")),
        githubUrl: z.string().max(320).optional().or(z.literal("")),
        portfolioUrl: z.string().max(320).optional().or(z.literal("")),
        websiteUrl: z.string().max(320).optional().or(z.literal("")),
        publicSlug: z
          .string()
          .max(64)
          .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens.")
          .optional()
          .or(z.literal("")),
        // legacy mentor fields editable from the mentor dashboard
        bschool: z.string().max(255).optional().or(z.literal("")),
        yearsExp: z.number().int().min(0).max(50).optional(),
        whatsapp: z.string().max(32).optional().or(z.literal("")),
        price: z.number().int().min(0).max(2000000).optional(),
        mockGds: z.number().int().min(0).max(100).optional(),
        mockPis: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await getMyProfile(ctx.user.id);

      // Convert new base64 image uploads into file_assets and collect stale assets to remove.
      const staleAssetIds: number[] = [];
      async function processImage(field: "profileImage" | "coverImage") {
        const value = input[field];
        if (value === undefined) return;

        const existingRef = parseAssetRef(existing?.[field] as string | null | undefined);
        if (existingRef && (value === "" || !isDataUrl(value))) {
          staleAssetIds.push(existingRef);
        }

        if (value === "") return null;
        if (!isDataUrl(value)) return value;

        // If the uploaded image matches what's already stored in MinIO, keep it.
        const existingValue = existing?.[field] as string | null | undefined;
        if (existingValue === value) return existingValue;

        const url = await uploadBase64Image(
          ctx.user.id,
          value,
          `${field === "profileImage" ? "profile" : "cover"}.png`,
        );
        if (existingRef) staleAssetIds.push(existingRef);
        return url;
      }

      const [profileImage, coverImage] = await Promise.all([
        processImage("profileImage"),
        processImage("coverImage"),
      ]);

      const set: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (key === "profileImage") {
          set[key] = profileImage;
        } else if (key === "coverImage") {
          set[key] = coverImage;
        } else if (value === "") {
          set[key] = null;
        } else if (value !== undefined) {
          set[key] = value;
        }
      }

      if (typeof set.publicSlug === "string" && set.publicSlug) {
        const desired = slugify(set.publicSlug);
        const conflict = await db
          .select({ userId: mentorProfiles.userId })
          .from(mentorProfiles)
          .where(eq(mentorProfiles.publicSlug, desired))
          .limit(1)
          .then((r) => r[0] ?? null);
        if (conflict && conflict.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That public slug is already taken.",
          });
        }
        set.publicSlug = desired;
      }

      if (!existing) {
        await db.insert(mentorProfiles).values({
          userId: ctx.user.id,
          ...set,
          status: "onboarding",
          onboardingStatus: "in_progress",
        });
      } else {
        await db
          .update(mentorProfiles)
          .set({ ...set, updatedAt: new Date() })
          .where(eq(mentorProfiles.id, existing.id));
      }

      // Clean up replaced file_assets after the profile is updated.
      if (staleAssetIds.length) {
        await db.delete(fileAssets).where(inArray(fileAssets.id, staleAssetIds));
      }

      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  // ----------------------------------------------------------- onboarding
  myOnboarding: expert.query(async ({ ctx }) => {
    return ensureOnboarding(ctx.user.id);
  }),

  updateOnboarding: expert
    .input(
      z.object({
        currentStep: z.enum([
          "account",
          "resume",
          "resume_review",
          "profile",
          "experience",
          "education",
          "verification",
          "complete",
        ]),
        status: z.enum(["not_started", "in_progress", "completed"]).optional(),
        lastCompletedStep: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const existing = await ensureOnboarding(ctx.user.id);
      const set: Record<string, unknown> = {
        currentStep: input.currentStep,
        updatedAt: new Date(),
      };
      if (input.status) set.status = input.status;
      if (input.lastCompletedStep) set.lastCompletedStep = input.lastCompletedStep;
      if (input.status === "completed" && !existing.completedAt) set.completedAt = new Date();

      await db
        .update(expertOnboarding)
        .set(set)
        .where(eq(expertOnboarding.id, existing.id));

      const profileStatus = input.status === "completed" ? "active" : "onboarding";
      const onboardingStatus = input.status ?? existing.status;
      await db
        .update(mentorProfiles)
        .set({
          onboardingStatus,
          status: profileStatus,
          updatedAt: new Date(),
        })
        .where(eq(mentorProfiles.userId, ctx.user.id));

      return { success: true };
    }),

  // -------------------------------------------------------------- resume
  uploadResume: expert
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        fileMime: z.string().max(128),
        fileBase64: z.string().min(1).max(12_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (!ACCEPTED_RESUME_MIMES.includes(input.fileMime)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Unsupported file type. Accepted: PDF, TXT, DOC, DOCX.",
        });
      }

      const approxBytes = Math.floor(input.fileBase64.length * 0.75);
      if (approxBytes > MAX_RESUME_BYTES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Resume too large — maximum 8 MB.",
        });
      }

      // Create file asset.
      const [fileAsset] = await db
        .insert(fileAssets)
        .values({
          ownerId: ctx.user.id,
          fileName: input.fileName,
          mimeType: input.fileMime,
          size: approxBytes,
          provider: "database",
          data: input.fileBase64,
        })
        .$returningId();

      // Delete previous resume + file asset if any.
      const previous = await db
        .select()
        .from(expertResumes)
        .where(eq(expertResumes.userId, ctx.user.id))
        .limit(1);
      if (previous[0]) {
        await db
          .delete(fileAssets)
          .where(eq(fileAssets.id, previous[0].fileAssetId));
        await db
          .delete(expertResumes)
          .where(eq(expertResumes.id, previous[0].id));
      }

      // Parse via Phase 1 provider.
      const parseResult = await regexParser.parse(input.fileBase64, input.fileMime);

      const [resume] = await db
        .insert(expertResumes)
        .values({
          userId: ctx.user.id,
          fileAssetId: fileAsset.id,
          status: parseResult.success ? (parseResult.partial ? "parsed" : "parsed") : "failed",
          parserStatus: parseResult.partial
            ? "partial"
            : parseResult.success
              ? "success"
              : "failed",
          parserProvider: regexParser.name,
          rawText: parseResult.rawText,
          parsedData: parseResult.parsed,
          parsingError: parseResult.error,
        })
        .$returningId();

      return {
        success: true,
        resumeId: resume.id,
        parserStatus: parseResult.partial ? "partial" : parseResult.success ? "success" : "failed",
        parsed: parseResult.parsed,
        error: parseResult.error,
      };
    }),

  getResume: expert.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ resume: expertResumes, asset: fileAssets })
      .from(expertResumes)
      .innerJoin(fileAssets, eq(fileAssets.id, expertResumes.fileAssetId))
      .where(eq(expertResumes.userId, ctx.user.id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      ...row.resume,
      fileName: row.asset.fileName,
      fileMime: row.asset.mimeType,
      fileSize: row.asset.size,
    };
  }),

  reparseResume: expert.mutation(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({ resume: expertResumes, asset: fileAssets })
      .from(expertResumes)
      .innerJoin(fileAssets, eq(fileAssets.id, expertResumes.fileAssetId))
      .where(eq(expertResumes.userId, ctx.user.id))
      .limit(1);
    const row = rows[0];
    if (!row || !row.asset.data) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No resume found" });
    }

    const parseResult = await regexParser.parse(row.asset.data, row.asset.mimeType);

    await db
      .update(expertResumes)
      .set({
        rawText: parseResult.rawText,
        parsedData: parseResult.parsed,
        parserStatus: parseResult.partial
          ? "partial"
          : parseResult.success
            ? "success"
            : "failed",
        parsingError: parseResult.error,
        parsedAt: new Date(),
        status: parseResult.success ? "parsed" : "failed",
      })
      .where(eq(expertResumes.id, row.resume.id));

    return {
      success: true,
      parserStatus: parseResult.partial ? "partial" : parseResult.success ? "success" : "failed",
      parsed: parseResult.parsed,
      error: parseResult.error,
    };
  }),

  deleteResume: expert.mutation(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select()
      .from(expertResumes)
      .where(eq(expertResumes.userId, ctx.user.id))
      .limit(1);
    if (!rows[0]) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No resume found" });
    }
    await db.delete(fileAssets).where(eq(fileAssets.id, rows[0].fileAssetId));
    await db.delete(expertResumes).where(eq(expertResumes.id, rows[0].id));
    return { success: true };
  }),

  uploadImage: expert
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        fileMime: z.string().max(128),
        fileBase64: z.string().min(1).max(8_000_000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const base64 = input.fileBase64.includes(",") ? input.fileBase64.split(",")[1] : input.fileBase64;
      const url = await uploadBase64Image(ctx.user.id, base64, input.fileName);
      return { url };
    }),

  confirmParsedProfile: expert
    .input(
      z.object({
        identity: z
          .object({
            name: z.string().optional().or(z.literal("")),
            email: z.string().email().optional().or(z.literal("")),
            phone: z.string().optional().or(z.literal("")),
          })
          .optional(),
        links: z
          .object({
            linkedin: z.string().optional().or(z.literal("")),
            github: z.string().optional().or(z.literal("")),
            portfolio: z.string().optional().or(z.literal("")),
            website: z.string().optional().or(z.literal("")),
          })
          .optional(),
        summary: z.string().optional().or(z.literal("")),
        headline: z.string().optional().or(z.literal("")),
        currentRole: z.string().optional().or(z.literal("")),
        currentCompany: z.string().optional().or(z.literal("")),
        experience: z
          .array(
            z.object({
              company: z.string().min(1),
              role: z.string().optional().or(z.literal("")),
              location: z.string().optional().or(z.literal("")),
              startDate: z.string().optional().or(z.literal("")),
              endDate: z.string().optional().or(z.literal("")),
              isCurrent: z.boolean().optional(),
              description: z.string().optional().or(z.literal("")),
            }),
          )
          .optional(),
        education: z
          .array(
            z.object({
              institution: z.string().min(1),
              degree: z.string().optional().or(z.literal("")),
              fieldOfStudy: z.string().optional().or(z.literal("")),
              startDate: z.string().optional().or(z.literal("")),
              endDate: z.string().optional().or(z.literal("")),
              grade: z.string().optional().or(z.literal("")),
              description: z.string().optional().or(z.literal("")),
            }),
          )
          .optional(),
        skills: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const profile = await getMyProfile(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Expert profile not found" });
      }

      const set: Record<string, unknown> = {};
      if (input.headline !== undefined && input.headline !== "")
        set.headline = input.headline;
      if (input.summary !== undefined && input.summary !== "") set.bio = input.summary;
      if (input.currentRole !== undefined && input.currentRole !== "")
        set.currentRole = input.currentRole;
      if (input.currentCompany !== undefined && input.currentCompany !== "")
        set.company = input.currentCompany;
      if (input.links?.linkedin !== undefined && input.links.linkedin !== "")
        set.linkedinUrl = input.links.linkedin;
      if (input.links?.github !== undefined && input.links.github !== "")
        set.githubUrl = input.links.github;
      if (input.links?.portfolio !== undefined && input.links.portfolio !== "")
        set.portfolioUrl = input.links.portfolio;
      if (input.links?.website !== undefined && input.links.website !== "")
        set.websiteUrl = input.links.website;
      if (input.skills?.length) set.expertise = input.skills.join(", ");

      await db
        .update(mentorProfiles)
        .set({ ...set, updatedAt: new Date() })
        .where(eq(mentorProfiles.id, profile.id));

      // Replace experience entries with confirmed selection.
      if (input.experience) {
        await db
          .delete(expertExperience)
          .where(eq(expertExperience.userId, ctx.user.id));
        if (input.experience.length) {
          await db.insert(expertExperience).values(
            input.experience.map((e, i) => ({
              userId: ctx.user.id,
              company: e.company,
              role: e.role || null,
              location: e.location || null,
              startDate: e.startDate || null,
              endDate: e.endDate || null,
              isCurrent: e.isCurrent ?? false,
              description: e.description || null,
              displayOrder: i,
            })),
          );
        }
      }

      // Replace education entries with confirmed selection.
      if (input.education) {
        await db
          .delete(expertEducation)
          .where(eq(expertEducation.userId, ctx.user.id));
        if (input.education.length) {
          await db.insert(expertEducation).values(
            input.education.map((e, i) => ({
              userId: ctx.user.id,
              institution: e.institution,
              degree: e.degree || null,
              fieldOfStudy: e.fieldOfStudy || null,
              startDate: e.startDate || null,
              endDate: e.endDate || null,
              grade: e.grade || null,
              description: e.description || null,
              displayOrder: i,
            })),
          );
        }
      }

      await db
        .update(expertResumes)
        .set({ status: "verified", verifiedAt: new Date() })
        .where(eq(expertResumes.userId, ctx.user.id));

      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  // ----------------------------------------------------------- experience
  myExperience: expert.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(expertExperience)
      .where(eq(expertExperience.userId, ctx.user.id))
      .orderBy(expertExperience.displayOrder);
  }),

  createExperience: expert
    .input(
      z.object({
        company: z.string().min(1).max(255),
        role: z.string().max(255).optional(),
        employmentType: z.string().max(64).optional(),
        location: z.string().max(128).optional(),
        startDate: z.string().max(32).optional(),
        endDate: z.string().max(32).optional(),
        isCurrent: z.boolean().optional(),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [max] = await db
        .select({ n: expertExperience.displayOrder })
        .from(expertExperience)
        .where(eq(expertExperience.userId, ctx.user.id))
        .orderBy(desc(expertExperience.displayOrder))
        .limit(1);
      const order = (max?.n ?? -1) + 1;
      const [created] = await db
        .insert(expertExperience)
        .values({
          userId: ctx.user.id,
          ...input,
          displayOrder: order,
        })
        .$returningId();
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, id: created.id, completion };
    }),

  updateExperience: expert
    .input(
      z.object({
        id: z.number(),
        company: z.string().min(1).max(255).optional(),
        role: z.string().max(255).optional().or(z.literal("")),
        employmentType: z.string().max(64).optional().or(z.literal("")),
        location: z.string().max(128).optional().or(z.literal("")),
        startDate: z.string().max(32).optional().or(z.literal("")),
        endDate: z.string().max(32).optional().or(z.literal("")),
        isCurrent: z.boolean().optional(),
        description: z.string().max(2000).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const set: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (key === "id") continue;
        if (value === "") {
          set[key] = null;
        } else if (value !== undefined) {
          set[key] = value;
        }
      }
      await db
        .update(expertExperience)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(expertExperience.id, input.id), eq(expertExperience.userId, ctx.user.id)));
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  deleteExperience: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(expertExperience)
        .where(and(eq(expertExperience.id, input.id), eq(expertExperience.userId, ctx.user.id)));
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  reorderExperience: expert
    .input(z.array(z.object({ id: z.number(), displayOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ids = input.map((i) => i.id);
      const rows = await db
        .select({ id: expertExperience.id })
        .from(expertExperience)
        .where(and(eq(expertExperience.userId, ctx.user.id), inArray(expertExperience.id, ids)));
      if (rows.length !== input.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid experience ids" });
      }
      for (const item of input) {
        await db
          .update(expertExperience)
          .set({ displayOrder: item.displayOrder })
          .where(eq(expertExperience.id, item.id));
      }
      return { success: true };
    }),

  // ------------------------------------------------------------ education
  myEducation: expert.query(async ({ ctx }) => {
    return getDb()
      .select()
      .from(expertEducation)
      .where(eq(expertEducation.userId, ctx.user.id))
      .orderBy(expertEducation.displayOrder);
  }),

  createEducation: expert
    .input(
      z.object({
        institution: z.string().min(1).max(255),
        degree: z.string().max(255).optional(),
        fieldOfStudy: z.string().max(255).optional(),
        startDate: z.string().max(32).optional(),
        endDate: z.string().max(32).optional(),
        grade: z.string().max(64).optional(),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [max] = await db
        .select({ n: expertEducation.displayOrder })
        .from(expertEducation)
        .where(eq(expertEducation.userId, ctx.user.id))
        .orderBy(desc(expertEducation.displayOrder))
        .limit(1);
      const order = (max?.n ?? -1) + 1;
      const [created] = await db
        .insert(expertEducation)
        .values({
          userId: ctx.user.id,
          ...input,
          displayOrder: order,
        })
        .$returningId();
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, id: created.id, completion };
    }),

  updateEducation: expert
    .input(
      z.object({
        id: z.number(),
        institution: z.string().min(1).max(255).optional(),
        degree: z.string().max(255).optional().or(z.literal("")),
        fieldOfStudy: z.string().max(255).optional().or(z.literal("")),
        startDate: z.string().max(32).optional().or(z.literal("")),
        endDate: z.string().max(32).optional().or(z.literal("")),
        grade: z.string().max(64).optional().or(z.literal("")),
        description: z.string().max(2000).optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const set: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        if (key === "id") continue;
        if (value === "") {
          set[key] = null;
        } else if (value !== undefined) {
          set[key] = value;
        }
      }
      await db
        .update(expertEducation)
        .set({ ...set, updatedAt: new Date() })
        .where(and(eq(expertEducation.id, input.id), eq(expertEducation.userId, ctx.user.id)));
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  deleteEducation: expert
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(expertEducation)
        .where(and(eq(expertEducation.id, input.id), eq(expertEducation.userId, ctx.user.id)));
      const completion = await computeAndPersistCompletion(ctx.user.id);
      return { success: true, completion };
    }),

  reorderEducation: expert
    .input(z.array(z.object({ id: z.number(), displayOrder: z.number() })))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const ids = input.map((i) => i.id);
      const rows = await db
        .select({ id: expertEducation.id })
        .from(expertEducation)
        .where(and(eq(expertEducation.userId, ctx.user.id), inArray(expertEducation.id, ids)));
      if (rows.length !== input.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Invalid education ids" });
      }
      for (const item of input) {
        await db
          .update(expertEducation)
          .set({ displayOrder: item.displayOrder })
          .where(eq(expertEducation.id, item.id));
      }
      return { success: true };
    }),

  // ---------------------------------------------------------- verification
  submitVerification: expert.mutation(async ({ ctx }) => {
    const db = getDb();
    const profile = await getMyProfile(ctx.user.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
    }

    const completion = await computeAndPersistCompletion(ctx.user.id);
    if (completion.percentage < 60) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please complete at least 60% of your profile before submitting for verification.",
      });
    }

    const pending = await db
      .select()
      .from(expertVerifications)
      .where(
        and(
          eq(expertVerifications.userId, ctx.user.id),
          eq(expertVerifications.status, "pending"),
        ),
      )
      .limit(1);
    if (pending[0]) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You already have a verification pending review.",
      });
    }

    await db.insert(expertVerifications).values({
      userId: ctx.user.id,
      status: "pending",
      submittedAt: new Date(),
    });

    const onboarding = await ensureOnboarding(ctx.user.id);
    await db
      .update(expertOnboarding)
      .set({
        status: "completed",
        currentStep: "verification",
        lastCompletedStep: "verification",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(expertOnboarding.id, onboarding.id));

    await db
      .update(mentorProfiles)
      .set({
        verificationStatus: "pending",
        status: "active",
        onboardingStatus: "completed",
      })
      .where(eq(mentorProfiles.userId, ctx.user.id));

    return { success: true };
  }),
});
