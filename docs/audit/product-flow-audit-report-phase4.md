# Embark Product-Flow Audit Report — Phase 4 Update

**Audit source:** `docs/audit/product-flow auditor.md`  
**Project:** embark-V2  
**Audited:** 2026-08-29  
**Auditor:** Kimi Code CLI

---

## 0. Important Context

The repository now has a dedicated **`expert`** role separate from the legacy `mentor` role. Phases 1–4 implement an expert onboarding → profile → public page → services → availability → booking pipeline. The legacy mentor/candidate marketplace still exists in parallel.

| Generic audit term | Embark implementation |
|---|---|
| Expert | `users.role = expert` + `mentorProfiles` row + `expertOnboarding` |
| Student | `candidate` |
| Expert services / packages | `mentorServices` table (Phase 3) |
| Booking | `expertBookings` + availability engine (Phase 4) |
| Availability / calendar | `expert_availability_rules` + `expert_availability_exceptions` + `api/lib/calendar.ts` |
| Payment | **Not implemented** for expert services |
| Reviews | **Not implemented** |
| Wallet / earnings | **Not implemented** |
| Notifications | **Not implemented** |

---

## 1. Executive Summary

| Status | Count |
|---|---:|---|
| Fully Working | 8 |
| Partially Working | 6 |
| Broken | 1 |
| Not Implemented | 6 |
| Blocked | 0 |

**Summary:**
- Expert onboarding, profile, public page builder, services, availability, and public booking request flows are implemented end-to-end.
- Real-time slot computation uses weekly rules, exceptions, existing bookings, and timezone-aware wall-clock times.
- Docker Compose stack builds, migrates, and runs successfully.
- Remaining gaps: real payments, reviews, wallet/earnings, analytics, notifications, and post-booking video/session automation.

---

## 2. Flow Scorecard

| Flow | Exists | Backend | Frontend | E2E Working | Status | Severity |
|---|---|---|---|---|---|---|
| 1. Expert onboarding | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 2. Expert profile / public page | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 3. Expert page builder | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 4. Expert services | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 5. Expert packages (multi-service bundles) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 6. Expert availability / calendar | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 7. Student/Candidate onboarding | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 8. Student explore / discover | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 9. Student → Expert → Service → Booking | ✅ | ✅ | ✅ | ⚠️ | ⚠️ PARTIAL | HIGH |
| 10. Payment | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | CRITICAL |
| 11. Priority DM | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 12. Expert manages students | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 13. Expert bookings / sessions | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 14. Reviews | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | MEDIUM |
| 15. Expert wallet / earnings | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | HIGH |
| 16. Expert analytics | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 17. Expert verification | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 18. Notifications | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | LOW |
| 19. Playbooks | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 20. Events / competitions | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 21. Admin / Superadmin | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 22. Security / RBAC | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| 23. Error / edge case handling | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ PARTIAL | MEDIUM |
| 24. API ↔ Frontend consistency | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |

**Legend:** ✅ = yes, ⚠️ = partial, ❌ = no, ⏸️ = blocked

---

## 3. Expert Flow Report

### Flow 1 — Expert Onboarding

**Expected:** Sign up → resume upload → review details → basic profile → experience → education → submit → verification → dashboard

**Actual:**
- `/expert/onboarding` is a multi-step wizard (`src/pages/ExpertOnboarding.tsx`).
- Resume upload parses PDF/DOCX into `expertResumes` and extracts name, email, phone, headline, role, company, LinkedIn, GitHub, experience, education, and skills.
- LinkedIn/GitHub are extracted from hyperlinks as well as plain text.
- Profile photo upload is wired in the onboarding profile step and profile editor.
- Submission redirects to `/expert/dashboard` and shows the correct pending/approved state.
- Duplicate submits are blocked with a clear toast message.
- Superadmin verification is reflected on the expert profile and public page.

**Result:** ✅ WORKING

---

### Flow 2 — Expert Profile / Public Page

**Expected:** Public page with profile, experience, education, expertise, services, packages, availability, reviews

**Actual:**
- `/m/:slug` renders `PublicExpertPage` with profile, experience, education, skills, and services.
- "View profile" navigation from the dashboard works.
- Public page is modern, detailed, and responsive.

**Result:** ✅ WORKING

---

### Flow 3 — Expert Page Builder

**Expected:** Edit page slug, theme, sections, cover image, profile image, publish/unpublish, preview

**Actual:**
- `/expert/page` (`ExpertPageBuilder`) allows editing sections, theme, slug, and cover/profile images.
- Image uploads have proper error handling and asset resolution.
- Publish/unpublish toggles `expert_pages.publishedAt`.

**Result:** ✅ WORKING

---

### Flow 4 — Expert Services

**Expected:** Create/edit services with title, slug, description, type, price, duration, delivery mode, requirements, outcomes, image, publish lifecycle

**Actual:**
- `/expert/services` and `/expert/services/:id` provide full CRUD.
- Services are listed on the public page.
- `mentorServices.status` lifecycle (`draft` → `published` → `unpublished`/`archived`) is enforced.

**Result:** ✅ WORKING

---

### Flow 5 — Expert Packages (Multi-Service Bundles)

**Expected:** Bundle multiple services into a package with quantity/validity/price

**Actual:**
- Only individual services exist; no bundle/package table or UI.
- A service can act as a fixed-price, single-session offering, which partially covers the use case.

**Result:** ⚠️ PARTIAL

---

### Flow 6 — Expert Availability / Calendar

**Expected:** Weekly availability, blocked/override exceptions, slot computation, bookings

**Actual:**
- Tables `expert_availability_rules`, `expert_availability_exceptions`, and `expert_bookings` created and migrated.
- `api/lib/calendar.ts` computes available slots from rules, exceptions, and existing bookings in the expert timezone.
- `api/routers/expert-calendar.ts` exposes CRUD for rules, exceptions, bookings, and slot preview.
- `/expert/calendar` UI lets experts set weekly hours, add exceptions, and manage bookings.
- Public slot API `catalog.expertServiceSlots` returns only available slots.

**Result:** ✅ WORKING

---

### Flow 9 — Student → Expert → Service → Booking

**Expected:** Discover → view service → pick date/slot → intake → booking request → confirmation

**Actual:**
- Public service detail page (`/m/:slug/services/:serviceSlug`) shows service and a slot picker.
- Authenticated students see available slots, select one, add a message, and request a booking.
- Booking creates a `expertBookings` row with `status = pending` and prevents double booking via DB unique index + runtime slot check.

**Missing:**
- Payment is not implemented; bookings are requests only.
- Post-booking meeting URL/session automation is not implemented.
- Students cannot yet reschedule/cancel from the UI.

**Result:** ⚠️ PARTIAL — booking request flow works, but payment and session lifecycle automation are missing.

---

### Flow 13 — Expert Bookings / Sessions

**Expected:** Pending / Upcoming / Completed / Cancelled list with confirm/cancel actions

**Actual:**
- Expert calendar bookings tab lists bookings with student name and service title.
- Expert can confirm, cancel, complete, or mark no-show.
- Status lifecycle is enforced.

**Result:** ✅ WORKING

---

### Flow 17 — Expert Verification

**Expected:** Expert submits → superadmin reviews → approve/reject → status reflected

**Actual:**
- Submit from onboarding creates `expertVerifications` row with `status = pending`.
- Superadmin verification updates `mentorProfiles.verificationStatus` and `isVerified`.
- Dashboard and public page reflect verification badge correctly.

**Result:** ✅ WORKING

---

## 4. API Audit

| Endpoint | Used By | Frontend Connected | Backend Exists | Auth | Tested | Result |
|---|---|---|---|---|---|---|
| `expert.*` onboarding/profile | ExpertOnboarding, ExpertProfileEdit | ✅ | ✅ | `expert` | Runtime | ✅ WORKING |
| `expertPage.*` | ExpertPageBuilder | ✅ | ✅ | `expert` | Runtime | ✅ WORKING |
| `expertServices.*` | ExpertServices, ExpertServiceEditor | ✅ | ✅ | `expert` | Runtime | ✅ WORKING |
| `expertCalendar.*` | ExpertCalendar, PublicServiceDetail | ✅ | ✅ | `expert` / authed | Runtime | ✅ WORKING |
| `catalog.expertServiceSlots` | PublicServiceDetail | ✅ | ✅ | Public | Runtime | ✅ WORKING |
| `catalog.expertServiceBySlug` | PublicServiceDetail | ✅ | ✅ | Public | Runtime | ✅ WORKING |

---

## 5. Runtime Verification

- `npm run check` passes.
- `npx vitest run api/lib/calendar.test.ts` passes (5/5).
- `docker compose up -d --build` succeeded.
- MySQL container healthy; `expert_availability_rules`, `expert_availability_exceptions`, and `expert_bookings` tables present.
- `http://127.0.0.1:3000/` returns 200.
- `http://127.0.0.1:3000/api/trpc/ping` returns `{ ok: true }`.

---

## 6. Remaining Gaps

1. **Payment integration** for expert service bookings.
2. **Post-booking session experience** (video link, reminders, join meeting).
3. **Student-side bookings list** (`expertCalendar.myBookings` exists but no page).
4. **Reviews and ratings** after completed sessions.
5. **Wallet / earnings / payouts** for experts.
6. **Analytics and notifications**.
7. **Reschedule/cancel from the student side**.
8. **Admin panel booking management**.
