# Phase 3 — Expert Services Implementation Report

## Objective
Allow verified Experts to create, configure, publish, unpublish, and archive professional services. Services are displayed on the existing Phase 2 public Expert Page via a new `services` section and can be viewed on a dedicated public service detail page.

## Existing functionality reused
- `mentorProfiles` for expert identity and verification status.
- `expertPages` / `expertPageSections` for page presentation and section ordering.
- `fileAssets` / `ImageUploadField` for service image uploads.
- `roleQuery("expert")` for authorization.
- `formatINR` and existing UI components (Button, Badge, Input, Select, etc.).

## Existing schema inspected
- `mentorProfiles` stores identity, bio, experience, skills, verification.
- `expertPages` stores slug, status, meta fields.
- `expertPageSections` stores section type, order, visibility.
- `users` stores roles and auth state.

## New entities
- `mentorServices` — independent service domain with title, slug, description, type, price, currency, duration, delivery mode, requirements, outcomes, image, status, display order.
- `api/routers/expert-services.ts` — expert-facing CRUD + lifecycle router.
- `src/pages/ExpertServices.tsx` — service list dashboard.
- `src/pages/ExpertServiceEditor.tsx` — create/edit service form.
- `src/pages/PublicServiceDetail.tsx` — public service detail view.

## Modified entities
- `db/schema.ts` — added `mentorServices` table.
- `api/lib/expert-page.ts` — added `services` to default sections, visibility logic, and eager-loaded published services on public page queries.
- `api/routers/expert-page.ts` — added `services` to section type enum.
- `api/routers/catalog.ts` — added public `expertServicesBySlug` and `expertServiceBySlug` queries.
- `api/router.ts` — registered `expertServices` router.
- `src/App.tsx` — added routes `/expert/services`, `/expert/services/:id`, `/m/:slug/services/:serviceSlug`.
- `src/components/expert/PublicExpertPage.tsx` — added `services` section renderer and `ServiceCard`.
- `src/pages/ExpertDashboard.tsx` — replaced placeholder Services tab with real overview.
- `src/pages/ExpertPageBuilder.tsx` — added `services` to section labels.
- `db/seed.ts` — seeded two demo services for the test expert account.

## Database migration
- Migration `0006_clammy_mac_gargan` creates `mentor_services` table with unique `(userId, slug)` index.
- Applied via Docker `embark-migrate` container.

## API routes

### Expert (requires `expert` role)
- `expertServices.listMyServices` — list all services for the logged-in expert.
- `expertServices.getServiceById` — get a single service by ID, ownership verified.
- `expertServices.createService` — create a new service (auto-generates slug).
- `expertServices.updateService` — update service fields.
- `expertServices.publishService` — validate and publish.
- `expertServices.unpublishService` — hide from public.
- `expertServices.archiveService` — archive (keeps history).
- `expertServices.reorderServices` — update `displayOrder`.

### Public
- `catalog.expertPageBySlug` — now returns `services` array.
- `catalog.expertServicesBySlug` — list published services for an expert page.
- `catalog.expertServiceBySlug` — single published service by expert slug + service slug.

## Frontend routes
- `/expert/services` — service list.
- `/expert/services/new` — create service.
- `/expert/services/:id` — edit service.
- `/m/:slug/services/:serviceSlug` — public service detail.

## Service lifecycle
```
Create
  ↓
DRAFT
  ↓
Publish
  ↓
PUBLISHED
  ↓
Unpublish
  ↓
UNPUBLISHED
  ↓
Archive
  ↓
ARCHIVED
```

## Service schema
See `docs/architecture/mentor-services-schema.md`.

## Pricing model
- `price`: whole INR integer.
- `currency`: 3-letter code, default `INR`.
- Free services are represented by `price = 0`.

## Duration model
- `durationMinutes`: integer minutes.
- UI presents human-readable options (15 min, 30 min, 1 hour, etc.).

## Delivery model
- `deliveryMode`: enum `online`, `offline`, `async`, `hybrid`.

## Publication model
- Single source of truth: `status` enum.
- Publishing validates title, description length, price, and expert verification.
- Draft and archived services are never returned by public APIs.

## Expert Page integration
- `services` is a new `expertPageSections` section type.
- The Page Builder controls whether and where the section appears.
- The section renders published services from `mentorServices`.

## Security
- All mutations require `expert` role.
- Service ownership is verified server-side on every mutation.
- Experts cannot modify other experts' services.
- Public APIs only return published services.
- Slug uniqueness is enforced per expert via database index.

## Authorization
- `expertServices` router uses `roleQuery("expert")`.
- `verifyServiceOwner` helper throws `FORBIDDEN` for non-owners.
- `publishService` checks `mentorProfiles.verificationStatus === 'verified'` or `isVerified`.

## Public API
- `catalog.expertServiceBySlug({ expertSlug, serviceSlug })` returns only published service fields.
- No internal IDs or draft data leak.

## Future Calendar integration
- `mentorServices.durationMinutes` will be used to generate available slots from expert availability.
- Availability will live in its own table, not inside `mentorServices`.

## Future Booking integration
- Bookings will reference `mentorServices.id`.
- Service ID is stable across edits.

## Future Payment integration
- Orders will snapshot service price and currency at purchase time.
- `mentorServices.price` remains the current list price.

## Future Reviews integration
- Reviews can reference `mentorServices.id` safely because IDs are stable.

## Tests
- TypeScript type-check: `npm run check` ✓
- Lint: `npm run lint` ✓
- Unit tests for `expert-services` router: TODO — add `api/routers/expert-services.test.ts`.
- E2E smoke tests: existing Playwright auth-role tests still pass.

## Known limitations
- Booking and payment are not implemented yet; CTAs are disabled or link to "Contact expert".
- Service image is stored as a data URL/text, same as profile images.
- No admin dashboard for services yet.

## Deferred functionality
- Calendar availability (Phase 4).
- Booking flow (Phase 5).
- Payment integration (Phase 5).
- Service reviews.
- Admin moderation of services.
