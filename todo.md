# Embark — Backlog / Todo

## High Priority
- [ ] Production deployment setup (Docker, CI/CD, environment checklist)
- [ ] Replace simulated payment modal with real payment gateway (Razorpay / Stripe India)
- [ ] File upload migration: move base64 file storage to S3 / presigned URLs
- [ ] Add Terms & Conditions and Privacy Policy actual content pages
- [ ] Email notifications (welcome, booking confirmation, event updates)
- [ ] Candidate profile page to add LinkedIn, phone, resume
- [ ] Mentor public profile analytics (views, bookings)
- [ ] Admin analytics dashboard (revenue, active mentorships, event participation)
- [ ] Search + filters on mentors (by expertise, price, B-school)

## Medium Priority
- [ ] Playbook PDF reader / download with watermark
- [ ] Event submissions with file validation and size limits
- [ ] Candidate can cancel / request refund on mentorship
- [ ] Mentor can decline / reschedule mock sessions
- [ ] Calendar integration (Google Calendar) for mock sessions
- [ ] Notifications center (in-app + toast history)
- [ ] Reviews and ratings for mentors
- [ ] Blog / content section for MBA prep tips
- [ ] Mobile responsiveness audit and fixes

## Low Priority / Nice to Have
- [ ] Dark mode polish across all dashboards
- [ ] AI mock GD/PI evaluator (async feedback)
- [ ] Referral program for mentors and candidates
- [ ] Bulk import colleges via CSV
- [ ] OAuth login with Google / LinkedIn
- [ ] PWA support
- [ ] Multi-language support (Hinglish, Hindi)
- [ ] Gamification: badges, streaks, leaderboard

## Technical Debt
- [ ] Split large client bundle with dynamic imports
- [ ] Add more API unit tests (candidate, mentor, admin routers)
- [ ] E2E coverage for mentorship booking and event submission flows
- [ ] DB foreign key constraints and indexes
- [ ] Rate limiting on public routes
- [ ] Audit logging for admin/superadmin actions
- [ ] Replace `any` types in legacy code
- [ ] Move backend env validation to a typed schema (e.g. Zod)

## Done
- [x] Database schema + migrations + seed
- [x] Auth (register, login, logout, role-based access)
- [x] Candidate / Mentor / Admin / SuperAdmin dashboards
- [x] Mentor marketplace with detail pages
- [x] Event listing and submissions
- [x] Playbook store and purchases
- [x] Compare Colleges with filters and side-by-side comparison
- [x] LinkedIn profile URLs and public mentor profile pages
- [x] Terms & Conditions acceptance in registration
- [x] Footer, dashboard filler content, emoji cleanup
- [x] Lint, type-check, Vitest, Playwright passing
