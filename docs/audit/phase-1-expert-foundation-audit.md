# Phase 1 — Expert Foundation Flow Audit

**Date:** 2026-08-29
**Scope:** Expert registration, onboarding, resume upload/review, profile completion, verification submission, admin review, Expert Dashboard, public profile compatibility.

---

## 1. Executive Summary

| Status | Count |
|---|---:|
| Fully Working | 5 |
| Partially Working | 3 |
| Not Implemented | 2 |
| Broken | 0 |
| Blocked | 0 |

---

## 2. Flow Scorecard

| Flow | Exists | Backend | Frontend | E2E Working | Status | Severity |
|---|---|---|---|---|---|---|
| Expert registration | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Expert onboarding | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Resume upload + parsing | ✅ | ✅ | ✅ | ⚠️ | ⚠️ PARTIAL | Low |
| Parsed resume review | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Profile editor | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Experience / education CRUD | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Verification submission | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Admin verification review | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Expert dashboard | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Public expert profile (via `/m/:slug`) | ✅ | ✅ | ✅ | ✅ | ✅ WORKING | — |
| Services / packages / availability / bookings | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | — |
| WhatsApp / email verification | ❌ | ❌ | ❌ | ❌ | 🚫 NOT IMPLEMENTED | — |

---

## 3. Detailed Findings

### FLOW 1 — Expert Onboarding

**Expected:**
Expert registers → onboarding → resume upload → review parsed data → edit profile → add experience/education → submit verification.

**Actual:**
All steps are implemented and wired:
- `/expert/onboarding` loads the stepper UI.
- Resume upload validates MIME type and size, stores the file in `file_assets`, parses via `regex-parser`, and returns a structured proposal.
- Review screen lets the expert edit every extracted field before confirming.
- Profile, experience, and education steps persist to canonical tables.
- Final step submits verification, sets onboarding status to `completed`, and redirects to `/expert/dashboard`.

**Notes:**
- The parser only supports plain text resumes in Phase 1. PDF/DOCX uploads are stored but marked as partial/unsupported by the fallback parser. This is documented and does not block onboarding.
- Resume re-upload replaces the previous resume + file asset; it does not silently overwrite confirmed profile data.

---

### FLOW 2 — Expert Profile / Page

**Expected:**
Public page with profile, experience, education, expertise, services, packages, availability, reviews.

**Actual:**
- Expert data is stored in `mentor_profiles` (canonical Phase 1 profile).
- Public page at `/m/:slug` renders for verified experts.
- Profile displays `displayName`, `headline`, `bio`, `company`, `expertise`, `linkedinUrl`, and verification badge.
- Mentorship pricing box is hidden for experts because services/bookings are not yet implemented.

**Missing:**
- Separate experience/education display on the public page.
- Services, packages, availability, reviews (Phase 2+).

---

### FLOW 17 — Expert Verification

**Expected:**
Expert submits verification → pending → admin reviews → approve/reject → status updated → public profile reflects it.

**Actual:**
- `expert.submitVerification` creates a `pending` `expert_verifications` row and updates `mentor_profiles.verificationStatus`.
- Superadmin sees a dedicated "Expert Verifications" tab in Admin Dashboard.
- `admin.reviewExpertVerification` approves/rejects, sets `reviewedAt`, `reviewedBy`, `rejectionReason`, and updates the profile.
- Public profile uses both `isVerified` and `verificationStatus === "verified"` to show the verified badge.

---

### FLOW 21 — Admin

**Expected:**
Admin authentication, RBAC, expert verification.

**Actual:**
- Superadmin-only endpoints for listing and reviewing expert verifications.
- Admin dashboard shows the verifications tab only when the current user is `superadmin`.
- RBAC middleware rejects non-superadmin calls.

---

## 4. API ↔ Frontend Consistency

| Frontend | API | Method | Status |
|---|---|---|---|
| `/login` (expert role) | `account.register` | `POST` | ✅ |
| `/expert/onboarding` | `expert.me` / `expert.uploadResume` / `expert.confirmParsedProfile` / `expert.updateOnboarding` | `query` / `mutation` | ✅ |
| `/expert/dashboard` | `expert.me` / `expert.myProfile` | `query` | ✅ |
| `/expert/profile/edit` | `expert.myProfile` / `expert.upsertProfile` | `query` / `mutation` | ✅ |
| Admin "Expert Verifications" tab | `admin.listExpertVerifications` / `admin.reviewExpertVerification` | `query` / `mutation` | ✅ |
| Public profile `/m/:slug` | `catalog.mentorBySlug` | `query` | ✅ |

---

## 5. Security / RBAC Notes

- `expert.*` endpoints use `roleQuery("expert")`.
- `admin.reviewExpertVerification` uses `roleQuery("superadmin")`.
- All mutations operate on `ctx.user.id`, preventing cross-user edits.
- Experience/education mutations enforce ownership via `and(eq(...id), eq(...userId))`.

---

## 6. Test Results

- `npm run check`: ✅ passing
- `npm run lint`: ✅ passing
- `npm test` (Vitest): ✅ passing
- `npx playwright test`: ✅ 7/7 passing
- Docker production build: ✅ passing

---

## 7. Known Gaps / Phase 2 Items

- Services, packages, availability, bookings, payments, wallet, analytics.
- WhatsApp and email verification (Phase 1 uses manual admin review only).
- PDF/DOCX automatic text extraction requires a parser provider upgrade.
- Dedicated `/expert/:slug` route (currently reuses `/m/:slug`).
- Public profile does not yet render experience/education sections individually.
