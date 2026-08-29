# Phase 2 — Expert Page Schema

## Date

2026-08-29

## Goal

Allow every verified/active Expert to own a customizable, publishable public page without duplicating canonical profile data. The Expert Page is a **presentation layer** on top of Phase 1 entities.

## Guiding Principle

- **Canonical data stays in Phase 1 tables:** `mentor_profiles`, `expert_experience`, `expert_education`, and the skill/ expertise fields on the profile.
- **Phase 2 only owns presentation:** what is shown, in which order, under which theme/branding, and whether a section is visible.
- No second profile system is created.

## Existing Entities Reused (Phase 1)

| Entity | Table | Phase 2 Responsibility |
|---|---|---|
| User | `users` | Identity / role |
| Mentor Profile (canonical Expert profile) | `mentor_profiles` | Source of truth for display name, headline, bio, image, social links, verification status, etc. |
| Expert Experience | `expert_experience` | Source of truth for EXPERIENCE section |
| Expert Education | `expert_education` | Source of truth for EDUCATION section |
| Expert Resume | `expert_resumes` | Source material; not rendered directly on the public page |
| Expert Verification | `expert_verifications` | Source of verification badge state |
| File Asset | `file_assets` | Cover / OG image / profile image storage (reused upload infrastructure) |

## New Phase 2 Entities

### `expert_pages`

The public page identity and lifecycle. One row per expert (`userId` unique).

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `userId` | bigint FK → users | Unique per expert |
| `slug` | varchar(64) unique | Public URL slug, e.g. `/m/john-doe` |
| `status` | enum | `draft` \| `published` \| `unpublished` |
| `metaTitle` | varchar(120) | SEO `<title>` override |
| `metaDescription` | varchar(255) | SEO meta description override |
| `ogImage` | text | Open Graph / share image URL |
| `publishedAt` | timestamp | Last publish moment |
| `createdAt` / `updatedAt` | timestamp | |

### `expert_page_configs`

Presentation configuration. One row per page (`pageId` unique).

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `pageId` | bigint FK → expert_pages | Unique |
| `theme` | varchar(32) | `minimal` \| `professional` \| `modern` |
| `accentColor` | varchar(7) | `#RRGGBB`, validated server-side |
| `background` | varchar(32) | `light` \| `dark` \| `muted` |
| `profileImageStyle` | varchar(32) | `rounded` \| `square` \| `circle` |
| `coverStyle` | varchar(32) | `gradient` \| `image` \| `solid` \| `none` |
| `buttonStyle` | varchar(32) | `rounded` \| `square` \| `pill` |
| `ctaType` | varchar(32) | `none` \| `booking` \| `service` \| `external_url` \| `contact` |
| `ctaLabel` | varchar(64) | Custom CTA label |
| `ctaTarget` | varchar(320) | URL/service id/contact destination |
| `createdAt` / `updatedAt` | timestamp | |

### `expert_page_sections`

Sections available on the page. Ordering, visibility, and small section-level config only.

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `pageId` | bigint FK → expert_pages | |
| `sectionType` | varchar(64) | `hero` \| `about` \| `experience` \| `education` \| `skills` \| `social_links` \| `cta` |
| `displayOrder` | int | Order on the page |
| `isVisible` | boolean | Whether the section renders publicly |
| `config` | json | Optional section-level presentation config (no canonical content) |
| `createdAt` / `updatedAt` | timestamp | |

Unique constraint: `(pageId, sectionType)`.

## Relationships

```
users (1:1)
└── expert_pages (1:1)
    ├── expert_page_configs (1:1)
    └── expert_page_sections (1:many)

expert_pages.userId ──> users.id
expert_page_configs.pageId ──> expert_pages.id
expert_page_sections.pageId ──> expert_pages.id
```

## Field Ownership

**Owned by Phase 1 (canonical data)**

- Name: `users.name` / `mentor_profiles.displayName`
- Headline: `mentor_profiles.headline`
- Bio: `mentor_profiles.bio`
- Profile image: `mentor_profiles.profileImage`
- Cover image: `mentor_profiles.coverImage`
- Location / timezone: `mentor_profiles.location`, `mentor_profiles.country`, `mentor_profiles.timezone`
- Social links: `mentor_profiles.linkedinUrl`, `mentor_profiles.githubUrl`, `mentor_profiles.portfolioUrl`, `mentor_profiles.websiteUrl`
- Experience: `expert_experience`
- Education: `expert_education`
- Skills / expertise: `mentor_profiles.expertise`, future `expert_skills`
- Verification status: `mentor_profiles.verificationStatus`

**Owned by Phase 2 (presentation only)**

- Page lifecycle: `expert_pages.status`, `expert_pages.publishedAt`
- SEO metadata: `expert_pages.metaTitle`, `expert_pages.metaDescription`, `expert_pages.ogImage`
- Theme / branding: `expert_page_configs.theme`, `accentColor`, `background`, `profileImageStyle`, `coverStyle`, `buttonStyle`
- CTA: `expert_page_configs.ctaType`, `ctaLabel`, `ctaTarget`
- Section order / visibility: `expert_page_sections.displayOrder`, `isVisible`
- Section-level config (e.g. layout variant): `expert_page_sections.config`

## Public vs Private Data

**Public** (rendered on published page and accessible via catalog endpoint):

- `expert_pages.slug`, `status`
- `mentor_profiles` public fields
- `expert_experience` / `expert_education`
- `expert_page_configs` theme/branding/CTA
- `expert_page_sections` order/visibility

**Private / internal**:

- `expert_resumes.rawText`, `expert_resumes.parsedData`
- `expert_verifications.rejectionReason`, `metadata`
- Draft `expert_page_sections` changes that have not been published

## Section Model

Default sections created when a page is initialized:

| Order | Section | Required | Default Visibility Rule |
|---|---|---|---|
| 1 | `hero` | yes | always visible |
| 2 | `about` | no | visible if `mentor_profiles.bio` exists |
| 3 | `experience` | no | visible if ≥1 experience row exists |
| 4 | `education` | no | visible if ≥1 education row exists |
| 5 | `skills` | no | visible if `mentor_profiles.expertise` is non-empty |
| 6 | `social_links` | no | visible if any social URL is present |
| 7 | `cta` | no | visible only if a valid CTA destination exists |

Sections are ordered by `displayOrder`. Visibility is stored per row. Hiding a section never deletes canonical data.

## Configuration Model

`expert_page_configs` stores controlled, validated values only. It does **not** store raw CSS, HTML, or arbitrary style objects. Theme/variant values are enums or strict string sets validated on the server.

Example valid configuration:

```json
{
  "theme": "professional",
  "accentColor": "#F97316",
  "background": "light",
  "profileImageStyle": "rounded",
  "coverStyle": "gradient",
  "buttonStyle": "rounded",
  "ctaType": "booking",
  "ctaLabel": "Book a session",
  "ctaTarget": null
}
```

## Publishing Lifecycle

```
Expert becomes eligible (verification passed / profile sufficient)
                ↓
        Default ExpertPage created (status = draft)
                ↓
        Default Config + Sections created
                ↓
        Expert edits in Page Builder
                ↓
        Preview renders from current draft sections/config
                ↓
        Publish → status = published, publishedAt = now
                ↓
        Public page renders from published page + canonical data
```

Editing a published page does **not** immediately change the public view. The public view reflects the last published draft. A separate preview mode renders the working draft.

## Slug Architecture

- The public route remains `/m/:slug` (reused from Phase 1 mentor public profile).
- The canonical Expert slug is stored on `expert_pages.slug`.
- A migration path is preserved: existing `mentor_profiles.publicSlug` values may be copied into `expert_pages.slug` during page creation if no explicit slug exists.
- Slug validation: URL-safe, lowercase, alphanumeric plus hyphen/underscore, length ≤ 64.

## Migration Strategy

- Migration `0005_thin_thing.sql` creates the three new Phase 2 tables.
- Existing mentor/expert rows remain usable; no data is lost.
- New tables are optional until an expert creates or publishes a page.
- Default page/config/section creation is performed by the application at the appropriate lifecycle moment (e.g. first verification approval or first visit to "My Page"), not by the migration itself.

## Future Extension Points

- New sections: add a new allowed `sectionType` value and update the default-section factory.
- New theme/brand options: extend allowed enums in the API validator and the config column default.
- CTA targets: add service/booking-specific resolution as services are implemented.
- Page analytics: add an `expert_page_views` or analytics table; not needed for Phase 2.
