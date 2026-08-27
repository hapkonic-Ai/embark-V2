import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Session } from "@contracts/constants";
import { users, mentorProfiles } from "@db/schema";
import { getDb } from "../queries/connection";
import { getSessionCookieOptions } from "../lib/cookies";
import { signSessionToken } from "../kimi/session";
import { env } from "../lib/env";
import { createRouter, publicQuery, authedQuery } from "../middleware";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

async function issueSession(
  resHeaders: Headers,
  reqHeaders: Headers,
  unionId: string,
) {
  const token = await signSessionToken({ unionId, clientId: env.appId });
  const opts = getSessionCookieOptions(reqHeaders);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

const creds = z.object({
  email: z.string().email().max(320),
  password: z.string().min(6).max(128),
});

const linkedinRegex = /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
const TERMS_VERSION = "1.0";

export const accountRouter = createRouter({
  register: publicQuery
    .input(
      creds.extend({
        name: z.string().min(2).max(120),
        phone: z.string().max(32).optional(),
        role: z.enum(["candidate", "mentor", "campus"]).default("candidate"),
        linkedinUrl: z.string().regex(linkedinRegex, "Enter a valid LinkedIn profile URL like https://linkedin.com/in/your-handle").optional(),
        termsAccepted: z.boolean().refine((v) => v === true, "You must accept the Terms & Conditions"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase().trim();
      const unionId = `email:${email}`;
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.unionId, unionId))
        .limit(1);
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }
      await db.insert(users).values({
        unionId,
        name: input.name.trim(),
        email,
        phone: input.phone,
        linkedinUrl: input.linkedinUrl,
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        passwordHash: hashPassword(input.password),
        role: input.role,
        lastSignInAt: new Date(),
      });
      const created = await db
        .select()
        .from(users)
        .where(eq(users.unionId, unionId))
        .limit(1);
      const user = created[0];
      if (input.role === "mentor") {
        const handle = input.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        await db.insert(mentorProfiles).values({
          userId: user.id,
          publicSlug: `${handle}-${user.id}`,
          linkedinUrl: input.linkedinUrl,
        });
      }
      await issueSession(ctx.resHeaders, ctx.req.headers, unionId);
      const { passwordHash: _ph, ...safe } = user;
      return safe;
    }),

  login: publicQuery.input(creds).mutation(async ({ ctx, input }) => {
    const db = getDb();
    const unionId = `email:${input.email.toLowerCase().trim()}`;
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.unionId, unionId))
      .limit(1);
    const user = rows[0];
    if (
      !user ||
      !user.passwordHash ||
      !verifyPassword(input.password, user.passwordHash)
    ) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password.",
      });
    }
    if (!user.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account has been deactivated. Contact support.",
      });
    }
    await db
      .update(users)
      .set({ lastSignInAt: new Date() })
      .where(eq(users.id, user.id));
    await issueSession(ctx.resHeaders, ctx.req.headers, unionId);
    const { passwordHash: _ph, ...safe } = user;
    return safe;
  }),

  updateProfile: authedQuery
    .input(
      z.object({
        name: z.string().min(2).max(120).optional(),
        phone: z.string().max(32).optional(),
        linkedinUrl: z.string().regex(linkedinRegex, "Enter a valid LinkedIn URL").optional().or(z.literal("")),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const set: Record<string, unknown> = { ...input };
      if (input.linkedinUrl === "") set.linkedinUrl = null;
      await getDb()
        .update(users)
        .set(set)
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  acceptTerms: authedQuery
    .input(z.object({ version: z.string().max(16) }))
    .mutation(async ({ ctx, input }) => {
      await getDb()
        .update(users)
        .set({ termsAcceptedAt: new Date(), termsVersion: input.version })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
