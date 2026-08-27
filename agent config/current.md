# Embark — Current Standing

Last updated: 2026-08-27

## Summary
Embark V2 is a fully runnable MVP. All five user roles can sign in and reach their dashboards (candidate, mentor, campus, admin, superadmin). The database is seeded with demo accounts, mentors, colleges, events, playbooks, and a sample mentorship. The app passes type-checks, lint, unit tests, E2E tests, and production build.

## What Works Now

### Auth & Roles
- Email/password registration and login
- Cookie-based JWT session (1-year expiry)
- Role-based route guards (candidate, mentor, campus, admin, superadmin)
- Demo accounts for all roles
- Optional Kimi OAuth button wired on login page
- Terms & Conditions acceptance on registration

### User Flows
| Flow | Status |
|------|--------|
| Candidate registration with T&C + LinkedIn URL | Working |
| Mentor registration with T&C + LinkedIn URL | Working |
| Candidate books mentor (simulated payment) | Working |
| Mentor sees mentees and schedules/completes sessions | Working |
| Candidate joins event / submits file | Working |
| Admin creates/manages events, playbooks, users | Working |
| SuperAdmin verifies mentors and changes roles | Working |
| Public mentor profile (`/m/:slug`) shareable like TopMate | Working |
| LinkedIn share from mentor dashboard | Working |
| Guest lecture request flow (campus → mentor) | Backend + UI scaffolded |

### Pages & Features
| Feature | Status |
|---------|--------|
| Landing page | In progress — Hero story, animations, student collage |
| Login / Register | Complete with T&C checkbox and LinkedIn field |
| Mentor marketplace (`/mentors`) | Complete with search, LinkedIn links, PageHero |
| Mentor detail (`/mentors/:id`) | Complete |
| Public mentor profile (`/m/:slug`) | Complete |
| Playbooks store (`/playbooks`) | Complete — cover images + PageHero |
| Events (`/events`, `/events/:id`) | Complete — Devfolio-style cards + PageHero |
| Compare Colleges (`/colleges`) | Complete — PageHero, logos, filters, comparison popup |
| Guest Lectures (`/guest-lecturer`) | Complete — PageHero, request dialog, pro photos |
| Candidate dashboard | Complete with footer, filler content |
| Mentor dashboard | Complete with public profile sharing |
| Admin dashboard | Complete |
| SuperAdmin dashboard | Complete |

### Database
- MySQL schema with 10 tables (users, mentor_profiles, mentorships, mock_sessions, playbooks, playbook_purchases, events, submissions, colleges, guest_lecture_requests)
- Drizzle ORM + generated migrations (`0000`–`0004`)
- Seed script populates users, mentors, playbooks, events, colleges, demo mentorship

### Testing
- Vitest API test: `api/routers/account.test.ts` — 3/3 passing
- Playwright E2E: `tests/auth-roles.spec.ts` — 6/6 passing
- Type-check, lint, build all passing

## Recent Changes (2026-08-27)
- Added shared `PageHero` component and applied it to Mentors, Events, Guest Lecturer, Playbooks, and Compare Colleges pages.
- Added `coverImage` column to playbooks; admin can upload/edit cover image URLs; Playbooks store shows cover images with deterministic Unsplash fallback.
- Rebranded "Hackathons" → "Events" across navbar, admin dashboard, and landing page.
- Redesigned landing Hero to tell a mentorship story with student images on the right and staggered floating-card animations.
- Removed AI-looking "Admissions 2026" pill from the landing Hero.
- Cleaned up unused imports and explicit `any` types in GuestLecturer page.

## Known Gaps / Next Steps
- Payment is simulated (no real gateway)
- File uploads stored as base64 in DB
- No email/SMS notifications
- Terms & Privacy pages are placeholder links
- No production deployment config
- Client bundle is large (~900 KB)
- Footer is basic and needs more links/social proof
- Hero animations can be richer (parallax, 3D, loading state)
- Campus dashboard needs dedicated management UI for guest lectures
- Mentor carousel should reveal details on hover and require login for pricing

## Commands to Run
```bash
# Install dependencies
npm install

# Start local MySQL (if not running)
docker run -d --name embark-mysql -e MYSQL_ROOT_PASSWORD=embark123 -e MYSQL_DATABASE=embark -p 3306:3306 mysql:8.0 --default-authentication-plugin=mysql_native_password

# Migrate & seed
npx drizzle-kit migrate
npx tsx db/seed.ts

# Dev server
npm run dev

# Production server
npm run build
npm start

# Tests
npm run check
npm run lint
npm test
npx playwright test tests/auth-roles.spec.ts
```

## Demo Accounts
| Email | Password | Role |
|---|---|---|
| candidate@embark.in | Embark@123 | candidate |
| rohan@embark.in | Embark@123 | mentor |
| campus@embark.in | Embark@123 | campus |
| admin@embark.in | Embark@123 | admin |
| superadmin@embark.in | Embark@123 | superadmin |
