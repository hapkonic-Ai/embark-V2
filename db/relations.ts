import { relations } from "drizzle-orm";
import {
  users,
  mentorProfiles,
  mentorships,
  mockSessions,
  playbooks,
  playbookPurchases,
  events,
  submissions,
  guestLectureRequests,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  mentorProfile: one(mentorProfiles, {
    fields: [users.id],
    references: [mentorProfiles.userId],
  }),
  mentorships: many(mentorships),
  playbookPurchases: many(playbookPurchases),
  submissions: many(submissions),
  createdEvents: many(events),
  guestLectureRequests: many(guestLectureRequests),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorProfiles.userId],
    references: [users.id],
  }),
  mentorships: many(mentorships),
}));

export const mentorshipsRelations = relations(mentorships, ({ one, many }) => ({
  candidate: one(users, {
    fields: [mentorships.candidateId],
    references: [users.id],
  }),
  mentorProfile: one(mentorProfiles, {
    fields: [mentorships.mentorProfileId],
    references: [mentorProfiles.id],
  }),
  mockSessions: many(mockSessions),
}));

export const mockSessionsRelations = relations(mockSessions, ({ one }) => ({
  mentorship: one(mentorships, {
    fields: [mockSessions.mentorshipId],
    references: [mentorships.id],
  }),
}));

export const playbooksRelations = relations(playbooks, ({ many }) => ({
  purchases: many(playbookPurchases),
}));

export const playbookPurchasesRelations = relations(playbookPurchases, ({ one }) => ({
  user: one(users, {
    fields: [playbookPurchases.userId],
    references: [users.id],
  }),
  playbook: one(playbooks, {
    fields: [playbookPurchases.playbookId],
    references: [playbooks.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  event: one(events, {
    fields: [submissions.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));

export const guestLectureRequestsRelations = relations(guestLectureRequests, ({ one }) => ({
  campus: one(users, {
    fields: [guestLectureRequests.campusId],
    references: [users.id],
  }),
  mentorProfile: one(mentorProfiles, {
    fields: [guestLectureRequests.mentorProfileId],
    references: [mentorProfiles.id],
  }),
}));
