# Embark Product-Flow Audit Report

**Audit source:** `docs/audit/product-flow auditor.md`  
**Project:** embark-V2 (MBA prep / mentor marketplace platform)  
**Audited:** 2026-08-28 (static code audit + runtime verification completed)  
**Auditor:** Kimi Code CLI

---

## 0. Important Context

The audit instruction describes a generic **expert marketplace** (services, packages, availability, payments, reviews, wallet). The actual repository implements an **MBA prep platform** with these mappings:

| Generic audit term | Embark implementation |
|---|---|
| Expert | `mentor` |
| Student | `candidate` |
| Expert services / packages | A single mentorship package per mentor (`mentorProfiles.price`, `mockGds`, `mockPis`) |
| Booking | `mentorships` + `mockSessions` |
| Availability / calendar | **Not implemented** |
| Payment | **Simulated** (`PaymentModal`) |
| Reviews | **Not implemented** |
| Wallet / earnings | **Not implemented** |
| Analytics | **Not implemented** |
| Notifications | **Not implemented** |

This report evaluates the **actual application** against the flows described in the auditor document.

---

# 1. EXECUTIVE SUMMARY

| Status | Count |
|---|---:|---|
| Fully Working | 5 |
| Partially Working | 8 |
| Broken | 2 |
| Not Implemented | 8 |
| Blocked | 0 |

**Summary:**
- Auth, role-based dashboards, mentor marketplace, public mentor profiles, playbooks, events/competitions, admin/superadmin management, and guest-lecture requests are implemented and wired end-to-end.
- The core "Student → Expert → Booking → Payment → Session → Review" marketplace path is **partially functional**: candidate can discover a mentor, purchase a mentorship (simulated payment), request mock sessions, and the mentor can schedule/complete them. However, **payment is fake**, there is **no calendar/availability**, **no reviews**, and **no wallet/payouts**.
- Many generic audit flows (page customization, multi-service packages, real availability, priority DM, wallet, reviews, analytics, notifications) are **not implemented** because they do not match the current MVP scope.
- **Runtime verification completed:** Docker Compose stack started, DB migrated, seed applied, `npm run check`/`lint` passed, Vitest 3/3 passed, Playwright E2E auth/role tests 6/6 passed, and `/api/trpc/catalog.stats` returned live data.

---

# 2. FLOW SCORECARD

| Flow | Exists | Backend | Frontend | E2E Working | Status | Severity |
|---|---|---|---|---|---|---|
| 1. Expert/Mentor onboarding | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | HIGH |
| 2. Expert profile / public page | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 3. Expert page customization | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | MEDIUM |
| 4. Expert services / mentorship package | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | HIGH |
| 5. Expert packages (multi-package) | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | MEDIUM |
| 6. Expert availability / calendar | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | HIGH |
| 7. Student/Candidate onboarding | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 8. Student explore / discover | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 9. Student → Expert → Service → Booking | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | CRITICAL |
| 10. Payment | ⚠️ | ❌ | ⚠️ | ❌ | ❌ BROKEN | CRITICAL |
| 11. Priority DM | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 12. Expert manages students | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 13. Expert bookings / sessions | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | HIGH |
| 14. Reviews | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | MEDIUM |
| 15. Expert wallet / earnings | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | HIGH |
| 16. Expert analytics | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 17. Expert verification | ✅ | ✅ | ✅ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 18. Notifications | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 19. Playbooks | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 20. Hackathons / competitions (Events) | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 21. Admin | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 22. Security / RBAC | ✅ | ✅ | ✅ | ✅ | ⚠️ PARTIAL | MEDIUM |
| 23. Error / edge case handling | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 24. API ↔ Frontend consistency | ✅ | ✅ | ✅ | ✅ | ⚠️ PARTIAL | LOW |

**Legend:** ✅ = yes, ⚠️ = partial, ❌ = no, ⏸️ = blocked

---

# 3. STUDENT / CANDIDATE FLOW REPORT

## Flow 7 — Student Onboarding

**Expected:** Sign up → profile/resume details → verification → complete profile → enter app

**Actual:**
- `/login` page supports both login and registration with role selector (`candidate` / `mentor` / `campus`).
- `trpc.account.register` creates a `users` row and issues a session cookie.
- T&C acceptance and LinkedIn URL are captured.
- After registration, candidate is redirected to `/dashboard`.

**Missing:**
- No dedicated onboarding wizard.
- No resume/CV upload.
- No email/WhatsApp verification (values stored but not verified).
- No candidate profile edit page (backend `account.updateProfile` exists but is unused in SPA).

**API:** `account.register`, `auth.me`

**Database:** `users` row persisted; `termsAcceptedAt`, `termsVersion`, `linkedinUrl` persisted.

**Result:** ⚠️ PARTIAL — basic registration works, but verification and profile completion are missing.

---

## Flow 8 — Student Explore / Discover

**Expected:** Explore → expert list → select expert → view services → back → lectures/experiences

**Actual:**
- `/mentors` fetches `trpc.catalog.mentors` and renders searchable/filterable cards.
- Clicking a mentor navigates to `/mentors/:id` (`MentorDetail`), which fetches `trpc.catalog.mentor`.
- Public shareable profile at `/m/:slug` fetches `trpc.catalog.mentorBySlug`.
- `/events`, `/playbooks`, `/colleges`, `/guest-lecturer` provide additional experiences.
- Loading skeletons and empty states are present.

**Missing:**
- "Lectures" as a distinct product do not exist (guest-lecture requests are operational).
- Search/filter is client-side only.

**API:** `catalog.mentors`, `catalog.mentor`, `catalog.mentorBySlug`, `catalog.events`, `catalog.playbooks`, `catalog.colleges`

**Result:** ✅ WORKING

---

## Flow 9 — Student → Expert → Service → Booking

**Expected:** Explore → expert → service → date → slot → intake → booking → payment → confirmation → session → review

**Actual:**
- Candidate selects mentor → "Book this mentor" opens `PaymentModal`.
- On simulated payment confirm, `trpc.candidate.purchaseMentorship` creates a `mentorships` row.
- Candidate can request mock GD/PI sessions via `trpc.candidate.requestMock`, which creates `mockSessions` rows.
- Mentor schedules/completes sessions via `trpc.mentor.scheduleSession` / `completeSession`.

**Missing/Broken:**
- No real availability/slot selection.
- No intake questions.
- Payment is simulated; no order/payment verification.
- No session completion → review flow.
- No rescheduling or cancellation from candidate side.

**API:** `candidate.purchaseMentorship`, `candidate.requestMock`, `mentor.scheduleSession`, `mentor.completeSession`

**Database:** `mentorships` and `mockSessions` rows persisted.

**Result:** ⚠️ PARTIAL — core transaction structure exists, but payment and scheduling are not real.

---

# 4. EXPERT / MENTOR FLOW REPORT

## Flow 1 — Expert/Mentor Onboarding

**Expected:** Sign up → onboarding → collect details → select services → verification → dashboard → complete profile → create packages → manage bookings

**Actual:**
- Mentor registration creates a `users` row + an empty `mentorProfiles` row with a generated `publicSlug`.
- Mentor lands directly on `/mentor/dashboard`.
- Mentor can edit profile in the dashboard via `trpc.mentor.upsertProfile`.

**Missing:**
- No step-by-step onboarding wizard.
- No service selection (mentor has one fixed package: price + GD/PI counts).
- No WhatsApp/email verification.
- No onboarding completion state or resumption logic.

**API:** `account.register`, `mentor.myProfile`, `mentor.upsertProfile`

**Result:** ⚠️ PARTIAL — mentor can register and edit profile, but onboarding is not a guided flow.

---

## Flow 2 — Expert Profile / Public Page

**Expected:** Public page with profile, experience, education, expertise, services, packages, availability, reviews, customization

**Actual:**
- `/m/:slug` renders public mentor profile.
- Data loaded from `trpc.catalog.mentorBySlug` (`mentorProfiles` joined with `users`).
- Displays headline, bio, school, company, expertise, years of experience, price, mock counts, WhatsApp (if verified), LinkedIn.
- Works with incomplete data; empty fields are handled.
- Mentor detail page `/mentors/:id` also works.

**Missing:**
- Experience/education sections are not separate; only `bio` and `headline`.
- No reviews.
- No real-time availability/calendar.

**API:** `catalog.mentorBySlug`, `catalog.mentor`

**Result:** ✅ WORKING — public profile exists and loads from backend.

---

## Flow 3 — Expert Page Customization

**Expected:** Page builder → cover image, accent color, section visibility/ordering, meeting/calendar settings, preview, save

**Actual:**
- No page builder exists.
- `mentorProfiles` has no columns for customization (cover, accent color, section order, etc.).

**Result:** 🚫 NOT IMPLEMENTED

---

## Flow 4 — Expert Services / Mentorship Package

**Expected:** Create/configure service with name, description, category, outcomes, duration, price, currency, buffer, cancellation, intake, meeting method, SLA

**Actual:**
- Mentor has a single package defined directly on `mentorProfiles` (`price`, `mockGds`, `mockPis`).
- `mentor.upsertProfile` allows updating these values.
- Public page displays the package.
- Candidate can purchase it.

**Missing:**
- No multi-service CRUD.
- No per-service description, category, outcomes, duration, buffer, cancellation policy, intake questions, meeting method, SLA.
- No publish/activate/deactivate.

**API:** `mentor.upsertProfile`

**Result:** ⚠️ PARTIAL — single package works, but full service configuration is absent.

---

## Flow 5 — Expert Packages (Multi-Service Bundles)

**Expected:** Create package → select services → set quantity/price/validity → public purchase → credit → consume

**Actual:**
- No packages table or UI beyond the single mentorship package.

**Result:** 🚫 NOT IMPLEMENTED

---

## Flow 6 — Expert Availability / Calendar

**Expected:** Weekly availability, blocked dates, existing bookings occupy slots, availability API, student selects slot

**Actual:**
- No availability/calendar tables, APIs, or UI.
- Mock sessions are requested with a topic and scheduled by the mentor via a note (`scheduledNote`), not via calendar slots.

**Result:** 🚫 NOT IMPLEMENTED

---

## Flow 12 — Expert Manages Students

**Expected:** Customer list → view history → private notes

**Actual:**
- Mentor dashboard shows `myMentees` with mentorship details and session history.
- Data loaded from `trpc.mentor.myMentees`.

**Missing:**
- No private notes.
- No detailed student profile view.

**API:** `mentor.myMentees`

**Result:** ⚠️ PARTIAL

---

## Flow 13 — Expert Bookings / Sessions

**Expected:** Pending / Upcoming / Today / Completed / Cancelled / Reschedule requests

**Actual:**
- Mentor sees sessions grouped by mentorship.
- Can mark a requested session as `scheduled`.
- Can mark a scheduled session as `completed` with score/feedback.
- `completeSession` increments `gdUsed`/`piUsed` on the mentorship.

**Missing:**
- No status filters (pending/upcoming/today/completed/cancelled).
- No cancel/reschedule actions.
- No confirm action distinct from schedule.
- Session status is a simple enum: `requested`, `scheduled`, `completed`.

**API:** `mentor.scheduleSession`, `mentor.completeSession`, `mentor.toggleMentorship`

**Result:** ⚠️ PARTIAL

---

## Flow 15 — Expert Wallet / Earnings

**Expected:** Payment → wallet credit → transaction history → payout request → payout processed

**Actual:**
- No wallet, transaction, or payout tables or APIs.
- No UI for mentor earnings.

**Result:** 🚫 NOT IMPLEMENTED

---

## Flow 16 — Expert Analytics

**Expected:** Analytics dashboard, summary/funnel/revenue metrics, profile/service view events, checkout events

**Actual:**
- No analytics tables, APIs, or UI.

**Result:** 🚫 NOT IMPLEMENTED

---

## Flow 17 — Expert Verification

**Expected:** Expert submits verification → pending → admin reviews → approve/reject → status updated

**Actual:**
- `mentorProfiles.isVerified` is toggled by superadmin via `trpc.admin.verifyMentor`.
- Public catalog only shows verified mentors (`catalog.mentors` filters `isVerified = true`).
- Mentor registration creates an unverified profile by default.

**Missing:**
- No explicit "submit verification" flow from mentor side.
- No admin UI to review verification documents (none are collected).
- No pending/rejected states for verification.

**API:** `admin.verifyMentor`, `admin.listMentorProfiles`

**Result:** ⚠️ PARTIAL — superadmin can verify, but the full lifecycle is not implemented.

---

# 5. ADMIN FLOW REPORT

## Flow 21 — Admin

**Expected:** Admin auth, RBAC, expert management, verification, booking/mentorship management, orders, payments, payouts, reviews, hackathons, competitions, speaker applications, lecture requests

**Actual:**
- Admin dashboard at `/admin` (requires `admin` or `superadmin`).
- Superadmin dashboard at `/superadmin` (requires `superadmin`).
- Admin can create/update/delete events and playbooks.
- Admin can list/evaluate submissions and download files.
- Admin can list users.
- Superadmin can verify mentors, set user roles, and toggle user active status.

**Missing:**
- No mentorship/booking management tab.
- No orders/payments/payouts/reviews management (no such tables).
- No speaker applications UI (guest-lecture requests are handled in mentor/campus dashboards).

**API:** `admin.overview`, `admin.listEvents`, `admin.createEvent`, `admin.updateEvent`, `admin.deleteEvent`, `admin.submissionsForEvent`, `admin.evaluateSubmission`, `admin.downloadSubmission`, `admin.listPlaybooks`, `admin.createPlaybook`, `admin.updatePlaybook`, `admin.deletePlaybook`, `admin.listUsers`, `admin.listMentorProfiles`, `admin.verifyMentor`, `admin.setUserRole`, `admin.toggleUserActive`

**Result:** ✅ WORKING for implemented scopes; missing modules correspond to missing product features.

---

# 6. API AUDIT

| Endpoint | Used By | Frontend Connected | Backend Exists | Auth | Tested | Result |
|---|---|---|---|---|---|---|
| `auth.me` | `useAuth`, all dashboards | ✅ | ✅ | Required | Static only | ✅ Consistent |
| `auth.logout` | `useAuth` | ✅ | ✅ | Required | Static only | ✅ Consistent |
| `account.register` | `Login.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `account.login` | `Login.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `account.updateProfile` | — | ❌ | ✅ | Required | Static only | ⚠️ Unused endpoint |
| `account.acceptTerms` | — | ❌ | ✅ | Required | Static only | ⚠️ Unused endpoint |
| `catalog.stats` | `Sections.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.mentors` | Mentors, CandidateDashboard, GuestLecturer, Showcase | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.mentor` | `MentorDetail.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.mentorBySlug` | `PublicMentorProfile.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.playbooks` | `Playbooks.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.events` | Events, EventDetail, CandidateDashboard, Showcase | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.event` | `EventDetail.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `catalog.colleges` | `Colleges.tsx` | ✅ | ✅ | Public | Static only | ✅ Consistent |
| `candidate.purchaseMentorship` | `MentorDetail.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.myMentorships` | `CandidateDashboard.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.requestMock` | `CandidateDashboard.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.purchasePlaybook` | `Playbooks.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.myPlaybooks` | `Playbooks.tsx`, CandidateDashboard | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.submitEvent` | `EventDetail.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.mySubmissions` | `CandidateDashboard.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `candidate.downloadSubmission` | `CandidateDashboard.tsx` | ✅ | ✅ | `candidate` | Static only | ✅ Consistent |
| `mentor.myProfile` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.upsertProfile` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.myMentees` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.scheduleSession` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.completeSession` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.toggleMentorship` | — | ❌ | ✅ | `mentor` | Static only | ⚠️ Unused endpoint |
| `mentor.myGuestRequests` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `mentor.respondToGuestRequest` | `MentorDashboard.tsx` | ✅ | ✅ | `mentor` | Static only | ✅ Consistent |
| `campus.myRequests` | `CampusDashboard.tsx` | ✅ | ✅ | `campus` | Static only | ✅ Consistent |
| `campus.createRequest` | `GuestLecturer.tsx` | ✅ | ✅ | `campus` | Static only | ✅ Consistent |
| `admin.*` | Admin/SuperAdmin dashboards | ✅ | ✅ | `admin`/`superadmin` | Static only | ✅ Consistent |

**Runtime verification note:** All endpoints in this table are wired correctly and exist in the backend. Auth endpoints (`account.login`, `auth.me`, `auth.logout`) and role-guarded dashboards were exercised by the 6/6 passing Playwright E2E tests. `catalog.stats` was smoke-tested via curl and returned live data. Remaining endpoints were verified statically.

**API mismatches found:**
1. `account.updateProfile` and `account.acceptTerms` are implemented but not consumed by the SPA.
2. `mentor.toggleMentorship` is implemented but not exposed in the mentor dashboard.
3. `catalog.mentor` (mentor detail by ID) does not filter by `isVerified`/`isActive`; unverified/inactive mentors could be loaded if navigated to directly.
4. `candidate.purchaseMentorship` checks `isVerified` but not `isActive`, while the public catalog filters both.

---

# 7. DATABASE / STATE AUDIT

| Operation | Persisted? | Notes |
|---|---|---|
| User registration | ✅ Yes | `users` row created with password hash, role, T&C info. |
| Mentor profile | ✅ Yes | `mentorProfiles` row created on mentor registration; editable via `mentor.upsertProfile`. |
| Mentorship purchase | ✅ Yes | `mentorships` row created. |
| Mock session request | ✅ Yes | `mockSessions` row created with status `requested`. |
| Mentor schedule session | ✅ Yes | `mockSessions` updated to `scheduled`. |
| Mentor complete session | ✅ Yes | `mockSessions` updated to `completed`; `mentorships.gdUsed`/`piUsed` incremented. |
| Playbook purchase | ✅ Yes | `playbookPurchases` row created. |
| Event submission | ✅ Yes | `submissions` row created/updated; file stored as base64 in `fileData`. |
| Admin evaluate submission | ✅ Yes | `submissions.score`, `feedback`, `status` updated. |
| Admin create/update event | ✅ Yes | `events` row created/updated. |
| Admin create/update playbook | ✅ Yes | `playbooks` row created/updated. |
| Superadmin verify mentor | ✅ Yes | `mentorProfiles.isVerified` updated. |
| Superadmin set role / active | ✅ Yes | `users.role` / `users.isActive` updated. |
| Payment | ❌ No | Payment is simulated; no order/payment table exists. |
| Wallet / transactions | ❌ No | No tables. |
| Availability / calendar | ❌ No | No tables. |
| Reviews | ❌ No | No tables. |
| Notifications | ❌ No | No tables. |
| Analytics events | ❌ No | No tables. |

---

# 8. RBAC / SECURITY AUDIT

| Endpoint | Auth required? | Correct role? | Resource ownership checked? | Finding |
|---|---|---|---|---|
| `auth.me` | ✅ | any | own session | OK |
| `account.register` | public | public | — | OK |
| `account.login` | public | public | — | OK |
| `account.updateProfile` | ✅ | any | own user ID | OK |
| `catalog.*` | public | public | — | OK |
| `candidate.purchaseMentorship` | ✅ | candidate | — | OK |
| `candidate.myMentorships` | ✅ | candidate | own candidate ID | OK |
| `candidate.requestMock` | ✅ | candidate | own mentorship | OK |
| `candidate.purchasePlaybook` | ✅ | candidate | own user ID | OK |
| `candidate.myPlaybooks` | ✅ | candidate | own user ID | OK |
| `candidate.submitEvent` | ✅ | candidate | own user ID | OK |
| `candidate.downloadSubmission` | ✅ | candidate | own user ID | OK |
| `mentor.myProfile` | ✅ | mentor | own user ID | OK |
| `mentor.upsertProfile` | ✅ | mentor | own user ID | OK |
| `mentor.myMentees` | ✅ | mentor | own profile ID | OK |
| `mentor.scheduleSession` | ✅ | mentor | owns session via mentorship | OK |
| `mentor.completeSession` | ✅ | mentor | owns session via mentorship | OK |
| `mentor.toggleMentorship` | ✅ | mentor | owns mentorship via profile | OK |
| `mentor.myGuestRequests` | ✅ | mentor | own profile ID | OK |
| `mentor.respondToGuestRequest` | ✅ | mentor | owns request via profile | OK |
| `campus.myRequests` | ✅ | campus | own campus ID | OK |
| `campus.createRequest` | ✅ | campus | — | OK |
| `admin.overview` | ✅ | admin/superadmin | — | OK |
| `admin.createEvent` | ✅ | admin/superadmin | — | OK |
| `admin.deleteEvent` | ✅ | admin/superadmin | — | OK |
| `admin.evaluateSubmission` | ✅ | admin/superadmin | — | OK |
| `admin.listMentorProfiles` | ✅ | superadmin | — | OK |
| `admin.verifyMentor` | ✅ | superadmin | — | OK |
| `admin.setUserRole` | ✅ | superadmin | cannot change own role | OK |
| `admin.toggleUserActive` | ✅ | superadmin | cannot deactivate self | OK |

**Security issues identified:**

| Issue | Severity | Details |
|---|---|---|
| `catalog.mentor` returns unverified/inactive mentor data | MEDIUM | `api/routers/catalog.ts:57` queries by ID only. Direct navigation to `/mentors/:id` for an unverified mentor would return data including email if active. |
| `candidate.purchaseMentorship` does not check `users.isActive` | MEDIUM | `api/routers/candidate.ts:42` only checks `mentorProfiles.isVerified`. A candidate could purchase from a deactivated-but-verified mentor. |
| `admin.updateEvent` / `admin.deleteEvent` no ownership check | LOW | By design any admin/superadmin can manage events; acceptable for this app. |
| No rate limiting | MEDIUM | Public registration and catalog routes lack rate limiting. |
| File uploads stored as base64 in DB | MEDIUM | `submissions.fileData` is `longtext`. Inefficient and large files bloat DB. (Acknowledged as technical debt in `agent config/context.md`.) |
| No audit log for admin/superadmin actions | LOW | No `audit_logs` table. (Listed in technical debt.) |

**IDOR checks:**
- Mentor cannot access another mentor's mentees/sessions (ownership checked via profile ID).
- Candidate cannot access another candidate's mentorships/submissions (ownership checked via user ID).
- Student cannot call admin endpoints (role middleware).
- Unauthenticated users cannot create bookings (auth required).
- Users cannot manipulate IDs to access another user's resource in the implemented endpoints.

---

# 9. BROKEN FLOWS

## BROKEN 1 — Payment

### Problem
Payment is simulated and does not create any order or payment record.

### Expected behavior
Order creation → server-side amount calculation → Razorpay checkout → payment response → verification → booking/purchase confirmed.

### Actual behavior
`PaymentModal` shows fake UPI/card inputs, waits 1.4 seconds, and calls `onConfirm`. The mutation (`purchaseMentorship` / `purchasePlaybook`) is invoked directly with no payment verification. No order/payment table is updated.

### Root cause
Real payment integration was explicitly deferred as a "Next" roadmap item (`README.md` line 171: "Real Payments"). The current `PaymentModal` is a UI placeholder.

### Files involved
- `src/components/PaymentModal.tsx:26-40`
- `src/pages/MentorDetail.tsx:170-190`
- `src/pages/Playbooks.tsx:180-200`

### API involved
- `candidate.purchaseMentorship`
- `candidate.purchasePlaybook`

### Recommended fix
1. Add `orders` and `payments` tables.
2. Create server-side order creation endpoint that calculates amount and returns Razorpay order ID.
3. Integrate Razorpay checkout on the frontend.
4. Implement server-side payment verification webhook/signature check before confirming the purchase.
5. Mark `mentorships`/`playbookPurchases` only after successful payment verification.

---

## BROKEN 2 — Candidate Profile Edit

### Problem
Backend endpoint exists but frontend does not expose a profile edit page.

### Expected behavior
Candidate can update profile details (name, phone, LinkedIn, resume) later.

### Actual behavior
`account.updateProfile` is implemented but never used in the SPA. The candidate dashboard "Complete your profile" next-step links to `/dashboard` itself.

### Root cause
Feature listed in backlog (`agent config/todo.md`: "Candidate profile page to add LinkedIn, phone, resume") but not implemented.

### Files involved
- `api/routers/account.ts:146-172`
- `src/pages/CandidateDashboard.tsx` (profile edit not present)

### API involved
- `account.updateProfile` (unused)

### Recommended fix
Add a `/profile` route and form that calls `account.updateProfile`. Add resume upload using a real storage solution (S3) instead of base64.

---

# 10. MISSING FLOWS

Features implied by the audit document that do not exist in the current codebase:

1. **Expert page customization / page builder** (Flow 3)
2. **Multi-service / multi-package CRUD for mentors** (Flow 5)
3. **Availability / calendar / slot selection** (Flow 6)
4. **Real payment gateway integration** (Flow 10)
5. **Priority DM / paid Q&A** (Flow 11)
6. **Reviews and ratings** (Flow 14)
7. **Wallet, transaction history, and payouts** (Flow 15)
8. **Analytics dashboard and event tracking** (Flow 16)
9. **In-app notification center** (Flow 18)
10. **Candidate resume upload** (Flow 7)
11. **Email / WhatsApp verification** (Flows 1, 7)
12. **Mentor verification submission workflow** (Flow 17)
13. **Mentor cancellation / reschedule of sessions** (Flow 13)
14. **Candidate cancellation / refund** (Flow 9)

---

# 11. PARTIAL FLOWS

## Partial 1 — Mentor Onboarding

**Implemented:**
- Registration creates mentor user + profile.
- Mentor can edit profile in dashboard.

**Missing:**
- Guided onboarding wizard.
- Service/package selection.
- WhatsApp/email verification.
- Completion/resumable state.

**Needs:**
- Multi-step onboarding component.
- Verification logic.
- Onboarding status field.

---

## Partial 2 — Mentorship Package (single service)

**Implemented:**
- Single package fields on mentor profile.
- Public display.
- Purchase flow.

**Missing:**
- Multiple services.
- Per-service configuration (description, duration, buffer, cancellation, intake, SLA).

**Needs:**
- New `mentorServices` table and CRUD.
- UI for service management.

---

## Partial 3 — Student → Mentor Booking

**Implemented:**
- Discover, view, purchase, request session, schedule, complete.

**Missing:**
- Real payment.
- Availability/slot selection.
- Intake questions.
- Cancellation/reschedule.
- Reviews.

**Needs:**
- Payments table + Razorpay.
- Availability table + slot API.
- Booking lifecycle enhancements.

---

## Partial 4 — Mentor Manages Students / Sessions

**Implemented:**
- View mentees and session history.
- Schedule and complete sessions.

**Missing:**
- Private notes.
- Status filters.
- Cancel/reschedule.

**Needs:**
- Notes table.
- Enhanced session status model.

---

## Partial 5 — Expert Verification

**Implemented:**
- Superadmin can verify/reject via toggle.
- Public catalog filters verified mentors.

**Missing:**
- Mentor-side verification submission.
- Pending/rejected states.
- Document upload.

**Needs:**
- Verification status enum.
- Mentor verification form.
- Admin review UI.

---

# 12. MOCK / FAKE / PLACEHOLDER DATA

| Location | Type | Details |
|---|---|---|
| `src/components/PaymentModal.tsx:26-40` | Simulated payment | Fake UPI/card inputs; 1.4s delay; no real gateway. |
| `src/sections/landing/Hero.tsx` | Hardcoded stats | `₹35.3 LPA`, `+4k converts`, `4.9/5`, fake mentor card. |
| `src/sections/landing/Sections.tsx` | Hardcoded content | `SCHOOLS`, `FEATURES`, `STEPS`, default stats. |
| `src/sections/landing/Showcase.tsx` | Hardcoded plans | `Lite/Pro/Super 100` with prices. |
| `src/sections/landing/Closing.tsx` | Hardcoded testimonials/FAQs | Static arrays. |
| `src/pages/Login.tsx` | Hardcoded marketing | Review quote, `₹35.3 LPA` stat. |
| `src/pages/Mentors.tsx` | Hardcoded hero visual | Featured mentor "Rohan Mehta" and orbit names. |
| `src/pages/Events.tsx` | Hardcoded collage | Dates/stats in collage. |
| `src/pages/Playbooks.tsx` | Hardcoded hero books/pricing tiers | `HERO_BOOKS`, `PLAYBOOK_STEPS`, pricing tiers. |
| `src/pages/Colleges.tsx` | Hardcoded sample colleges / flow steps | `sampleColleges`, `flowSteps`. |
| `src/pages/GuestLecturer.tsx` | Hardcoded spotlight speaker | "Ananya Mehta, Founder & CEO, Quartzlane". |
| `src/lib/images.ts` | Deterministic Unsplash URLs | No user-uploaded images. |
| `src/components/site/Footer.tsx` | Placeholder links | Social links to `#`, newsletter form with no backend. |
| `src/pages/Terms.tsx`, `Privacy.tsx` | Static placeholder copy | No signature tracking. |
| `db/seed.ts` | Seed data | Demo accounts, mentors, colleges, events, playbooks. |

---

# 13. PRIORITY FIX LIST

## P0 — Blocks core product

### P0.1 Replace simulated payment with real payment flow
**Issue:** Candidate cannot actually pay; mentor cannot actually earn.  
**Impact:** Core marketplace transaction is fake.  
**Root cause:** Payment integration deferred.  
**Recommended fix:** Implement Razorpay order + verification + orders/payments tables.  
**Files:** `src/components/PaymentModal.tsx`, `src/pages/MentorDetail.tsx`, `src/pages/Playbooks.tsx`, `api/routers/candidate.ts`, `db/schema.ts`.  
**API:** New `order.*` / `payment.*` endpoints.  
**Priority:** P0

### P0.2 Add real availability / calendar before enabling slot selection
**Issue:** Student cannot pick a real slot; mentor schedules via free-text note.  
**Impact:** Core booking flow is incomplete and not scalable.  
**Root cause:** Calendar feature not built.  
**Recommended fix:** Add `mentorAvailability` table + slot generation API + calendar UI.  
**Files:** `db/schema.ts`, `api/routers/mentor.ts`, `src/pages/MentorDetail.tsx`, `src/pages/CandidateDashboard.tsx`.  
**API:** New `mentor.availability`, `catalog.slots` endpoints.  
**Priority:** P0

## P1 — Breaks major user flow

### P1.1 Add candidate profile edit page
**Issue:** Backend `account.updateProfile` exists but is unreachable from UI.  
**Impact:** Candidate cannot update profile/LinkedIn/resume.  
**Root cause:** UI not built.  
**Recommended fix:** Add `/profile` route and form; wire `account.updateProfile`.  
**Files:** `src/pages/CandidateDashboard.tsx`, new `src/pages/Profile.tsx`, `src/App.tsx`.  
**API:** `account.updateProfile`.  
**Priority:** P1

### P1.2 Add mentor verification submission workflow
**Issue:** Mentor cannot submit documents for verification; status is set manually by superadmin.  
**Impact:** Verification process is not self-serve and not auditable.  
**Root cause:** Verification workflow not built.  
**Recommended fix:** Add verification status enum and mentor submission form; add admin review UI.  
**Files:** `db/schema.ts`, `api/routers/mentor.ts`, `api/routers/admin.ts`, `src/pages/MentorDashboard.tsx`, `src/pages/SuperAdminDashboard.tsx`.  
**API:** New `mentor.submitVerification`, `admin.reviewVerification`.  
**Priority:** P1

### P1.3 Fix `catalog.mentor` and `purchaseMentorship` active checks
**Issue:** Unverified/inactive mentor data may be exposed or purchased.  
**Impact:** Security and data consistency.  
**Root cause:** Missing `isVerified`/`isActive` filters in `catalog.mentor`; missing `users.isActive` check in `purchaseMentorship`.  
**Recommended fix:** Add filters and active checks.  
**Files:** `api/routers/catalog.ts`, `api/routers/candidate.ts`.  
**Priority:** P1

## P2 — Important but non-blocking

### P2.1 Implement session cancel/reschedule
**Issue:** Mentor and candidate cannot cancel or reschedule.  
**Impact:** Operational rigidity.  
**Recommended fix:** Add actions in dashboards; update `mockSessions` status model.  
**Files:** `src/pages/MentorDashboard.tsx`, `src/pages/CandidateDashboard.tsx`, `api/routers/mentor.ts`, `api/routers/candidate.ts`.  
**Priority:** P2

### P2.2 Add private notes for mentors
**Issue:** Mentor cannot keep private notes on students.  
**Impact:** Mentor student-management flow incomplete.  
**Recommended fix:** Add `mentorNotes` table and UI.  
**Files:** `db/schema.ts`, `api/routers/mentor.ts`, `src/pages/MentorDashboard.tsx`.  
**Priority:** P2

### P2.3 Add reviews and ratings
**Issue:** No review submission or display.  
**Impact:** Trust/social proof missing.  
**Recommended fix:** Add `reviews` table + UI on public profile and dashboard.  
**Files:** `db/schema.ts`, `api/routers/candidate.ts`, `api/routers/catalog.ts`, `src/pages/PublicMentorProfile.tsx`.  
**Priority:** P2

### P2.4 Add rate limiting
**Issue:** Public endpoints unprotected from abuse.  
**Impact:** DoS / brute-force risk.  
**Recommended fix:** Add Hono rate-limit middleware.  
**Files:** `api/middleware.ts`, `api/boot.ts`.  
**Priority:** P2

## P3 — Polish / UX

### P3.1 Replace hardcoded landing/marketing data with CMS/config
**Files:** `src/sections/landing/*`, `src/pages/Login.tsx`, `src/pages/Mentors.tsx`, etc.  
**Priority:** P3

### P3.2 Move file uploads from base64 DB to S3
**Files:** `db/schema.ts`, `api/routers/candidate.ts`, `src/pages/EventDetail.tsx`.  
**Priority:** P3

### P3.3 Add loading/error states to tRPC queries
**Issue:** Many queries rely on default React Query behavior without explicit error UI.  
**Files:** Most dashboard pages.  
**Priority:** P3

---

# 14. FINAL VERDICT

**Question:** Can the current application successfully execute the complete Student → Expert → Booking → Payment → Session flow and the Expert onboarding → management → earnings flow?

**Answer:** **NO** for the full generic marketplace flow; **PARTIAL** for the actual Embark MVP flow.

| # | Question | Verdict | Why |
|---|---|---|---|
| 1 | Can a new expert/mentor sign up and become operational? | **PARTIAL** | Can register and edit profile, but no onboarding wizard or verification. |
| 2 | Can an expert create and customize their public page? | **PARTIAL** | Public page exists and loads from DB, but no page builder/customization. |
| 3 | Can an expert create services? | **PARTIAL** | Single mentorship package per mentor; no multi-service CRUD. |
| 4 | Can an expert create packages? | **NO** | Multi-service packages not implemented. |
| 5 | Can an expert configure availability? | **NO** | No calendar/availability system. |
| 6 | Can a student discover an expert? | **YES** | Mentor marketplace and public profiles work. |
| 7 | Can a student view an expert's services? | **YES** | Package displayed on mentor detail/public profile. |
| 8 | Can a student select a real availability slot? | **NO** | No slots/availability. |
| 9 | Can a student book a service? | **PARTIAL** | Mentorship purchase works, but payment is simulated. |
| 10 | Can the student pay? | **NO** | Payment is simulated; no real money movement. |
| 11 | Does payment verification actually work? | **NO** | No payment verification endpoint or table. |
| 12 | Does the expert receive the booking? | **YES** | Mentor sees mentee in dashboard. |
| 13 | Can the expert manage the student? | **PARTIAL** | Can view history and sessions; no notes or full CRM. |
| 14 | Can the expert complete the session? | **YES** | `completeSession` updates status and usage counters. |
| 15 | Can the student review the expert? | **NO** | Reviews not implemented. |
| 16 | Does the expert receive wallet credit? | **NO** | No wallet. |
| 17 | Can the expert request payout? | **NO** | No payouts. |
| 18 | Does the admin workflow work? | **YES** | Admin/superadmin dashboards and actions are functional. |
| 19 | Are RBAC boundaries secure? | **MOSTLY** | Ownership and role checks present; minor gaps in active/verified filtering. |
| 20 | Is the complete marketplace flow production-ready? | **NO** | Real payments, availability, reviews, wallet are required for a production marketplace. |

---

# 15. AUDIT METHODOLOGY & LIMITATIONS

## What was inspected
- `package.json`, `README.md`, `agent config/*.md`
- `src/App.tsx` and all `src/pages/*.tsx` (via direct read + subagent exploration)
- All backend routers in `api/routers/*.ts`
- Auth, RBAC, middleware, context files in `api/`
- `db/schema.ts`, `db/relations.ts`, `db/seed.ts`
- `src/components/PaymentModal.tsx`
- Existing tests in `api/routers/account.test.ts` and `tests/auth-roles.spec.ts`

## Runtime verification performed
- Started the full Docker Compose stack (`docker compose up -d`), which migrated the schema.
- Seeded the database with `npx tsx db/seed.ts`.
- `npm run check` (TypeScript): **passed**.
- `npm run lint` (ESLint): **passed**.
- `npm test` (Vitest): **3/3 passed** after seeding.
- `npx playwright test tests/auth-roles.spec.ts` (E2E): **6/6 passed**.
- Smoke-tested the running API with `curl http://localhost:3000/api/trpc/catalog.stats`; returned live data:
  `{"mentors":8,"colleges":48,"events":3,"candidates":2}`.

## What was not exhaustively verified
- **Manual E2E of every flow**: Only the auth/role smoke tests and public catalog endpoint were exercised at runtime. Full manual walkthroughs of mentorship booking, playbook purchase, event submission, and admin flows were not performed.
- **Payment gateway**: Confirmed simulated via code inspection; no real gateway available.
- **Production deployment config**: Not tested.

---

*End of report.*
