# Booking & Session Schema

## `expert_bookings` (Booking entity)

| Field | Type | Required | Nullable | Default | Unique | Indexed | Owner | Purpose | Lifecycle |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `serial` PK | yes | no | auto | yes (PK) | yes | system | Stable booking ID | immutable |
| `bookingReference` | `varchar(32)` | yes | no | generated | yes | yes | system | Human-readable reference, e.g. `EMB-2026000123` | immutable |
| `studentId` | `bigint unsigned` FK → `users` | yes | no | — | no | yes | student | Who reserved | immutable |
| `userId` (expertId) | `bigint unsigned` FK → `users` | yes | no | — | no | yes | expert | Which expert | immutable |
| `serviceId` | `bigint unsigned` FK → `mentor_services` | yes | no | — | no | yes | service | Which service | immutable |
| `startAt` | `timestamp` | yes | no | — | no | yes | booking | Canonical UTC start | immutable |
| `endAt` | `timestamp` | yes | no | — | no | yes | booking | Canonical UTC end | immutable |
| `timezone` | `varchar(64)` | yes | no | — | no | no | booking | Expert timezone context at booking time | immutable |
| `status` | enum | yes | no | `pending` | no | yes | booking | Booking lifecycle | mutable |
| `intakeResponses` | `json` | no | yes | null | no | no | student | Snapshot of intake answers | mutable |
| `orderId` | `bigint unsigned` FK → `orders` | no | yes | null | no | yes | booking | Commercial order | nullable until paid |
| `serviceSnapshot` | `json` | yes | no | `{}` | no | no | booking | `{title, durationMinutes, price, currency}` at booking time | immutable |
| `cancellationReason` | `text` | no | yes | null | no | no | actor | Reason for cancellation | mutable |
| `createdAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | immutable |
| `updatedAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | `$onUpdate` |

**Status enum:** `pending`, `confirmed`, `cancelled`, `completed`, `no_show`.

Double-booking is prevented by a unique index on `(userId, startAt)` plus runtime slot revalidation.

---

## `sessions` (Session entity)

| Field | Type | Required | Nullable | Default | Unique | Indexed | Owner | Purpose | Lifecycle |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `serial` PK | yes | no | auto | yes (PK) | yes | system | Stable session ID | immutable |
| `bookingId` | `bigint unsigned` FK → `expert_bookings` | yes | no | — | yes | yes | booking | Linked booking | immutable |
| `startAt` | `timestamp` | yes | no | — | no | yes | session | Denormalized start | immutable |
| `endAt` | `timestamp` | yes | no | — | no | yes | session | Denormalized end | immutable |
| `status` | enum | yes | no | `scheduled` | no | yes | session | Session lifecycle | mutable |
| `meetingUrl` | `varchar(512)` | no | yes | null | no | no | expert | Join link | mutable |
| `meetingProvider` | `varchar(32)` | no | yes | null | no | no | expert | Provider name | mutable |
| `notes` | `text` | no | yes | null | no | no | expert | Private notes | mutable |
| `studentFeedback` | `text` | no | yes | null | no | no | student | Post-session feedback | mutable |
| `expertFeedback` | `text` | no | yes | null | no | no | expert | Post-session feedback | mutable |
| `createdAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | immutable |
| `updatedAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | `$onUpdate` |

**Status enum:** `scheduled`, `in_progress`, `completed`, `cancelled`, `no_show`.

---

## `orders` (commercial transaction)

| Field | Type | Required | Nullable | Default | Unique | Indexed | Owner | Purpose | Lifecycle |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `serial` PK | yes | no | auto | yes (PK) | yes | system | Stable order ID | immutable |
| `bookingId` | `bigint unsigned` FK → `expert_bookings` | yes | no | — | yes | yes | booking | Linked booking | immutable |
| `studentId` | `bigint unsigned` FK → `users` | yes | no | — | no | yes | student | Who pays | immutable |
| `amount` | `int` | yes | no | — | no | no | order | Price in minor units | immutable |
| `currency` | `varchar(3)` | yes | no | `INR` | no | no | order | Currency | immutable |
| `status` | enum | yes | no | `pending` | no | yes | order | Order lifecycle | mutable |
| `snapshot` | `json` | yes | no | `{}` | no | no | order | Service commercial snapshot | immutable |
| `provider` | `varchar(32)` | no | yes | null | no | no | payment | Payment provider | mutable |
| `createdAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | immutable |
| `updatedAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | `$onUpdate` |

**Status enum:** `pending`, `paid`, `failed`, `refunded`, `cancelled`.

---

## `payments` (provider event)

| Field | Type | Required | Nullable | Default | Unique | Indexed | Owner | Purpose | Lifecycle |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `serial` PK | yes | no | auto | yes (PK) | yes | system | Stable payment ID | immutable |
| `orderId` | `bigint unsigned` FK → `orders` | yes | no | — | no | yes | order | Linked order | immutable |
| `provider` | `varchar(32)` | yes | no | — | no | no | payment | e.g. `razorpay` | immutable |
| `providerPaymentId` | `varchar(128)` | yes | no | — | yes | yes | payment | External reference | immutable |
| `amount` | `int` | yes | no | — | no | no | payment | Minor units | immutable |
| `currency` | `varchar(3)` | yes | no | — | no | no | payment | Currency | immutable |
| `status` | enum | yes | no | `pending` | no | yes | payment | Payment status | mutable |
| `metadata` | `json` | no | yes | null | no | no | payment | Webhook payload snapshot | mutable |
| `createdAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | immutable |
| `updatedAt` | `timestamp` | yes | no | `now()` | no | no | system | Audit | `$onUpdate` |

**Status enum:** `pending`, `success`, `failed`.

---

## `mentor_services` additions

| Field | Type | Purpose |
|---|---|---|
| `intakeConfiguration` | `json` | Array of intake questions for this service. |
| `isBookable` | `boolean` | Whether the service accepts bookings. |
| `requiresPayment` | `boolean` | Whether payment is required before confirmation. |

Default: `isBookable = true`, `requiresPayment = true`.

---

## Indexes & constraints

- `expert_bookings`: unique `(userId, startAt)` to prevent double-booking.
- `expert_bookings`: index `(studentId, startAt)` for student history.
- `expert_bookings`: index `(userId, status)` for expert dashboard filters.
- `sessions`: unique `bookingId` (one session per booking).
- `sessions`: index `(startAt, status)` for upcoming session queries.
- `orders`: unique `bookingId` (one order per booking).
- `payments`: unique `(provider, providerPaymentId)` to handle idempotent webhooks.
