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
  expertOnboarding,
  expertResumes,
  expertExperience,
  expertEducation,
  expertVerifications,
  fileAssets,
  expertPages,
  expertPageConfigs,
  expertPageSections,
  mentorServices,
  mentorServicePackages,
  mentorServicePackageItems,
  expertAvailabilityRules,
  expertAvailabilityExceptions,
  expertBookings,
  sessions,
  orders,
  payments,
  expertNotes,
  reviews,
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
  expertOnboarding: one(expertOnboarding, {
    fields: [users.id],
    references: [expertOnboarding.userId],
  }),
  expertResume: one(expertResumes, {
    fields: [users.id],
    references: [expertResumes.userId],
  }),
  expertExperience: many(expertExperience),
  expertEducation: many(expertEducation),
  expertVerifications: many(expertVerifications),
  ownedFileAssets: many(fileAssets),
  expertPage: one(expertPages, {
    fields: [users.id],
    references: [expertPages.userId],
  }),
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

export const expertOnboardingRelations = relations(expertOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [expertOnboarding.userId],
    references: [users.id],
  }),
}));

export const fileAssetsRelations = relations(fileAssets, ({ one }) => ({
  owner: one(users, {
    fields: [fileAssets.ownerId],
    references: [users.id],
  }),
}));

export const expertResumesRelations = relations(expertResumes, ({ one }) => ({
  user: one(users, {
    fields: [expertResumes.userId],
    references: [users.id],
  }),
  fileAsset: one(fileAssets, {
    fields: [expertResumes.fileAssetId],
    references: [fileAssets.id],
  }),
}));

export const expertExperienceRelations = relations(expertExperience, ({ one }) => ({
  user: one(users, {
    fields: [expertExperience.userId],
    references: [users.id],
  }),
}));

export const expertEducationRelations = relations(expertEducation, ({ one }) => ({
  user: one(users, {
    fields: [expertEducation.userId],
    references: [users.id],
  }),
}));

export const expertVerificationsRelations = relations(expertVerifications, ({ one }) => ({
  user: one(users, {
    fields: [expertVerifications.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [expertVerifications.reviewedBy],
    references: [users.id],
  }),
}));


export const expertPagesRelations = relations(expertPages, ({ one, many }) => ({
  user: one(users, {
    fields: [expertPages.userId],
    references: [users.id],
  }),
  config: one(expertPageConfigs, {
    fields: [expertPages.id],
    references: [expertPageConfigs.pageId],
  }),
  sections: many(expertPageSections),
}));

export const expertPageConfigsRelations = relations(expertPageConfigs, ({ one }) => ({
  page: one(expertPages, {
    fields: [expertPageConfigs.pageId],
    references: [expertPages.id],
  }),
}));

export const expertPageSectionsRelations = relations(expertPageSections, ({ one }) => ({
  page: one(expertPages, {
    fields: [expertPageSections.pageId],
    references: [expertPages.id],
  }),
}));

export const mentorServicesRelations = relations(mentorServices, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorServices.userId],
    references: [users.id],
  }),
  packageItems: many(mentorServicePackageItems),
}));

export const mentorServicePackagesRelations = relations(mentorServicePackages, ({ one, many }) => ({
  user: one(users, {
    fields: [mentorServicePackages.userId],
    references: [users.id],
  }),
  items: many(mentorServicePackageItems),
}));

export const mentorServicePackageItemsRelations = relations(mentorServicePackageItems, ({ one }) => ({
  package: one(mentorServicePackages, {
    fields: [mentorServicePackageItems.packageId],
    references: [mentorServicePackages.id],
  }),
  service: one(mentorServices, {
    fields: [mentorServicePackageItems.serviceId],
    references: [mentorServices.id],
  }),
}));

export const expertAvailabilityRulesRelations = relations(expertAvailabilityRules, ({ one }) => ({
  user: one(users, {
    fields: [expertAvailabilityRules.userId],
    references: [users.id],
  }),
}));

export const expertAvailabilityExceptionsRelations = relations(expertAvailabilityExceptions, ({ one }) => ({
  user: one(users, {
    fields: [expertAvailabilityExceptions.userId],
    references: [users.id],
  }),
}));

export const expertBookingsRelations = relations(expertBookings, ({ one }) => ({
  user: one(users, {
    fields: [expertBookings.userId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [expertBookings.studentId],
    references: [users.id],
  }),
  service: one(mentorServices, {
    fields: [expertBookings.serviceId],
    references: [mentorServices.id],
  }),
  order: one(orders, {
    fields: [expertBookings.orderId],
    references: [orders.id],
  }),
  session: one(sessions, {
    fields: [expertBookings.id],
    references: [sessions.bookingId],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  booking: one(expertBookings, {
    fields: [sessions.bookingId],
    references: [expertBookings.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  booking: one(expertBookings, {
    fields: [orders.bookingId],
    references: [expertBookings.id],
  }),
  mentorship: one(mentorships, {
    fields: [orders.mentorshipId],
    references: [mentorships.id],
  }),
  playbookPurchase: one(playbookPurchases, {
    fields: [orders.playbookPurchaseId],
    references: [playbookPurchases.id],
  }),
  student: one(users, {
    fields: [orders.studentId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));


export const expertNotesRelations = relations(expertNotes, ({ one }) => ({
  expert: one(users, {
    fields: [expertNotes.userId],
    references: [users.id],
  }),
  student: one(users, {
    fields: [expertNotes.studentId],
    references: [users.id],
  }),
  booking: one(expertBookings, {
    fields: [expertNotes.bookingId],
    references: [expertBookings.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(expertBookings, {
    fields: [reviews.bookingId],
    references: [expertBookings.id],
  }),
  mentorship: one(mentorships, {
    fields: [reviews.mentorshipId],
    references: [mentorships.id],
  }),
  student: one(users, {
    fields: [reviews.studentId],
    references: [users.id],
  }),
  expert: one(users, {
    fields: [reviews.expertUserId],
    references: [users.id],
  }),
  service: one(mentorServices, {
    fields: [reviews.serviceId],
    references: [mentorServices.id],
  }),
}));
