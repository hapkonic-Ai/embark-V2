# Embark — Backlog / Todo

## High Priority
- [ ] Landing page polish — depicter-style hero animations, parallax, scroll-triggered reveals, loading animation
- [ ] Landing page copy — panic state of MBA, running counters, student outcomes story
- [ ] Footer redesign — more links, social proof, newsletter, trust badges
- [ ] Remove remaining AI-looking emojis across all dashboards and cards
- [ ] Mentor carousel redesign — professional photos, hover reveals details, pricing gated behind login
- [ ] Student images collage on hero with in/out stagger animation
- [ ] Campus role dashboard — manage guest lecture requests, view statuses (pending/accepted/rejected)
- [ ] Mentor guest lecture management — accept/reject requests + confirm date
- [ ] Public mentor profile LinkedIn sharing for Embark + view mentor LinkedIn as student
- [ ] Terms & Conditions page with actual legal copy and signature/acceptance tracking
- [ ] Candidate profile page to add LinkedIn, phone, resume
- [ ] Add student to mentor relationship view (mentor can see assigned students)

## Medium Priority
- [ ] Compare Colleges bigger UI + better comparison popup with logos and extracted details
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
- [ ] Replace remaining `any` types in legacy code
- [ ] Move backend env validation to a typed schema (e.g. Zod)

## Done
- [x] Database schema + migrations + seed
- [x] Auth (register, login, logout, role-based access)
- [x] Candidate / Mentor / Campus / Admin / SuperAdmin dashboards
- [x] Mentor marketplace with detail pages
- [x] Event listing and submissions
- [x] Playbook store and purchases
- [x] Compare Colleges with filters and side-by-side comparison
- [x] LinkedIn profile URLs and public mentor profile pages
- [x] Terms & Conditions acceptance in registration
- [x] Footer, dashboard filler content, emoji cleanup (partial)
- [x] Lint, type-check, Vitest, Playwright passing
- [x] PageHero added to Mentors, Events, Guest Lecturer, Playbooks, Colleges
- [x] Playbook cover image support in admin + store
- [x] Rebrand Hackathons → Events across the UI
