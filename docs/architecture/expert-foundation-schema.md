# Phase 1 — Expert Foundation Schema

## Date
2026-08-28

## Goal
Provide a stable foundation for the Expert marketplace while preserving the existing Mentor marketplace.

## Guiding Principle
`mentor_profiles` is the canonical Expert profile table for Phase 1. New columns are nullable so existing mentor records and public pages keep working unchanged. Future phases can rename the table when the Mentor → Expert transition is complete.

## Existing Entities (preserved)

| Entity | Table | Purpose |
|---|---|---|
| User | `users` | Identity, auth, roles |
| Mentor Profile | `mentor_profiles` | Legacy mentor public profile + now the canonical Expert profile |
| Mentorship | `mentorships` | Candidate-mentor package purchases |
| Mock Session | `mock_sessions` | Session scheduling/completion |
| Playbook | `playbooks` | Digital guides |
| Event | `events` | Competitions/hackathons |
| Submission | `submissions` | Event submissions (base64 files) |

## New / Extended Entities

### `users` (extended)
- Added `expert` to `role` enum.

### `mentor_profiles` (extended)
New expert-foundation columns:

| Column | Type | Purpose |
|---|---|---|
| `displayName` | varchar(120) | Public expert display name |
| `profileImage` | text | URL/data URI |
| `coverImage` | varchar(512) | Cover/banner image URL |
| `location` | varchar(128) | City/region |
| `country` | varchar(128) | Country |
| `timezone` | varchar(64) | IANA timezone |
| `currentRole` | varchar(255) | Current job title |
| `industries` | varchar(512) | Comma-separated industries |
| `languages` | varchar(512) | Comma-separated languages |
| `githubUrl` | varchar(320) | GitHub link |
| `portfolioUrl` | varchar(320) | Portfolio link |
| `websiteUrl` | varchar(320) | Personal website |
| `status` | enum | `draft` \| `onboarding` \| `active` \| `suspended` \| `deactivated` |
| `onboardingStatus` | enum | `not_started` \| `in_progress` \| `completed` |
| `verificationStatus` | enum | `not_started` \| `pending` \| `verified` \| `rejected` |
| `profileCompletionPercent` | int | 0–100 server-side completion |

Legacy columns (`headline`, `bschool`, `company`, `expertise`, `yearsExp`, `bio`, `whatsapp`, `linkedinUrl`, `price`, `mockGds`, `mockPis`, `isVerified`) remain populated for existing mentors.

### `expert_onboarding`
| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | Unique per expert |
| `currentStep` | varchar(64) | e.g. `account`, `resume`, `resume_review`, `profile`, `experience`, `education`, `expertise`, `services`, `verification`, `complete` |
| `status` | enum | `not_started` \| `in_progress` \| `completed` |
| `startedAt` | timestamp | |
| `completedAt` | timestamp | |
| `lastCompletedStep` | varchar(64) | Last step successfully completed |

### `file_assets`
Generic file entity. Phase 1 stores resume files as base64 (`data`) to match existing `submissions` pattern. `provider` column and `storageKey`/`url` allow future S3 migration without schema change.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `ownerId` | bigint FK → users | |
| `fileName` | varchar(255) | |
| `mimeType` | varchar(128) | |
| `size` | int | bytes |
| `provider` | varchar(64) | `database` or `s3` |
| `storageKey` | varchar(512) | S3 key if external |
| `url` | text | Public URL if external |
| `data` | longtext | base64 payload (Phase 1 fallback) |

### `expert_resumes`
One active resume per expert (`userId` unique). Parsed output is a *proposal*, not the source of truth.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | Unique |
| `fileAssetId` | bigint FK → file_assets | Unique |
| `status` | enum | `uploaded` \| `parsing` \| `parsed` \| `review_required` \| `verified` \| `failed` |
| `parserStatus` | enum | `not_started` \| `running` \| `success` \| `partial` \| `failed` |
| `parserProvider` | varchar(64) | e.g. `text-extractor` |
| `rawText` | longtext | Extracted raw text |
| `parsedData` | json | Structured parser proposal |
| `parsingError` | text | Error message if failed |
| `uploadedAt` / `parsedAt` / `verifiedAt` | timestamp | |

### `expert_experience`
Multiple experience entries per expert.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | |
| `company` | varchar(255) | |
| `role` | varchar(255) | |
| `employmentType` | varchar(64) | |
| `location` | varchar(128) | |
| `startDate` / `endDate` | varchar(32) | Free-form dates |
| `isCurrent` | boolean | |
| `description` | text | |
| `displayOrder` | int | Ordering |

### `expert_education`
Multiple education entries per expert.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | |
| `institution` | varchar(255) | |
| `degree` | varchar(255) | |
| `fieldOfStudy` | varchar(255) | |
| `startDate` / `endDate` | varchar(32) | |
| `grade` | varchar(64) | |
| `description` | text | |
| `displayOrder` | int | |

### `expert_verifications`
Verification lifecycle. Multiple rows per expert are allowed (history). The application treats the latest row as current.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | |
| `status` | enum | `not_started` \| `pending` \| `approved` \| `rejected` |
| `submittedAt` / `reviewedAt` | timestamp | |
| `reviewedBy` | bigint FK → users | Admin/superadmin reviewer |
| `rejectionReason` | text | |
| `verificationType` | varchar(64) | `profile_review` |
| `metadata` | json | Arbitrary review metadata |

## Relationships

```
users
├── mentor_profiles (1:1)
├── expert_onboarding (1:1)
├── expert_resumes (1:1)
├── expert_experience (1:many)
├── expert_education (1:many)
├── expert_verifications (1:many)
└── file_assets (1:many)

expert_resumes ──> file_assets (1:1 via fileAssetId)
expert_verifications ──> users (reviewedBy)
```

## Public vs Private Fields

**Public profile:** `displayName`, `headline`, `bio`, `profileImage`, `coverImage`, `location`, `country`, `currentRole`, `company`, `industries`, `expertise`, `languages`, `yearsExp`, `githubUrl`, `portfolioUrl`, `websiteUrl`, `linkedinUrl`, `expert_experience` (public entries), `expert_education` (public entries), `verificationStatus`.

**Private:** `whatsapp`, `email`, `phone`, `file_assets.data`, `expert_resumes.rawText`, `expert_resumes.parsedData`, `expert_verifications.rejectionReason`, `expert_verifications.metadata`, onboarding state.

## Profile Completion (server-side)

Required sections (initial):
- Basic info: `displayName` or `users.name`, `profileImage`, `headline`, `bio`
- Professional: `currentRole` or `company`, `yearsExp`, `expertise`
- Experience: at least one `expert_experience` row
- Education: at least one `expert_education` row (recommended, not required)
- Contact/identity: `linkedinUrl` or `portfolioUrl`

The backend computes `profileCompletionPercent` when profile/experience/education changes and persists it to `mentor_profiles.profileCompletionPercent`.

## Migration Notes
- All new columns on `mentor_profiles` are nullable/have defaults.
- Existing mentor records remain valid and public pages keep rendering.
- Enum change on `users.role` adds `expert` without data loss because values are not removed.
- Phase 2 can rename `mentor_profiles` → `expert_profiles` if desired.
