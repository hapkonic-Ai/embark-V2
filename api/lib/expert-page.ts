import { and, eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import {
  expertEducation,
  expertExperience,
  expertPageConfigs,
  expertPages,
  expertPageSections,
  mentorProfiles,
  mentorServices,
  users,
} from "@db/schema";
import { resolveAssetFields } from "../lib/file-assets";

export const DEFAULT_SECTION_TYPES = [
  "hero",
  "about",
  "experience",
  "education",
  "skills",
  "services",
  "social_links",
  "cta",
] as const;

export type SectionType = (typeof DEFAULT_SECTION_TYPES)[number];

const DEFAULT_CONFIG = {
  theme: "professional",
  accentColor: "#F97316",
  background: "light",
  profileImageStyle: "rounded",
  coverStyle: "gradient",
  buttonStyle: "rounded",
  ctaType: "none",
  ctaLabel: null as string | null,
  ctaTarget: null as string | null,
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function generateUniqueSlug(base: string): Promise<string> {
  const db = getDb();
  const candidate = slugify(base).slice(0, 60) || "expert";
  const slug = candidate;

  const [existing] = await db
    .select({ id: expertPages.id })
    .from(expertPages)
    .where(eq(expertPages.slug, slug))
    .limit(1);

  if (!existing) return slug;

  // Append a short random suffix to avoid collisions.
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug.slice(0, 55)}-${suffix}`;
}

interface VisibilityInputs {
  bio?: string | null;
  experienceCount: number;
  educationCount: number;
  expertise?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  websiteUrl?: string | null;
  publishedServiceCount?: number;
}

export function defaultSectionVisibility(type: SectionType, inputs: VisibilityInputs): boolean {
  switch (type) {
    case "hero":
      return true;
    case "about":
      return !!inputs.bio;
    case "experience":
      return inputs.experienceCount > 0;
    case "education":
      return inputs.educationCount > 0;
    case "skills":
      return !!inputs.expertise;
    case "services":
      return (inputs.publishedServiceCount ?? 0) > 0;
    case "social_links":
      return !!(
        inputs.linkedinUrl ||
        inputs.githubUrl ||
        inputs.portfolioUrl ||
        inputs.websiteUrl
      );
    case "cta":
      return false;
    default:
      return true;
  }
}

export async function getOrCreateExpertPage(userId: number) {
  const db = getDb();

  const existingPage = await db
    .select()
    .from(expertPages)
    .where(eq(expertPages.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingPage) return existingPage;

  const [profile] = await db
    .select()
    .from(mentorProfiles)
    .where(eq(mentorProfiles.userId, userId))
    .limit(1);

  const displayName = profile?.displayName || profile?.headline || "expert";
  const baseSlug = profile?.publicSlug || displayName;
  const slug = await generateUniqueSlug(baseSlug);

  const [experiences, educations, publishedServices] = await Promise.all([
    db.select({ id: expertExperience.id }).from(expertExperience).where(eq(expertExperience.userId, userId)),
    db.select({ id: expertEducation.id }).from(expertEducation).where(eq(expertEducation.userId, userId)),
    db
      .select({ id: mentorServices.id })
      .from(mentorServices)
      .where(
        and(
          eq(mentorServices.userId, userId),
          eq(mentorServices.status, "published"),
        ),
      ),
  ]);

  const visibilityInputs: VisibilityInputs = {
    bio: profile?.bio,
    experienceCount: experiences.length,
    educationCount: educations.length,
    expertise: profile?.expertise,
    linkedinUrl: profile?.linkedinUrl,
    githubUrl: profile?.githubUrl,
    portfolioUrl: profile?.portfolioUrl,
    websiteUrl: profile?.websiteUrl,
    publishedServiceCount: publishedServices.length,
  };

  await db.transaction(async (tx) => {
    const [page] = await tx
      .insert(expertPages)
      .values({
        userId,
        slug,
        status: "draft",
      })
      .$returningId();

    await tx.insert(expertPageConfigs).values({
      pageId: page.id,
      ...DEFAULT_CONFIG,
    });

    const sectionValues = DEFAULT_SECTION_TYPES.map((type, index) => ({
      pageId: page.id,
      sectionType: type,
      displayOrder: index,
      isVisible: defaultSectionVisibility(type, visibilityInputs),
      config: {},
    }));

    await tx.insert(expertPageSections).values(sectionValues);
  });

  const created = await db
    .select()
    .from(expertPages)
    .where(eq(expertPages.userId, userId))
    .limit(1)
    .then((rows) => rows[0]!);

  return created;
}

export async function getExpertPageWithDetails(userId: number) {
  const db = getDb();
  const page = await getOrCreateExpertPage(userId);

  const [config, sections, services] = await Promise.all([
    db
      .select()
      .from(expertPageConfigs)
      .where(eq(expertPageConfigs.pageId, page.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(expertPageSections)
      .where(eq(expertPageSections.pageId, page.id))
      .orderBy(expertPageSections.displayOrder),
    db
      .select()
      .from(mentorServices)
      .where(eq(mentorServices.userId, userId))
      .orderBy(mentorServices.displayOrder),
  ]);

  return { page, config, sections, services };
}

export async function getPublishedExpertPageBySlug(slug: string) {
  const db = getDb();
  const rows = await db
    .select({
      page: expertPages,
      profile: mentorProfiles,
      user: { id: mentorProfiles.userId, name: mentorProfiles.displayName, email: users.email },
    })
    .from(expertPages)
    .innerJoin(mentorProfiles, eq(mentorProfiles.userId, expertPages.userId))
    .innerJoin(users, eq(users.id, expertPages.userId))
    .where(eq(expertPages.slug, slug))
    .limit(1);

  const row = rows[0];
  if (!row || row.page.status !== "published") return null;

  const [config, sections, experiences, educations, services] = await Promise.all([
    db
      .select()
      .from(expertPageConfigs)
      .where(eq(expertPageConfigs.pageId, row.page.id))
      .limit(1)
      .then((r) => r[0] ?? null),
    db
      .select()
      .from(expertPageSections)
      .where(eq(expertPageSections.pageId, row.page.id))
      .orderBy(expertPageSections.displayOrder),
    db
      .select()
      .from(expertExperience)
      .where(eq(expertExperience.userId, row.page.userId))
      .orderBy(expertExperience.displayOrder),
    db
      .select()
      .from(expertEducation)
      .where(eq(expertEducation.userId, row.page.userId))
      .orderBy(expertEducation.displayOrder),
    db
      .select()
      .from(mentorServices)
      .where(
        and(
          eq(mentorServices.userId, row.page.userId),
          eq(mentorServices.status, "published"),
        ),
      )
      .orderBy(mentorServices.displayOrder),
  ]);

  const resolvedProfile = await resolveAssetFields(row.profile, ["profileImage", "coverImage"], db);

  return {
    page: row.page,
    config,
    sections,
    profile: resolvedProfile,
    user: row.user,
    experiences,
    educations,
    services,
  };
}
