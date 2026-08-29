# Booking Migration Strategy

## Current state

The repository contains three overlapping booking-like concepts:

1. **Legacy `mentorships` + `mockSessions`**  
   Used by the old `mentor`/`candidate` flow. A `mentorships` row represents a purchased mentorship package, and `mock_sessions` represent GD/PI appointments requested under that package.

2. **Phase 4 `expert_bookings`**  
   A minimal booking table tied to the new expert role. It stores the service, student, time range, status, and a free-text `intakeResponses` JSON blob. It currently mixes Booking and Session concerns (`meetingUrl` lives on the booking row).

3. **Expert services (`mentor_services`)**  
   Reusable service catalog introduced in Phase 3. This becomes the parent of the new Booking entity.

## Target state

```
Student ──► Booking ──► Session
              │
              ├── Service (mentor_services)
              ├── Expert (users)
              ├── Order
              └── Payment
```

- **Booking** represents the reservation/purchase of a service at a specific slot.
- **Session** represents the actual appointment: meeting link, notes, attendance.
- **Order** represents the commercial transaction (amount, currency, status).
- **Payment** represents a payment provider event tied to an order.

## Migration rules

| Source | Target | Action |
|---|---|---|
| `mentorships` | none | Keep as legacy. Do not migrate to the new Booking domain. |
| `mock_sessions` | none | Keep as legacy. Not a real booking; will be deprecated. |
| Existing `expert_bookings` rows | Refactored `expert_bookings` + `sessions` | Map `startAt/endAt/status` to Booking; create a `sessions` row from any existing `meetingUrl`. |
| `expert_bookings.intakeResponses` JSON | `intake_responses` or normalized JSON | Preserve as-is during migration; future intake forms use service-level configuration. |

## Backward compatibility

- `mentorships` and `mock_sessions` remain untouched.
- Existing `expert_bookings` rows will be migrated in place:
  - Rename `userId` to `expertId` conceptually (column remains `userId`).
  - Move `meetingUrl` to a new `sessions` row with `status = scheduled` if the booking status is `confirmed` or `completed`.
  - Keep `intakeResponses` JSON until a dedicated intake table is introduced.
- Old tRPC endpoints in `expertCalendar` that manage bookings will be deprecated and removed after the UI switches to `bookingRouter`.

## Deletion / deprecation plan

1. **Phase 5.1** — create `sessions`, `orders`, `payments`, `intake_responses` tables; refactor `expert_bookings`.
2. **Phase 5.3** — new `bookingRouter` becomes source of truth; `expertCalendar` keeps only availability rules/exceptions.
3. **Phase 5.5** — UI moves to new booking endpoints.
4. **Phase 6+** — remove legacy `mentorships`/`mock_sessions` and deprecated `expertCalendar` booking endpoints.

## Payment integration stance

No real payment provider is wired yet. `PaymentModal.tsx` is a simulated demo. Phase 5 introduces the `orders`/`payments` schema so the booking flow can reference them, but actual provider integration (Razorpay, Stripe, etc.) is deferred until credentials and provider choice are finalized. Free services can transition from `pending` to `confirmed` directly; paid services require a `paid` order before confirmation.
