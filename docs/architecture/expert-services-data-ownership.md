# Phase 3 — Expert Services Data Ownership

## Core Rule

| Domain | Owns | Does NOT own |
|---|---|---|
| `mentorProfiles` | Expert identity, bio, headline, experience, education, skills, social links | Service titles, descriptions, prices, durations |
| `expertPages` / `expertPageSections` | Presentation, section ordering, visibility, branding, CTA | Service data |
| `mentorServices` | What the Expert offers: title, description, price, duration, type, status, order | Profile identity or page presentation |

## Ownership Matrix

| Data | Owner | Read by Page | Written by |
|---|---|---:|---|
| Expert name | `mentorProfiles.displayName` | Yes | Profile editor |
| Expert bio | `mentorProfiles.bio` | Yes | Profile editor |
| Expert headline | `mentorProfiles.headline` | Yes | Profile editor |
| Service title | `mentorServices.title` | Yes | Service editor |
| Service description | `mentorServices.description` | Yes | Service editor |
| Service price | `mentorServices.price` | Yes | Service editor |
| Service currency | `mentorServices.currency` | Yes | Service editor |
| Service duration | `mentorServices.durationMinutes` | Yes | Service editor |
| Service delivery mode | `mentorServices.deliveryMode` | Yes | Service editor |
| Service requirements | `mentorServices.requirements` | Partial | Service editor |
| Service outcomes | `mentorServices.outcomes` | Yes | Service editor |
| Service status | `mentorServices.status` | Yes (derived) | Service editor / lifecycle actions |
| Service display order | `mentorServices.displayOrder` | Yes | Service editor / reorder action |
| Services section visibility | `expertPageSections.isVisible` | Yes | Page builder |
| Services section position | `expertPageSections.displayOrder` | Yes | Page builder |

## Relationship Diagram

```
User (expert)
   │
   ├── mentorProfiles ── who the expert is
   │
   ├── expertPages ── how the expert is presented
   │      │
   │      └── expertPageSections ── where/whether sections appear
   │             │
   │             └── SERVICES section
   │
   └── mentorServices[] ── what the expert offers
          │
          ├── Service A
          ├── Service B
          └── Service C
```

## Public Page Flow

1. `catalog.expertPageBySlug` loads the published `expertPages` row.
2. It joins `mentorProfiles`, `expertPageConfigs`, and `expertPageSections`.
3. It loads `mentorServices` rows filtered by `userId` and `status = 'published'`.
4. `PublicExpertPage` renders the `services` section if `expertPageSections` has `services` visible.
5. Service cards link to `/m/:expertSlug/services/:serviceSlug`.

## Future Phase Compatibility

- Phase 4 (Calendar/Availability) will reference `mentorServices.durationMinutes` to generate slots.
- Phase 5 (Booking/Payment) will reference `mentorServices.id` from `OrderItem.serviceId` and snapshot the price at purchase time.
- Reviews (future) will reference `mentorServices.id`.
