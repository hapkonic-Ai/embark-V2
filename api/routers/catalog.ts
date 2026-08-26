import { desc, eq, sql, and, ne } from "drizzle-orm";
import { z } from "zod";
import {
  colleges,
  events,
  mentorProfiles,
  playbooks,
  submissions,
  users,
} from "@db/schema";
import { getDb } from "../queries/connection";
import { createRouter, publicQuery } from "../middleware";

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
    return db
      .select({
        profile: mentorProfiles,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .where(
        and(eq(mentorProfiles.isVerified, true), eq(users.isActive, true)),
      )
      .orderBy(desc(mentorProfiles.createdAt));
  }),

  mentor: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ profile: mentorProfiles, name: users.name, email: users.email })
        .from(mentorProfiles)
        .innerJoin(users, eq(users.id, mentorProfiles.userId))
        .where(eq(mentorProfiles.id, input.id))
        .limit(1);
      return rows[0] ?? null;
    }),

  mentorBySlug: publicQuery
    .input(z.object({ slug: z.string().max(64) }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select({ profile: mentorProfiles, name: users.name, email: users.email })
        .from(mentorProfiles)
        .innerJoin(users, eq(users.id, mentorProfiles.userId))
        .where(eq(mentorProfiles.publicSlug, input.slug))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      if (!row.profile.isVerified || !row.email) {
        return { ...row, email: null };
      }
      return row;
    }),

  playbooks: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(playbooks)
      .where(eq(playbooks.isPublished, true))
      .orderBy(desc(playbooks.createdAt));
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
});
