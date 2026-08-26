# Embark — Project Context

## Overview
Embark is an all-in-one MBA prep platform for Indian B-school aspirants. It connects candidates with verified mentors from top B-schools (IIMs, XLRI, ISB, etc.), hosts hackathons and case competitions, sells digital playbooks, and lets students compare every major MBA college in India side-by-side.

## Mission
Help CAT/XAT/SNAP/GMAT aspirants go from “I have no idea” to “I converted my call” by giving them mentorship, practice, competitions, and data-driven college decisions.

## Core Users & Roles

| Role | Who | What they do |
|------|-----|--------------|
| `candidate` | MBA aspirant | Books mentors, buys playbooks, joins events, compares colleges |
| `mentor` | B-school alum / working professional | Runs mock GDs/PIs, edits profile, shares public booking page |
| `admin` | Platform manager | Creates events, playbooks, reviews submissions |
| `superadmin` | Founder/owner | Verifies mentors, changes user roles |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v3, shadcn/ui |
| Backend | Hono 4, tRPC 11, TypeScript |
| Auth | Cookie-based JWT sessions + optional Kimi OAuth |
| Database | MySQL via mysql2, Drizzle ORM + Drizzle Kit |
| Testing | Vitest (API), Playwright (E2E) |
| Deployment | Node.js server serving static Vite build |

## Architecture
- `src/` — React SPA, pages, components, hooks, providers
- `api/` — Hono server, tRPC routers, auth middleware, queries
- `db/` — Drizzle schema, relations, migrations, seed
- `contracts/` — Shared types and constants

## Key Workflows
1. **Auth** — Email/password register/login, session cookie, role-based redirects
2. **Mentorship** — Candidate books verified mentor → payment modal → WhatsApp connect → mock sessions
3. **Events** — Admin creates hackathons/case comps → candidates submit decks → jury scores
4. **Compare Colleges** — Filter/sort colleges → pick up to 3 → side-by-side comparison
5. **Public Mentor Profile** — Mentor sets a slug → shares `/m/:slug` like TopMate → students book

## Non-Goals
- Real payment gateway integration (checkout is simulated for now)
- Mobile native apps
- Real-time chat beyond WhatsApp redirect

## Constraints
- MySQL/PlanetScale-compatible dialect
- Cookie-based auth requires secure settings in production
- File uploads stored as base64 in DB (temporary, inefficient)
