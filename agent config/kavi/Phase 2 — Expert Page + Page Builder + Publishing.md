# MASTER DEVELOPMENT PROMPT

# PHASE 2 — EXPERT PAGE

## ROLE

You are working on the **Embark** application.

Act as a:

* Senior Product Engineer
* Senior Full-Stack Engineer
* Frontend Engineer
* Backend Engineer
* Database Architect
* UX Engineer
* Security Engineer
* QA Engineer
* Software Architect

You have already implemented **Phase 1 — Expert Foundation**.

Phase 1 established:

* Expert identity
* Expert onboarding
* Expert profile
* Resume parsing
* Experience
* Education
* Skills
* Profile completion
* Verification
* Expert Dashboard

Your task is now to implement:

# PHASE 2 — EXPERT PAGE

The objective is to allow every eligible Expert to create, customize, preview, publish, unpublish, and manage a professional public-facing Expert Page.

---

# 1. PRIMARY PRODUCT OBJECTIVE

The final user flow must be:

```text
Expert Dashboard
       ↓
My Page
       ↓
Customize
       ↓
Page Builder
       ↓
Configure Sections
       ↓
Reorder Sections
       ↓
Show / Hide Sections
       ↓
Customize Branding
       ↓
Configure Cover
       ↓
Configure CTA
       ↓
Preview
       ↓
Save Draft
       ↓
Publish
       ↓
Public Expert Page
       ↓
Share Public URL
```

An Expert must be able to control how their professional information is **presented publicly** without creating duplicate profile data.

---

# 2. NON-NEGOTIABLE ARCHITECTURAL PRINCIPLE

## DO NOT CREATE A SECOND PROFILE SYSTEM

There must be a strict distinction between:

### CANONICAL EXPERT DATA

Owned by Phase 1:

```text
Expert
ExpertProfile
ExpertExperience[]
ExpertEducation[]
ExpertSkill[]
ExpertResume
ExpertVerification
FileAsset
```

### PAGE PRESENTATION DATA

Owned by Phase 2:

```text
ExpertPage
ExpertPageConfig
ExpertPageSection[]
```

The relationship must be:

```text
Canonical Expert Data
        │
        ▼
   ExpertProfile
        │
 ┌──────┼────────┐
 ▼      ▼        ▼
Bio   Experience Skills
 │      │        │
 └──────┼────────┘
        ▼
   Expert Page
        │
   ┌────┴────┐
   ▼         ▼
Config    Sections
   │         │
   └────┬────┘
        ▼
 Page Renderer
        │
   ┌────┴────┐
   ▼         ▼
Preview    Published
```

The Expert Page controls:

* What is shown
* What is hidden
* Section order
* Layout
* Theme
* Branding
* Cover
* CTA
* Presentation configuration

It must NOT duplicate:

* Name
* Headline
* Bio
* Experience
* Education
* Skills
* Profile image
* Social links

unless a deliberate page-specific override is explicitly required.

---

# 3. SOURCE OF TRUTH RULE

The Expert Profile remains the source of truth.

For example:

```text
ExpertProfile.bio
       ↓
ABOUT section
```

```text
ExpertExperience[]
       ↓
EXPERIENCE section
```

```text
ExpertEducation[]
       ↓
EDUCATION section
```

```text
ExpertSkill[]
       ↓
SKILLS section
```

```text
ExpertProfile.linkedinUrl
       ↓
SOCIAL LINKS section
```

If the Expert edits their canonical profile:

```text
ExpertProfile.headline
       ↓
Public Expert Page
```

the public page must reflect the new value automatically.

The Expert must NOT need to update the same information twice.

---

# 4. FIRST STEP — REPOSITORY AUDIT

## DO NOT WRITE CODE IMMEDIATELY.

Before making changes, inspect the entire repository.

Understand the actual application.

Inspect:

```text
package.json
project structure
frontend framework
backend framework
database
ORM
authentication
authorization
routing
API conventions
validation
file uploads
storage
design system
existing components
existing dashboard
Expert models
Mentor models
Profile models
Experience models
Education models
Skill models
Verification models
```

Also inspect all Phase 1 implementation relevant to:

```text
Expert
ExpertProfile
ExpertExperience
ExpertEducation
ExpertSkill
ExpertResume
ExpertVerification
ExpertDashboard
Expert onboarding
Profile image
Upload infrastructure
```

---

# 5. EXISTING PUBLIC PAGE AUDIT

Search the repository for existing public mentor/profile functionality.

Specifically inspect:

```text
/mentors/:id
/m/:slug
```

and any equivalent routes.

Determine:

* Which route is currently canonical
* How the public profile is fetched
* What data it exposes
* Whether it is server-rendered
* Whether it is client-rendered
* Whether it is indexable
* How verification is handled
* How inactive Experts are handled
* How slugs work
* Whether the route already has SEO
* Whether existing pages are shareable
* Whether existing public pages should be upgraded rather than replaced

## IMPORTANT

Do NOT create a competing public profile architecture if the existing implementation can safely become the Phase 2 Expert Page.

Choose one canonical architecture.

Document the decision.

---

# 6. BEFORE IMPLEMENTATION — SCHEMA CHECKPOINT

Before modifying the database, create a schema proposal.

The expected conceptual model is:

| Entity             | Responsibility                    | Phase 2       |
| ------------------ | --------------------------------- | ------------- |
| Expert             | Identity/state                    | Reuse Phase 1 |
| ExpertProfile      | Canonical professional data       | Reuse Phase 1 |
| ExpertExperience   | Experience                        | Reuse Phase 1 |
| ExpertEducation    | Education                         | Reuse Phase 1 |
| ExpertSkill        | Skills                            | Reuse Phase 1 |
| ExpertResume       | Resume source                     | Reuse Phase 1 |
| ExpertVerification | Verification                      | Reuse Phase 1 |
| FileAsset          | Files                             | Reuse Phase 1 |
| ExpertPage         | Public page identity/lifecycle    | Create        |
| ExpertPageConfig   | Page presentation settings        | Create        |
| ExpertPageSection  | Ordering/visibility/configuration | Create        |

Do NOT create unnecessary entities.

For example:

```text
DO NOT create:
ExpertPageProfile
ExpertPageExperience
ExpertPageEducation
ExpertPageSkills
```

unless there is an extraordinary architectural requirement.

---

# 7. DATABASE RELATIONSHIP

Implement this conceptual relationship:

```text
User
 │
 └── Expert
      │
      ├── ExpertProfile
      ├── ExpertExperience[]
      ├── ExpertEducation[]
      ├── ExpertSkill[]
      ├── ExpertResume[]
      ├── ExpertVerification
      │
      └── ExpertPage
            │
            ├── ExpertPageConfig
            │
            └── ExpertPageSection[]
```

The ExpertPage references the Expert.

The ExpertPage does NOT replace ExpertProfile.

---

# 8. CREATE ARCHITECTURE DOCUMENTATION FIRST

Create:

```text
docs/architecture/expert-page-schema.md
```

Document:

1. Existing Phase 1 schema
2. New Phase 2 entities
3. Entity relationships
4. Field ownership
5. Public/private data
6. Section model
7. Configuration model
8. Publishing lifecycle
9. Slug architecture
10. Migration strategy
11. Future extension points

Also update:

```text
docs/architecture/schema-change-log.md
```

with all Phase 2 database changes.

---

# 9. EXPERT PAGE ENTITY

Create a canonical:

```text
ExpertPage
```

Conceptually:

```text
id
expertId
slug
status
publishedAt
createdAt
updatedAt
```

Potential metadata:

```text
metaTitle
metaDescription
ogImage
```

Only add fields that are genuinely required.

---

# 10. EXPERT PAGE STATUS

Implement an explicit lifecycle.

Initial states:

```text
DRAFT
PUBLISHED
UNPUBLISHED
```

Do not add additional states unless the existing application actually requires them.

Lifecycle:

```text
Expert Profile
     ↓
ExpertPage automatically created
     ↓
DRAFT
     ↓
Customize
     ↓
Preview
     ↓
Publish
     ↓
PUBLISHED
```

Editing a published page should NOT accidentally break the currently public page.

---

# 11. DRAFT VS PUBLISHED STATE

Prefer a proper draft/published separation when practical.

Required behavior:

```text
Current Public Version
        │
        ├── Public user sees published state
        │
        └── Expert edits draft
                 │
                 ▼
              Preview
                 │
                 ▼
              Publish
                 │
                 ▼
          Public version updates
```

Example:

```text
PUBLIC:
ABOUT = visible
```

Expert edits:

```text
ABOUT = hidden
```

Before publishing:

```text
Preview → ABOUT hidden
Public  → ABOUT visible
```

After publishing:

```text
Preview → ABOUT hidden
Public  → ABOUT hidden
```

This behavior must be verified through focused integration/manual testing.

---

# 12. PAGE CONFIGURATION

Create:

```text
ExpertPageConfig
```

or a strictly validated configuration structure.

Potential settings:

```text
theme
accentColor
background
layout
profileImageStyle
coverStyle
buttonStyle
```

Do NOT store arbitrary CSS.

Do NOT allow:

```text
raw CSS
raw HTML
JavaScript
arbitrary style objects
```

If using JSON configuration, define a strict validation schema.

Example:

```json
{
  "theme": "PROFESSIONAL",
  "branding": {
    "accentColor": "#2563EB",
    "background": "LIGHT"
  },
  "hero": {
    "showProfileImage": true,
    "showLocation": true,
    "showVerification": true
  }
}
```

Only supported values may be accepted.

---

# 13. SUPPORTED THEMES

Start with a small controlled theme system.

Example:

```text
MINIMAL
PROFESSIONAL
MODERN
```

Themes control:

```text
Typography
Spacing
Cards
Sections
Buttons
Visual hierarchy
```

Do NOT create arbitrary CSS customization.

Theme values must be enums or strictly validated values.

---

# 14. PAGE SECTIONS

Phase 2 should initially support:

```text
HERO
ABOUT
EXPERIENCE
EDUCATION
SKILLS
SOCIAL_LINKS
CTA
```

Future sections may eventually include:

```text
SERVICES
PACKAGES
AVAILABILITY
REVIEWS
TESTIMONIALS
ACHIEVEMENTS
CERTIFICATIONS
MEDIA
FAQ
```

Do NOT implement fake future sections.

However, the architecture must allow future sections to be added without rewriting the Page Builder.

---

# 15. SECTION ENTITY

Create:

```text
ExpertPageSection
```

Conceptually:

```text
id
pageId
sectionType
displayOrder
isVisible
config
createdAt
updatedAt
```

The section stores **presentation configuration**, not canonical profile content.

BAD:

```json
{
  "sectionType": "ABOUT",
  "content": "John has 8 years of experience..."
}
```

GOOD:

```json
{
  "sectionType": "ABOUT",
  "isVisible": true
}
```

The renderer obtains the actual bio from:

```text
ExpertProfile.bio
```

---

# 16. SECTION ORDERING

Experts must be able to reorder sections.

Default:

```text
1 HERO
2 ABOUT
3 EXPERIENCE
4 EDUCATION
5 SKILLS
6 SOCIAL_LINKS
7 CTA
```

Example custom order:

```text
1 HERO
2 ABOUT
3 SKILLS
4 EXPERIENCE
5 CTA
6 EDUCATION
7 SOCIAL_LINKS
```

Persist the ordering server-side.

Never rely only on frontend array order.

Use:

```text
displayOrder
```

or an equivalent robust ordering mechanism.

---

# 17. SECTION VISIBILITY

Experts must be able to show/hide sections.

Example:

```text
ABOUT         ✓
EXPERIENCE    ✓
EDUCATION     ○
SKILLS        ✓
SOCIAL LINKS  ✓
```

Hidden state must persist.

Public rendering must respect it.

IMPORTANT:

```text
Hide Education
```

must NOT delete:

```text
ExpertEducation[]
```

It only changes page presentation.

---

# 18. DEFAULT PAGE CREATION

When an Expert becomes eligible for an Expert Page:

Automatically create:

```text
ExpertPage
ExpertPageConfig
ExpertPageSection[]
```

Default sections:

```text
HERO
ABOUT
EXPERIENCE
EDUCATION
SKILLS
SOCIAL_LINKS
CTA
```

Visibility should depend on actual data.

For example:

```text
No Education
    ↓
Education may be hidden by default
```

```text
No LinkedIn
    ↓
LinkedIn should not render
```

Do not create ugly empty public sections.

---

# 19. REQUIRED SECTIONS

At minimum:

```text
HERO = required
```

CTA is required only if there is an actual valid CTA destination.

Do not force an unusable CTA.

An Expert must not be able to remove a truly required section.

---

# 20. HERO SECTION

Hero should consume canonical Expert data.

Potential content:

```text
Profile image
Display name
Professional headline
Short description
Location
Verification badge
Primary CTA
Social links
```

Example:

```text
John Doe
Product Manager | Strategy | Growth

Helping professionals navigate product careers.

Verified Expert ✓

[Book a Session]
```

The Hero should not duplicate canonical fields.

---

# 21. PROFILE IMAGE

Reuse the Phase 1 profile image.

Do NOT create:

```text
pageProfileImage
```

unless there is a deliberate product requirement.

The Page may control:

```text
shape
size
placement
```

but should not duplicate the underlying asset.

---

# 22. COVER IMAGE

Implement configurable cover support.

Possible settings:

```text
cover image
visibility
position
style
overlay
height
```

Reuse the existing upload infrastructure.

Inspect the existing upload architecture and determine how files are stored and served.

If the existing architecture uses different storage for development and production, preserve that architecture.

Do NOT create a second upload/storage system.

Cover upload must be:

* Authenticated
* Authorized
* Validated
* Secure
* Stored through existing infrastructure
* Optimized if existing infrastructure supports it

---

# 23. BRANDING CONTROLS

Initial supported controls:

```text
Theme
Accent color
Button style
Background style
Profile image shape
Cover style
```

Example:

```text
Theme:
MINIMAL
PROFESSIONAL
MODERN
```

```text
Button:
ROUNDED
SQUARE
PILL
```

Do NOT allow arbitrary CSS.

---

# 24. ACCENT COLOR

If custom accent colors are supported:

Accept controlled values such as:

```text
#RRGGBB
```

Validate server-side.

Consider contrast.

The page must remain readable regardless of selected color.

Possible behavior:

```text
Invalid color → reject
Poor contrast → constrain / reject / choose safe foreground
```

Never inject raw CSS.

---

# 25. CTA SYSTEM

Implement a configurable CTA model.

Potential types:

```text
NONE
BOOKING
SERVICE
EXTERNAL_URL
CONTACT
```

Potential fields:

```text
ctaType
ctaTargetId
ctaLabel
```

However, only implement CTA destinations that actually exist.

If booking/services are not implemented yet:

DO NOT create:

```text
Book Now
```

that leads nowhere.

Instead:

* Hide CTA
* Use an actually supported destination
* Or clearly mark unavailable

No fake functionality.

---

# 26. FUTURE CTA COMPATIBILITY

Design the CTA architecture so future phases can support:

```text
Booking
Services
Packages
Contact
```

without redesigning the Page Builder.

Future relationship:

```text
CTA
 ↓
ExpertService
ExpertPackage
Booking
```

Do not implement those future systems in Phase 2.

---

# 27. PAGE BUILDER ROUTE

Create:

```text
/expert/page
```

or follow the project's existing route conventions.

The Page Builder must contain:

```text
PAGE BUILDER

[Preview]
[Publish]

PAGE SECTIONS

☰ Hero                 Visible
☰ About                Visible
☰ Experience           Visible
☰ Education            Hidden
☰ Skills               Visible
☰ Social Links         Visible
☰ CTA                  Visible
```

Each section must support:

```text
Reorder
Show/hide
Configure
Reset where applicable
```

Use accessible drag-and-drop.

Provide keyboard-accessible alternatives.

---

# 28. SECTION CONFIGURATION

Section-level configuration may include presentation controls.

Hero:

```text
showProfileImage
showLocation
showVerification
showSocialLinks
```

About:

```text
showHeading
headingText
```

Experience:

```text
showCompany
showDates
showDescriptions
```

CTA:

```text
enabled
label
type
target
```

Do NOT create configuration fields for canonical profile data.

---

# 29. PAGE RENDERER ARCHITECTURE

Create a shared:

```text
ExpertPageRenderer
```

The same renderer must support:

```text
mode = PREVIEW
mode = PUBLIC
```

Architecture:

```text
ExpertPageRenderer
       ↓
SectionRenderer
       ↓
sectionType
       ↓
HERO
ABOUT
EXPERIENCE
EDUCATION
SKILLS
SOCIAL_LINKS
CTA
```

Preview and public rendering must use the same visual components.

Do NOT create separate duplicated rendering systems for preview and public pages.

---

# 30. PREVIEW MODE

The Expert must be able to preview draft changes.

Support:

```text
Desktop preview
Mobile preview
```

where practical.

Preview must show:

```text
Draft configuration
```

Public page must show:

```text
Published configuration
```

They must not accidentally read the same state.

---

# 31. SAVE BEHAVIOR

Choose the behavior based on the existing application's conventions.

Preferred:

```text
Autosave configuration changes
+
Explicit Publish
```

If autosave is implemented:

* Debounce requests
* Show Saving state
* Show Saved state
* Handle failure
* Prevent race conditions
* Avoid overwriting newer changes

UI states:

```text
Saving...
Saved ✓
Unsaved changes
Save failed — Retry
```

Never silently lose changes.

---

# 32. PUBLISH FLOW

Publishing must follow:

```text
Expert
 ↓
Validate Expert
 ↓
Validate Profile
 ↓
Validate Page
 ↓
Validate Required Sections
 ↓
Validate Page Configuration
 ↓
Validate Slug
 ↓
Validate Public Visibility Requirements
 ↓
Publish
 ↓
Set publishedAt
 ↓
Invalidate/revalidate public page
```

Do not publish invalid pages.

---

# 33. VERIFICATION RULE

Inspect the Phase 1 verification policy.

Do not invent a new verification policy.

If Phase 1 requires verification before public publishing, enforce it.

If Phase 1 does not require verification for publishing, do not add the restriction.

The existing product rules are authoritative.

---

# 34. UNPUBLISH

If appropriate, implement:

```text
PUBLISHED
   ↓
UNPUBLISH
   ↓
Page no longer publicly accessible
```

The draft/configuration must remain intact.

Do NOT delete:

```text
Expert
ExpertProfile
ExpertPage
ExpertPageConfig
ExpertPageSection
```

---

# 35. PUBLIC URL

Create or reuse a stable public slug.

Preferred architecture if compatible:

```text
/m/:slug
```

or:

```text
/experts/:slug
```

Do not expose internal database IDs unless required by the existing architecture.

Slug requirements:

```text
unique
URL-safe
lowercase
human-readable
stable
```

Example:

```text
john-doe
john-doe-2
```

---

# 36. SLUG EDITING

Determine whether Experts should be able to edit their slug.

If supported:

* Validate
* Check uniqueness
* Prevent reserved words
* Preserve URL safety
* Avoid silently breaking existing links

Prefer redirects when a published slug changes.

Never silently break previously shared URLs.

---

# 37. PUBLIC VISIBILITY

Define one exact public visibility rule.

For example:

```text
page.status = PUBLISHED
AND
expert.status = ACTIVE
AND
verification requirements satisfied
```

Only use conditions that actually exist in the application.

Direct access to:

```text
/m/some-slug
```

must NEVER expose:

```text
DRAFT
UNPUBLISHED
private profile
private resume
verification documents
```

---

# 38. PUBLIC API SECURITY

Public API responses must contain ONLY public information.

Never expose:

```text
email
phone
private resume
verification documents
admin notes
onboarding state
parser metadata
internal IDs unnecessarily
private page configuration
```

Public:

```text
Published Expert Page
        ↓
Public Profile Data
```

Private:

```text
Authenticated Expert
        ↓
Own Expert Page
        ↓
Own Draft
        ↓
Private configuration
```

---

# 39. AUTHORIZATION

Every page mutation must derive ownership from the authenticated user.

NEVER trust:

```json
{
  "expertId": "another-user"
}
```

from request input.

Correct:

```text
Authenticated Session
        ↓
Resolve current Expert
        ↓
Resolve owned ExpertPage
        ↓
Verify ownership
        ↓
Mutation
```

Expert A must never modify Expert B's page.

---

# 40. SECURITY REQUIREMENTS

Verify all of the following:

```text
Expert A cannot edit Expert B's page
Expert A cannot edit Expert B's sections
Expert A cannot change Expert B's slug
Expert A cannot access Expert B's private configuration
Student cannot access Page Builder
Student cannot publish
Public user cannot access draft
Public user cannot access unpublished page
Public user cannot access private resume
Public user cannot access verification documents
Invalid URLs rejected
Invalid colors rejected
Unknown themes rejected
Unknown section types rejected
Arbitrary CSS rejected
Arbitrary HTML rejected
JavaScript injection rejected
Dangerous URL protocols rejected
```

---

# 41. SOCIAL LINKS

Render supported public links:

```text
LinkedIn
GitHub
Portfolio
Website
```

Validate URLs.

Only permit:

```text
http://
https://
```

Never permit:

```text
javascript:
data:
vbscript:
```

If arbitrary links are supported, validate them server-side.

---

# 42. SEO

Only published Expert Pages should be indexable.

Draft:

```text
noindex
```

Unpublished:

```text
noindex
```

Published:

```text
indexable
```

where product requirements permit.

Support:

```text
title
description
canonical URL
OpenGraph title
OpenGraph description
OpenGraph image
```

Use only public Expert information.

Do NOT use private resume content for SEO metadata.

---

# 43. RESPONSIVE DESIGN

Both the Page Builder and public page must work on:

```text
Desktop
Tablet
Mobile
```

Pay special attention to:

```text
Cover
Hero
Section ordering
Long bios
Experience timelines
CTA
Social links
Profile image
```

Do not design desktop-first and ignore mobile behavior.

---

# 44. ACCESSIBILITY

Page Builder:

```text
Keyboard accessible
Visible focus states
Semantic buttons
Accessible labels
Keyboard alternative to drag/drop
```

Public page:

```text
Semantic headings
Accessible links
Alt text
Accessible CTA
Sufficient contrast
Keyboard navigation
Responsive layout
```

Do not use color as the only state indicator.

---

# 45. EMPTY STATES

If an Expert has no education:

Do NOT render an ugly empty section.

Choose one consistent behavior:

```text
Hide section automatically
```

or:

```text
Show empty state only in editor/preview
```

Do not unexpectedly mutate saved configuration unless documented.

---

# 46. DATA OWNERSHIP MATRIX

Create and document:

| Data               | Canonical Owner   | Page Reads | Page Writes |
| ------------------ | ----------------- | ---------: | ----------: |
| Name               | Expert/Profile    |        Yes |          No |
| Headline           | ExpertProfile     |        Yes |          No |
| Bio                | ExpertProfile     |        Yes |          No |
| Experience         | ExpertExperience  |        Yes |          No |
| Education          | ExpertEducation   |        Yes |          No |
| Skills             | ExpertSkill       |        Yes |          No |
| Profile Image      | Profile/FileAsset |        Yes |          No |
| Cover              | Page/FileAsset    |        Yes |         Yes |
| Section Order      | ExpertPageSection |        Yes |         Yes |
| Section Visibility | ExpertPageSection |        Yes |         Yes |
| Theme              | ExpertPageConfig  |        Yes |         Yes |
| CTA                | ExpertPageConfig  |        Yes |         Yes |
| Slug               | ExpertPage        |        Yes |         Yes |
| Publish Status     | ExpertPage        |        Yes |         Yes |

Adjust according to the actual final schema.

---

# 47. API DESIGN

First inspect existing API conventions.

Then implement only the endpoints actually required.

Possible conceptual APIs:

```text
GET    /api/expert/page
PATCH  /api/expert/page

GET    /api/expert/page/sections
PATCH  /api/expert/page/sections

PATCH  /api/expert/page/config

POST   /api/expert/page/publish
POST   /api/expert/page/unpublish

GET    /api/public/experts/:slug
```

Do NOT blindly implement every route.

Prefer clean transactional endpoints when appropriate.

---

# 48. ATOMIC UPDATES

Operations such as:

```text
Reordering
Visibility changes
Branding changes
CTA changes
Publishing
```

must not leave the page in a corrupt state.

Use database transactions where multiple records must change together.

Example:

BAD:

```text
1 HERO
1 ABOUT
3 EXPERIENCE
```

GOOD:

```text
1 HERO
2 ABOUT
3 EXPERIENCE
```

---

# 49. VALIDATION

Validate server-side:

```text
Expert ownership
Page ownership
Slug
Theme
Accent color
Section type
Display order
Visibility
CTA
CTA target
External URL
Cover asset
Configuration
```

Reject:

```text
Unknown section type
Unknown theme
Invalid color
Invalid URL
Invalid CTA target
Duplicate display order
Unauthorized mutations
Malformed configuration
```

Never rely solely on frontend validation.

---

# 50. PERFORMANCE

Public Expert Pages should be fast.

Avoid N+1 queries.

Do NOT make:

```text
1 request per section
```

Prefer one efficient server-side composition/query that loads:

```text
Expert
+
ExpertProfile
+
Experience
+
Education
+
Skills
+
Published Page
+
Published Config
+
Published Sections
```

Only load what is required.

---

# 51. CACHING

Determine whether the current framework supports public-page caching/revalidation.

Because public pages change less frequently, consider:

```text
cache
revalidation
ISR
server-side caching
```

When publishing:

```text
invalidate/revalidate public page
```

When unpublishing:

```text
invalidate public page
```

Do not serve stale unpublished pages indefinitely.

---

# 52. EXISTING UPLOAD INFRASTRUCTURE

Reuse the existing upload system.

Do NOT create a second upload/storage architecture if the existing infrastructure can safely handle cover assets.

Extend authorization if necessary.

The Expert must only be able to manage their own page assets.

---

# 53. FUTURE-PHASE COMPATIBILITY

The Page Builder must be extensible.

Future:

```text
ExpertService[]
        ↓
SERVICES section
```

```text
ExpertPackage[]
        ↓
PACKAGES section
```

```text
ExpertReview[]
        ↓
REVIEWS section
```

```text
ExpertAvailability[]
        ↓
AVAILABILITY section
```

Phase 2 must NOT implement these systems.

Adding them later should require:

```text
New data model
+
New section renderer
+
New section configuration
```

not a rewrite of the entire Page Builder.

---

# 54. EXISTING PAYMENT / BOOKING COMPATIBILITY

The application may already contain:

```text
orders
payments
mentorship APIs
booking APIs
```

Inspect them.

Do NOT unnecessarily modify them.

If the current booking API uses an existing mentor/expert identifier, treat that as a future CTA integration point.

Do not force Phase 2 to depend on future booking/service functionality.

---

# 55. EXPERT DASHBOARD INTEGRATION

Update the Phase 1 Expert Dashboard.

Add a:

```text
MY PAGE
```

card/section.

Show:

```text
Page Status
Draft
Published
Unpublished
```

Possible actions:

```text
Edit Page
Preview
View Public Page
Continue Customization
```

Example:

```text
MY PAGE

Your page is live ✓

[Edit Page]
[Preview]
[View Public Page]
```

If unpublished:

```text
Your page is not public yet

[Continue Customization]
```

Do NOT show fake:

```text
Page Views
Visitors
Clicks
Conversion
```

Those belong to a future analytics phase.

---

# 56. PUBLIC PAGE DESIGN

Build a polished professional page using the existing Embark design system.

Conceptual structure:

```text
┌─────────────────────────────────────┐
│              COVER                  │
│                                     │
│          PROFILE IMAGE              │
│                                     │
│          John Doe                   │
│          Product Manager            │
│          Strategy • Growth          │
│                                     │
│          Verified Expert ✓          │
│                                     │
│          [Primary CTA]              │
└─────────────────────────────────────┘

ABOUT
─────────────────────────────────────

EXPERIENCE
─────────────────────────────────────

EDUCATION
─────────────────────────────────────

SKILLS
─────────────────────────────────────

SOCIAL LINKS
─────────────────────────────────────

CTA
─────────────────────────────────────
```

The exact visual language must follow the existing application.

Do NOT introduce an unrelated design system.

---

# 57. NO FAKE FUNCTIONALITY

This is mandatory.

Do NOT implement:

```text
Fake analytics
Fake bookings
Fake services
Fake reviews
Fake page views
Fake CTA destinations
Fake publishing
Fake uploads
```

Every visible control must:

1. Actually work

OR

2. Be clearly marked unavailable/future functionality.

Never create a button that silently does nothing.

---

# 58. PROFILE SYNCHRONIZATION VERIFICATION

Verify that changes to canonical Expert data are reflected on the public page.

Test important fields such as:

```text
Bio
Headline
Experience
Education
Skills
Profile image
Social links
```

The Page model must not contain duplicated copies of these fields.

Example:

```text
Expert edits headline
       ↓
ExpertProfile.headline updated
       ↓
Public Expert Page
       ↓
New headline displayed
```

---

# 59. LIGHTWEIGHT TESTING REQUIREMENTS

Do NOT spend significant time creating a large E2E test suite.

Prioritize implementation quality and essential automated validation.

## Unit Tests

Add focused unit tests only for important business logic:

```text
Page configuration validation
Section configuration validation
Section ordering
Section visibility
Slug validation
CTA validation
Theme validation
Publishing state validation
Public/private data filtering
```

Do not create tests for trivial UI components.

## Integration Tests

Add focused integration tests for:

### Ownership

```text
Expert A → Expert A page = allowed
Expert A → Expert B page = denied
```

### Publishing

```text
DRAFT → not publicly accessible
PUBLISHED → publicly accessible
UNPUBLISHED → not publicly accessible
```

### Canonical Data

Verify that the public page reads current canonical data from:

```text
ExpertProfile
ExpertExperience
ExpertEducation
ExpertSkill
```

and does not rely on duplicated page content.

### Section Configuration

Verify:

```text
Visibility persists
Order persists
Theme persists
CTA configuration persists
```

---

# 60. MANUAL VERIFICATION

After implementation, manually verify the primary workflow:

```text
Expert Dashboard
      ↓
My Page
      ↓
Customize
      ↓
Hide/show sections
      ↓
Reorder sections
      ↓
Change theme
      ↓
Change branding
      ↓
Configure CTA
      ↓
Preview
      ↓
Save
      ↓
Publish
      ↓
Open public page
```

Then verify:

```text
Profile change
      ↓
Public page reflects change
```

Also verify:

```text
Unpublish
      ↓
Public page becomes unavailable
```

---

# 61. MIGRATION SAFETY

Existing mentor/public pages must not break.

If the existing system has:

```text
/mentors/:id
/m/:slug
```

determine whether:

```text
Option A
Existing route becomes canonical Expert Page

Option B
Existing route redirects

Option C
New canonical route is introduced
```

Choose ONE architecture.

Do not leave competing canonical public profile systems.

If migration is required:

* Preserve existing slugs
* Preserve existing public data
* Create default page configuration
* Create default sections
* Preserve existing eligible public pages

---

# 62. DATABASE MIGRATION

Before running migration:

1. Review current schema
2. Verify foreign keys
3. Verify indexes
4. Verify unique constraints
5. Verify cascade behavior
6. Verify nullability
7. Verify default values
8. Verify backward compatibility

Then create the migration.

Do not modify unrelated Phase 1 tables unnecessarily.

---

# 63. DOCUMENTATION

Create:

```text
docs/phases/phase-2-expert-page.md
```

Include:

```text
# Phase 2 — Expert Page

## Objective
## Existing functionality reused
## New functionality
## New entities
## Modified entities
## Database migration
## API routes
## Frontend routes
## Page lifecycle
## Section system
## Page configuration
## Branding
## Cover system
## CTA system
## Preview architecture
## Publish architecture
## Public page architecture
## Security
## SEO
## Performance
## Tests
## Known limitations
## Deferred functionality
## Phase 3 integration notes
```

---

# 64. IMPLEMENTATION ORDER

After the repository audit and schema checkpoint, implement in this order:

```text
1. Repository audit
2. Existing public page audit
3. Schema decision
4. Architecture documentation
5. Database schema
6. Database migration
7. ExpertPage
8. ExpertPageConfig
9. ExpertPageSection
10. Default page creation
11. Default section creation
12. Page APIs
13. Section APIs
14. Configuration APIs
15. Publishing lifecycle
16. Slug handling
17. Cover upload integration
18. Page Builder
19. Section ordering
20. Section visibility
21. Branding controls
22. CTA
23. Shared Page Renderer
24. Preview mode
25. Public Page
26. Expert Dashboard integration
27. Authorization/security
28. SEO
29. Caching/revalidation
30. Unit tests
31. Integration tests
32. Documentation
33. Final verification
```

---

# 65. DEVELOPMENT PROCESS

Do NOT attempt to implement everything in one uncontrolled pass.

For every major step:

```text
1. Inspect existing implementation
2. Explain intended change
3. Identify affected files
4. Implement
5. Run type checking
6. Run lint
7. Run relevant tests
8. Fix failures
9. Continue
```

Do not rewrite unrelated code.

Do not replace working Phase 1 functionality without a reason.

Prefer incremental changes.

---

# 66. CODE QUALITY REQUIREMENTS

Use:

```text
Strong typing
Reusable components
Reusable services
Schema validation
Clear interfaces
Database transactions
Structured errors
Consistent API responses
Existing design system
Existing authentication
Existing authorization
Existing storage
```

Avoid:

```text
Magic strings
Magic numbers
Duplicated business logic
Duplicated profile data
Duplicated rendering systems
Unvalidated JSON
Arbitrary CSS
Unnecessary API calls
Unnecessary database tables
```

---

# 67. NO DUPLICATION RULE

This rule must be preserved throughout implementation.

If:

```text
ExpertProfile.bio
```

changes, the page must automatically reflect it.

If:

```text
ExpertExperience[]
```

changes, the page must automatically reflect it.

If:

```text
ExpertEducation[]
```

changes, the page must automatically reflect it.

If:

```text
ExpertSkill[]
```

changes, the page must automatically reflect it.

If:

```text
Profile Image
```

changes, the page must automatically reflect it.

The Page model stores:

```text
Presentation
```

not:

```text
Canonical profile content
```

---

# 68. OPTIONAL PAGE OVERRIDES

Do NOT implement page-specific overrides unless the product actually requires them.

If later implemented:

```text
Page Override
      ↓
Canonical Expert Profile
      ↓
Fallback
```

For example:

```text
headlineOverride
```

would take precedence over:

```text
ExpertProfile.headline
```

But Phase 2 should avoid overrides unless necessary.

---

# 69. FUTURE EXTENSION MODEL

The current architecture:

```text
ExpertPage
    ↓
ExpertPageSection[]
    ↓
HERO
ABOUT
EXPERIENCE
EDUCATION
SKILLS
SOCIAL_LINKS
CTA
```

Future:

```text
ExpertPage
    ↓
ExpertPageSection[]
    ↓
SERVICES
    ↓
ExpertService[]
```

```text
PACKAGES
    ↓
ExpertPackage[]
```

```text
REVIEWS
    ↓
ExpertReview[]
```

```text
AVAILABILITY
    ↓
ExpertAvailability[]
```

Do not redesign the Page Builder when those phases arrive.

---

# 70. FINAL QUALITY CHECK

Before declaring Phase 2 complete, run:

```text
TypeScript / Type Checking
Lint
Unit Tests
Integration Tests
Database Migration Checks
```

Then manually verify:

```text
Expert creates page
Expert customizes page
Expert reorders sections
Expert hides/shows sections
Expert changes branding
Expert uploads cover
Expert configures valid CTA
Expert previews page
Expert saves page
Expert publishes page
Public user sees page
Expert edits profile
Public page reflects profile changes
Expert unpublishes page
Public page disappears
```

---

# 71. FINAL VERIFICATION CHECKLIST

At the end, answer each question:

```text
Can an eligible Expert:

[ ] Open My Page?
[ ] Customize it?
[ ] Control sections?
[ ] Reorder sections?
[ ] Hide/show sections?
[ ] Change branding?
[ ] Upload a cover?
[ ] Configure a valid CTA?
[ ] Preview changes?
[ ] Save changes?
[ ] Publish?
[ ] View a public URL?
[ ] Unpublish?
[ ] Edit canonical profile data and see it reflected?
[ ] Do all of this without affecting another Expert?
```

Possible final status:

```text
YES — VERIFIED
PARTIAL
NO
BLOCKED
```

Do NOT say:

```text
YES — VERIFIED
```

unless the required functionality and validation actually passed.

---

# 72. FINAL ARCHITECTURAL PROOF

Before declaring Phase 2 complete, prove that this relationship is actually implemented:

```text
                 CANONICAL DATA
                       │
                       ▼
                 ExpertProfile
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     Experience    Education      Skills
          │            │            │
          └────────────┼────────────┘
                       ▼
                  ExpertPage
                       │
              ┌────────┴────────┐
              ▼                 ▼
        Page Config          Sections
              │                 │
              └────────┬────────┘
                       ▼
                 Page Renderer
                       │
              ┌────────┴────────┐
              ▼                 ▼
          PREVIEW             PUBLIC
           DRAFT            PUBLISHED
```

The final implementation must preserve this architectural rule:

> **The Expert Page is a presentation/configuration layer over canonical Expert data. It is NOT another Expert Profile.**

This principle must remain intact for every future Embark phase.

---

# 73. FINAL IMPLEMENTATION REPORT

At the end of implementation, provide a concise report containing:

```text
1. Repository audit findings
2. Existing public-page architecture decision
3. Final database schema
4. Migration performed
5. Files created
6. Files modified
7. API routes
8. Frontend routes
9. Page lifecycle
10. Section system
11. Configuration system
12. Branding system
13. Cover upload integration
14. CTA implementation
15. Preview architecture
16. Public renderer
17. Security model
18. SEO implementation
19. Caching/revalidation
20. Unit test results
21. Integration test results
22. Known limitations
23. Deferred Phase 3 functionality
24. Final verification status
```

Do not claim functionality was implemented merely because the code exists.

Only claim it works if it has been verified.
