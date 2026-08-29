# Calendar & Availability — Data Ownership

## Expert-owned data

- `expert_availability_rules`
- `expert_availability_exceptions`
- `expert_bookings` (expert side of the relationship)

Only users with `role = expert` may mutate these rows. Every row stores `userId` and the API enforces ownership before update/delete.

## Student-owned data

- `expert_bookings.studentId` identifies the customer.
- Authenticated users can create bookings via `expertCalendar.createBooking` for published services they do not own.
- Students can read their own bookings through `expertCalendar.myBookings`.

## Public data

- `mentor_profiles` verification status and `expert_pages` publishing state are public signals used to decide whether slots are exposed.
- `catalog.expertServiceSlots` returns only available start/end timestamps; no private exception reasons or internal schedules are leaked.

## Lifecycle rules

1. Booking creation is gated by real-time slot availability computation.
2. Experts confirm, cancel, complete, or mark bookings as no-show.
3. Cancelled and no-show bookings no longer block the calendar.
4. Completed bookings remain as historical records.

## Future considerations

- Admin/superadmin overrides may bypass ownership checks for dispute resolution.
- A future `meetingUrl` and intake attachments should remain visible only to the expert and the booking student.
