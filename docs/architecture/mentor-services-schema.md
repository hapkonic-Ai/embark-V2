# Phase 3 — Mentor Services Schema

## Entity

`mentor_services`

Each row represents a service offered by one Expert. Services are completely separate from `mentorProfiles` and `expertPages`.

## Fields

| Field | Type | Required | Nullable | Default | Unique | Indexed | Public | Owner | Purpose |
|---|---|---:|---:|---|---:|---|---:|---|---|
| id | serial (bigint unsigned) | Yes | No | auto-increment | Yes (PK) | Yes | No | system | Service identifier |
| userId | bigint unsigned | Yes | No | — | No | Yes (FK) | No | expert | Service owner |
| title | varchar(255) | Yes | No | — | No | No | Yes | expert | Service name |
| slug | varchar(64) | Yes | No | — | Yes (with userId) | Yes | Yes | expert | URL-safe public identifier |
| description | text | No | Yes | null | No | No | Yes | expert | Public description |
| serviceType | enum(`one_on_one`, `review`, `consultation`, `mentorship`) | Yes | No | `one_on_one` | No | No | Yes | expert | Service category |
| price | int | Yes | No | 0 | No | No | Yes | expert | Price in whole INR |
| currency | varchar(3) | Yes | No | `INR` | No | No | Yes | expert | Currency code |
| durationMinutes | int | No | Yes | null | No | No | Yes | expert | Session duration |
| deliveryMode | enum(`online`, `offline`, `async`, `hybrid`) | No | Yes | `online` | No | No | Yes | expert | Delivery mode |
| requirements | text | No | Yes | null | No | No | Partial | expert | What the student should provide |
| outcomes | text | No | Yes | null | No | No | Yes | expert | Expected outcomes |
| image | text | No | Yes | null | No | No | Yes | expert | Service image URL/data |
| status | enum(`draft`, `published`, `unpublished`, `archived`) | Yes | No | `draft` | No | Yes | Yes (derived) | expert | Lifecycle state |
| displayOrder | int | Yes | No | 0 | No | Yes | Yes | expert | Ordering among services |
| createdAt | timestamp | Yes | No | now() | No | No | No | system | Audit |
| updatedAt | timestamp | Yes | No | now() | No | No | No | system | Audit |

## Constraints

- Primary key: `id`
- Unique index: `(userId, slug)` — service slugs are unique per expert
- Foreign key: `userId` references `users(id)` (enforced at application layer via tRPC context)

## Notes

- Money is stored as whole INR `int` to match existing project conventions (`mentorProfiles.price`, `playbooks.price`).
- `status` is the single source of truth for publication. No separate `isPublished` flag.
- `requirements` is public in the sense that the expert defines them, but student-provided answers will live in future `booking`/`order` tables, not here.
- Service IDs are stable across edits so future bookings and orders can reference them safely.
