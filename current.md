# Embark — Current Standing

Last updated: 2026-08-26

## Summary
Embark V2 is a fully runnable MVP. All four user roles can sign in and reach their dashboards. The database is seeded with demo accounts, mentors, colleges, events, and a sample mentorship. The app passes type-checks, lint, unit tests, E2E tests, and production build.

## What Works Now

### Auth & Roles
- Email/password registration and login
- Cookie-based JWT session (1-year expiry)
- Role-based route guards (candidate, mentor, admin, superadmin)
- Demo accounts for all roles
- Optional Kimi OAuth button wired on login page

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

### Pages & Features
| Feature | Status |
|---------|--------|
| Landing page | Complete |
| Login / Register | Complete with T&C checkbox and LinkedIn field |
| Mentor marketplace (`/mentors`) | Complete with search, LinkedIn links |
| Mentor detail (`/mentors/:id`) | Complete |
| Public mentor profile (`/m/:slug`) | Complete |
| Playbooks store (`/playbooks`) | Complete |
| Events (`/events`, `/events/:id`) | Complete |
| Compare Colleges (`/colleges`) | Complete with logos, filters, comparison popup |
| Candidate dashboard | Complete with footer, filler content, no emojis |
| Mentor dashboard | Complete with public profile sharing |
| Admin dashboard | Complete |
| SuperAdmin dashboard | Complete |

### Database
- MySQL schema with 9 tables
- Drizzle ORM + generated migrations (`0000`, `0001`, `0002`)
- Seed script populates users, mentors, playbooks, events, colleges, demo mentorship

### Testing
- Vitest API test: `api/routers/account.test.ts` — 3/3 passing
- Playwright E2E: `tests/auth-roles.spec.ts` — 6/6 passing
- Type-check, lint, build all passing

## Known Gaps / Next Steps
- Payment is simulated (no real gateway)
- File uploads stored as base64 in DB
- No email/SMS notifications
- Terms & Privacy pages are placeholder links
- No production deployment config
- Client bundle is large (~900 KB)

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

# Tests
npm run check
npm run lint
npm test
npx playwright test tests/auth-roles.spec.ts
npm run build
```

## Demo Accounts
| Email | Password | Role |
|---|---|---|
| candidate@embark.in | Embark@123 | candidate |
| rohan@embark.in | Embark@123 | mentor |
| admin@embark.in | Embark@123 | admin |
| superadmin@embark.in | Embark@123 | superadmin |
