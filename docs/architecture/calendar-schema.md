# Calendar & Availability Schema

## Tables

### `expert_availability_rules`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK |  |
| `userId` | bigint unsigned FK → `users` | Expert owner |
| `dayOfWeek` | enum | `monday` … `sunday` |
| `startTime` | varchar(5) | Wall-clock time, e.g. `09:00` |
| `endTime` | varchar(5) | Wall-clock time, e.g. `17:00` |
| `isActive` | boolean | Defaults to `true` |
| `createdAt` | timestamp |  |
| `updatedAt` | timestamp |  |

A unique index on `(userId, dayOfWeek, startTime, endTime)` prevents duplicate weekly windows.

### `expert_availability_exceptions`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK |  |
| `userId` | bigint unsigned FK → `users` | Expert owner |
| `exceptionDate` | varchar(10) | ISO local date, e.g. `2026-09-15` |
| `type` | enum | `block` or `override` |
| `startTime` | varchar(5) | Optional; `null` means all day |
| `endTime` | varchar(5) | Optional; `null` means all day |
| `timezone` | varchar(64) | Denormalised expert timezone at creation time |
| `reason` | text | Optional note |
| `createdAt` | timestamp |  |
| `updatedAt` | timestamp |  |

A unique index on `(userId, exceptionDate)` enforces one exception per date.

### `expert_bookings`

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK |  |
| `userId` | bigint unsigned FK → `users` | Expert owner |
| `studentId` | bigint unsigned FK → `users` | Booking customer |
| `serviceId` | bigint unsigned FK → `mentor_services` | Service being booked |
| `startAt` | timestamp | Absolute UTC start |
| `endAt` | timestamp | Absolute UTC end |
| `status` | enum | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| `intakeResponses` | json | Key/value intake answers |
| `meetingUrl` | varchar(512) | Optional meeting link |
| `createdAt` | timestamp |  |
| `updatedAt` | timestamp |  |

A unique index on `(userId, startAt)` prevents double-booking at the database level. A secondary index on `(userId, startAt, endAt)` speeds up slot computation.

## Slot computation

1. Read the expert’s timezone from `mentor_profiles.timezone`, falling back to `Asia/Kolkata`.
2. Gather active weekly rules for the requested day range.
3. Apply `block` exceptions by subtracting their window from the weekly intervals.
4. Apply `override` exceptions by adding their window.
5. Split the resulting continuous intervals into slots of the service’s `durationMinutes`.
6. Remove slots that overlap confirmed/pending bookings.
7. Remove slots that start in the past or within the minimum notice window.

## Important conventions

- Weekly times are wall-clock values interpreted in the expert’s current timezone.
- `startAt` / `endAt` are stored as absolute UTC timestamps.
- Only non-`cancelled` and non-`no_show` bookings block availability.
- Public APIs return only available slots; exception reasons are private to the expert dashboard.
