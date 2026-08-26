import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./account";

describe("account password helpers", () => {
  it("hashes and verifies a password", () => {
    const hash = hashPassword("Embark@123");
    expect(hash).toContain(":");
    expect(verifyPassword("Embark@123", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects malformed hashes", () => {
    expect(verifyPassword("Embark@123", "notahash")).toBe(false);
    expect(verifyPassword("Embark@123", "")).toBe(false);
  });
});

describe("seeded demo accounts", () => {
  it("has all four roles present in the database", async () => {
    const { getDb } = await import("../queries/connection");
    const { users } = await import("@db/schema");
    const { inArray } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(inArray(users.email, [
        "superadmin@embark.in",
        "admin@embark.in",
        "candidate@embark.in",
        "rohan@embark.in",
      ]));
    const roles = new Set(rows.map((r) => r.role));
    expect(roles).toContain("superadmin");
    expect(roles).toContain("admin");
    expect(roles).toContain("candidate");
    expect(roles).toContain("mentor");
  });
});
