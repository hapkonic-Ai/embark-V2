# Booking & Session State Machines

## Booking status flow

```
      pending
         │
         ├─ student cancels → cancelled
         ├─ expert cancels  → cancelled
         ├─ payment success / free service → confirmed
         │
         ▼
     confirmed
         │
         ├─ expert cancels → cancelled
         ├─ student cancels → cancelled (subject to policy)
         ├─ session completed → completed
         ├─ student no-show → no_show
         │
         ▼
     completed / no_show / cancelled
```

**Rules:**
- A booking can only move from `pending` to `confirmed` when the slot is still available.
- `cancelled` bookings release the slot.
- `completed`/`no_show` bookings remain as historical records.
- Only the expert or admin can mark `completed` or `no_show`.
- A student can cancel their own pending or confirmed booking before the cancellation deadline.

## Session status flow

```
scheduled ──► in_progress ──► completed
    │              │
    ▼              ▼
cancelled     no_show
```

**Rules:**
- A session is created when a booking becomes `confirmed`.
- `meetingUrl` is editable by the expert before the session starts.
- `in_progress` can be set by the expert or student when joining; otherwise it is inferred from `startAt`.
- `completed` is set by the expert after the appointment.

## Order status flow

```
pending ──► paid ──► refunded
   │
   ▼
failed / cancelled
```

**Rules:**
- For free services, no order is created unless `requiresPayment = true`.
- A paid order confirms the booking.
- A refunded order may or may not cancel the booking depending on policy.

## Cancellation policy (default)

- Students can cancel up to 24 hours before `startAt` without expert approval.
- Within 24 hours, cancellation requires expert approval (or admin override).
- Experts can cancel any booking; a reason is recorded.
