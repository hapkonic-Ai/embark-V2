# Schema Change Log

| Date | Phase | Entity | Change | Reason | Migration | Backward Compatibility | Future Impact |
|---|---|---|---|---|---|---|---|
| 2026-08-28 | P1 | `users` | Added `expert` to `role` enum | Support new Expert role | `drizzle-kit push` enum expansion | Existing roles unchanged | Future roles can be added here |
| 2026-08-28 | P1 | `mentor_profiles` | Added `displayName`, `profileImage`, `coverImage`, `location`, `country`, `timezone`, `currentRole`, `industries`, `languages`, `githubUrl`, `portfolioUrl`, `websiteUrl`, `status`, `onboardingStatus`, `verificationStatus`, `profileCompletionPercent` | Canonical Expert profile fields | `drizzle-kit push` nullable columns | Existing mentor records and public pages unaffected | Future Phase 2 can rename table to `expert_profiles` |
| 2026-08-28 | P1 | `file_assets` | Created | Generic file abstraction for resume uploads | `drizzle-kit push` new table | N/A | Future S3 migration uses same table |
| 2026-08-28 | P1 | `expert_onboarding` | Created | Track explicit onboarding state | `drizzle-kit push` new table | N/A | Future onboarding steps extend `currentStep` enum |
| 2026-08-28 | P1 | `expert_resumes` | Created | Resume source + parsed proposal | `drizzle-kit push` new table | N/A | Future AI parser plugs in via `parserProvider` |
| 2026-08-28 | P1 | `expert_experience` | Created | Structured experience entries | `drizzle-kit push` new table | N/A | Public profile, future services use this |
| 2026-08-28 | P1 | `expert_education` | Created | Structured education entries | `drizzle-kit push` new table | N/A | Public profile uses this |
| 2026-08-28 | P1 | `expert_verifications` | Created | Verification lifecycle | `drizzle-kit push` new table | N/A | Future verification types extend `verificationType` |
| 2026-08-29 | P2 | `expert_pages` | Created | Public page identity, slug, and publishing lifecycle | `drizzle-kit generate` new table | N/A | Slug becomes canonical public route source |
| 2026-08-29 | P2 | `expert_page_configs` | Created | Theme, branding, and CTA presentation config | `drizzle-kit generate` new table | N/A | Future themes/CTAs extend validated enum values |
| 2026-08-29 | P2 | `expert_page_sections` | Created | Section ordering, visibility, and per-section config | `drizzle-kit generate` new table | N/A | New section types added without schema change |
| 2026-08-29 | P3 | `mentor_services` | Created | Expert-owned service catalog with pricing, delivery mode, and lifecycle | `drizzle-kit generate` new table | N/A | Future bookings link to service ids |
| 2026-08-29 | P4 | `expert_availability_rules` | Created | Weekly recurring availability windows per expert | `drizzle-kit generate` new table | N/A | Slot engine uses `dayOfWeek` + wall-clock times in expert timezone |
| 2026-08-29 | P4 | `expert_availability_exceptions` | Created | Date-level blocks or bonus availability overrides | `drizzle-kit generate` new table | N/A | Applied on top of weekly rules before slot generation |
| 2026-08-29 | P4 | `expert_bookings` | Created | Service bookings with status lifecycle and intake responses | `drizzle-kit generate` new table | N/A | Payments, reminders, and video links attach here |
| 2026-08-29 | P5 | `sessions` | Created | Real appointment entity separate from Booking | `drizzle-kit generate` new table | N/A | Meeting links, notes, and feedback live here |
| 2026-08-29 | P5 | `orders` | Created | Commercial transaction for bookings | `drizzle-kit generate` new table | N/A | Payment provider integration attaches here |
| 2026-08-29 | P5 | `payments` | Created | Payment-provider event log | `drizzle-kit generate` new table | N/A | Webhook idempotency and reconciliation |
| 2026-08-29 | P5 | `mentor_services` | Added `intakeConfiguration`, `isBookable`, `requiresPayment` | Support intake forms and free/paid services | `drizzle-kit push` column additions | Defaults preserve existing services | More service-level configuration |
| 2026-08-29 | P5 | `mock_sessions` / `mentorships` | Marked legacy/deprecated | Replaced by `expert_bookings` + `sessions` | none | Existing rows kept; old endpoints remain until UI cutover | Will be removed in Phase 6 |
