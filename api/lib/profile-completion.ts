import type { MentorProfile } from "@contracts/types";

export type ProfileCompletion = {
  percentage: number;
  completedSections: string[];
  missingRequiredSections: string[];
  recommendedSections: string[];
};

const REQUIRED = [
  { key: "basic_info", label: "Basic information" },
  { key: "profile_photo", label: "Profile photo" },
  { key: "headline", label: "Professional headline" },
  { key: "about", label: "About / bio" },
  { key: "experience", label: "At least one experience" },
  { key: "expertise", label: "Skills / expertise" },
  { key: "location", label: "Location / timezone" },
];

const RECOMMENDED = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "portfolio", label: "Portfolio / website" },
  { key: "education", label: "Education" },
  { key: "cover_image", label: "Cover image" },
];

export function calculateProfileCompletion(
  profile: Partial<MentorProfile> | null,
  experienceCount: number,
  educationCount: number,
): ProfileCompletion {
  const completed: string[] = [];
  const missing: string[] = [];
  const recommended: string[] = [];

  const p = profile ?? {};

  // Basic info
  if ((p.displayName?.trim() || p.headline?.trim()) && p.bio?.trim()) {
    completed.push("Basic information");
  } else {
    missing.push("Basic information");
  }

  // Profile photo
  if (p.profileImage?.trim()) {
    completed.push("Profile photo");
  } else {
    missing.push("Profile photo");
  }

  // Headline
  if (p.headline?.trim()) {
    completed.push("Professional headline");
  } else {
    missing.push("Professional headline");
  }

  // About
  if (p.bio?.trim()) {
    completed.push("About / bio");
  } else {
    missing.push("About / bio");
  }

  // Experience
  if (experienceCount > 0) {
    completed.push("At least one experience");
  } else {
    missing.push("At least one experience");
  }

  // Expertise/skills
  if ((p.expertise?.trim() || p.industries?.trim()) && (p.expertise?.trim() ?? "").length > 2) {
    completed.push("Skills / expertise");
  } else {
    missing.push("Skills / expertise");
  }

  // Location/timezone
  if (p.location?.trim() || p.country?.trim() || p.timezone?.trim()) {
    completed.push("Location / timezone");
  } else {
    missing.push("Location / timezone");
  }

  // Recommended
  if (p.linkedinUrl?.trim()) {
    completed.push("LinkedIn");
  } else {
    recommended.push("LinkedIn");
  }

  if (p.portfolioUrl?.trim() || p.websiteUrl?.trim() || p.githubUrl?.trim()) {
    completed.push("Portfolio / website");
  } else {
    recommended.push("Portfolio / website");
  }

  if (educationCount > 0) {
    completed.push("Education");
  } else {
    recommended.push("Education");
  }

  if (p.coverImage?.trim()) {
    completed.push("Cover image");
  } else {
    recommended.push("Cover image");
  }

  const totalWeight = REQUIRED.length + RECOMMENDED.length;
  const completedWeight = completed.length;
  const percentage = Math.min(100, Math.round((completedWeight / totalWeight) * 100));

  return {
    percentage,
    completedSections: completed,
    missingRequiredSections: missing,
    recommendedSections: recommended,
  };
}
