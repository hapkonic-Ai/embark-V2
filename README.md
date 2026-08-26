# Embark

An all-in-one MBA prep platform for Indian B-school aspirants. Find verified mentors, join hackathons and case competitions, buy playbooks, and compare every major MBA college in India side-by-side.

```bash
npm install
npm run dev
```

## What it does

- **Mentorship** — Candidates book verified mentors from IIMs, XLRI, ISB, FMS, and more for mock GDs/PIs.
- **Competitions** — Admin creates hackathons/case competitions; candidates submit decks and get scored.
- **Playbooks** — Digital guides for GD, PI, WAT, case competitions, and resume building.
- **Compare Colleges** — Filter, sort, and compare MBA colleges by fees, packages, NIRF rank, exams, and cutoffs.
- **Public Mentor Profiles** — Mentors get a shareable `/m/:slug` page (TopMate-style) with LinkedIn sharing.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 · TypeScript · Vite 7 · Tailwind CSS v3 · shadcn/ui |
| Backend | Hono 4 · tRPC 11 · TypeScript |
| Auth | Cookie-based JWT sessions + optional Kimi OAuth |
| Database | MySQL · Drizzle ORM |
| Tests | Vitest (API) · Playwright (E2E) |

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        React[React SPA]
        RQ[React Query]
    end

    subgraph Server
        Hono[Hono Server]
        tRPC[tRPC Router]
        Auth[Auth Middleware]
    end

    subgraph Data
        MySQL[(MySQL)]
        Drizzle[Drizzle ORM]
    end

    React -->|HTTP /api/trpc| Hono
    Hono --> tRPC
    tRPC --> Auth
    Auth --> Drizzle
    Drizzle --> MySQL
```

## Auth & Roles

```mermaid
flowchart LR
    A[Visitor] -->|Register/Login| B{Role?}
    B -->|candidate| C[Candidate Dashboard]
    B -->|mentor| D[Mentor Dashboard]
    B -->|admin| E[Admin Dashboard]
    B -->|superadmin| F[SuperAdmin Dashboard]
```

## Project Structure

```
Embark/
├── api/                # Hono server, tRPC routers, auth, queries
├── contracts/          # Shared types & constants
├── db/                 # Drizzle schema, relations, migrations, seed
├── src/                # React frontend
│   ├── components/     # UI components + site layout
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Route pages
│   ├── providers/      # tRPC + React Query provider
│   └── sections/       # Landing page sections
├── tests/              # Playwright E2E tests
└── package.json
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/hapkonic-Ai/embark-V2.git
cd embark-V2
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
APP_ID=embark-local
APP_SECRET=local-dev-secret
DATABASE_URL=mysql://root:embark123@127.0.0.1:3306/embark
KIMI_AUTH_URL=https://auth.kimi.com
KIMI_OPEN_URL=https://open.kimi.com
VITE_KIMI_AUTH_URL=https://auth.kimi.com
VITE_APP_ID=embark-local
```

### 3. Start MySQL

```bash
docker run -d --name embark-mysql \
  -e MYSQL_ROOT_PASSWORD=embark123 \
  -e MYSQL_DATABASE=embark \
  -p 3306:3306 \
  mysql:8.0 --default-authentication-plugin=mysql_native_password
```

### 4. Migrate and seed

```bash
npx drizzle-kit migrate
npx tsx db/seed.ts
```

### 5. Run dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `candidate@embark.in` | `Embark@123` | candidate |
| `rohan@embark.in` | `Embark@123` | mentor |
| `admin@embark.in` | `Embark@123` | admin |
| `superadmin@embark.in` | `Embark@123` | superadmin |

## Useful Scripts

```bash
npm run dev        # Start Vite + Hono dev server
npm run build      # Build production bundle
npm run check      # TypeScript check
npm run lint       # ESLint
npm test           # Vitest API tests
npx playwright test tests/auth-roles.spec.ts  # E2E tests
npx tsx db/seed.ts # Re-seed database
```

## Key Features Roadmap

```mermaid
flowchart LR
    subgraph Done
        D1[Auth & Roles]
        D2[Mentor Marketplace]
        D3[Events & Submissions]
        D4[Playbooks]
        D5[Compare Colleges]
        D6[Public Mentor Pages]
    end

    subgraph Next
        N1[Real Payments]
        N2[S3 File Uploads]
        N3[Email Notifications]
        N4[Analytics Dashboard]
    end

    D1 --> N1
    D2 --> N4
    D3 --> N2
    D4 --> N3
```

## Documentation

- `agent config/context.md` — Overall project context and architecture
- `agent config/current.md` — Current standing of the project
- `agent config/todo.md` — Backlog and upcoming work

## License

Private — all rights reserved.
