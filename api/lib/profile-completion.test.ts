import { describe, it, expect } from "vitest";
import { calculateProfileCompletion } from "./profile-completion";

describe("calculateProfileCompletion", () => {
  it("returns 0 for an empty profile", () => {
    const result = calculateProfileCompletion({}, 0, 0);
    expect(result.percentage).toBe(0);
    expect(result.missingRequiredSections.length).toBeGreaterThan(0);
  });

  it("marks required sections as completed when profile is filled", () => {
    const result = calculateProfileCompletion(
      {
        displayName: "Jane Doe",
        headline: "Product Manager",
        bio: "Experienced PM.",
        profileImage: "https://example.com/photo.jpg",
        expertise: "Product, Strategy",
        location: "Bangalore",
        linkedinUrl: "https://linkedin.com/in/janedoe",
        portfolioUrl: "https://janedoe.com",
        coverImage: "https://example.com/cover.jpg",
      },
      1,
      1,
    );
    expect(result.percentage).toBe(100);
    expect(result.missingRequiredSections).toEqual([]);
    expect(result.recommendedSections).toEqual([]);
  });

  it("treats education as recommended until present", () => {
    const result = calculateProfileCompletion(
      {
        displayName: "Jane Doe",
        headline: "PM",
        bio: "Bio",
        profileImage: "x",
        expertise: "a",
        location: "y",
      },
      1,
      0,
    );
    expect(result.recommendedSections).toContain("Education");
    expect(result.completedSections).not.toContain("Education");
  });
});
