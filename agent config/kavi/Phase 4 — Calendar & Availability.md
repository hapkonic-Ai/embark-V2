Use the following as the implementation prompt for your LLM. This phase should be treated as foundational infrastructure for booking, not merely a calendar UI.

You are working on the Embark application.

Act as a senior product engineer, backend engineer, frontend engineer,
database architect, API designer, scheduling-system architect,
security engineer, UX engineer, and QA engineer.

You have already implemented:

PHASE 1 — Expert Foundation
PHASE 2 — Expert Page
PHASE 3 — Expert Services

Your task is now to implement:

PHASE 4 — CALENDAR & AVAILABILITY

========================================================
CORE FLOW
========================================================

Expert
   ↓
Availability
   ↓
Weekly Schedule
   ↓
Blocked Dates / Exceptions
   ↓
Bookings
   ↓
Available Slot Calculation
   ↓
Future Booking Flow

The purpose of this phase is to create the scheduling foundation
required by the future booking system.

This phase must NOT be treated as simply a calendar frontend.

The backend scheduling model, timezone handling, availability
calculation, conflict detection, and booking compatibility are
the critical parts of this phase.

========================================================
PART 1 — REPOSITORY AUDIT
========================================================

Before writing code, inspect the existing repository.

Review:

- Expert model
- mentorProfiles
- mentorServices
- Expert Page
- authentication
- authorization
- existing booking APIs
- existing mentorship APIs
- existing order/payment APIs
- existing user timezone handling
- existing date/time utilities
- existing calendar integrations
- existing notification system
- existing database conventions
- existing API conventions
- existing frontend routing
- existing validation
- existing background jobs if any

Do NOT assume the previous phases were implemented exactly
as documented.

Inspect the actual implementation.

Document:

1. What already exists.
2. What can be reused.
3. What must be extended.
4. What is missing.
5. What should be deferred.

========================================================
PART 2 — CORE ARCHITECTURAL PRINCIPLE
========================================================

Availability is owned by the Expert.

A Service does NOT own the Expert's calendar.

Correct:

Expert
 │
 ├── mentorProfile
 ├── mentorServices[]
 ├── ExpertPage
 └── Availability
       ├── WeeklySchedule[]
       ├── AvailabilityExceptions[]
       └── BlockedDates[]

A service may have:

duration
service type
delivery mode

but the Expert's calendar determines when that service can happen.

========================================================
PART 3 — IMPORTANT DISTINCTION
========================================================

Separate these concepts:

1. Weekly availability
2. Availability exceptions
3. Blocked dates
4. Existing bookings
5. Generated available slots

Do NOT store generated available slots as the primary source of truth.

Correct:

Weekly Schedule
+
Exceptions
+
Bookings
+
Service Duration
+
Timezone
=
Available Slots

Available slots should generally be calculated from the underlying
schedule and constraints.

========================================================
PART 4 — AVAILABILITY DOMAIN
========================================================

Create a dedicated availability domain.

Potential entities:

expertAvailability
expertAvailabilityRules
expertAvailabilityExceptions
expertBookings

Use the project's actual naming conventions.

Do NOT create unnecessary duplicate models.

The final schema must be decided after inspecting the existing
repository.

========================================================
PART 5 — FINAL SCHEMA CHECKPOINT
========================================================

Before implementation, create:

docs/architecture/calendar-schema.md

Document every entity.

For every field include:

Entity
Field
Type
Required?
Nullable?
Default
Unique?
Indexed?
Public?
Owner
Purpose

Do not blindly use the examples below.

They are conceptual requirements.

========================================================
PART 6 — WEEKLY SCHEDULE
========================================================

The Expert must be able to define recurring availability.

Example:

Monday
09:00 → 17:00

Tuesday
09:00 → 17:00

Wednesday
Unavailable

Thursday
10:00 → 18:00

Friday
09:00 → 14:00

Saturday
Unavailable

Sunday
Unavailable

The system must support:

0 or more availability windows per day.

For example:

Monday:

09:00 → 12:00
13:00 → 17:00

This allows a lunch break.

Do NOT assume each day can have only one interval.

========================================================
PART 7 — WEEKLY RULE MODEL
========================================================

A conceptual availability rule could contain:

id
expertId
dayOfWeek
startTime
endTime
timezone
isActive

But inspect the existing architecture before finalizing.

Determine whether timezone belongs to:

Expert
Availability
or both.

Avoid unnecessary duplication.

========================================================
PART 8 — DAY OF WEEK
========================================================

Use a stable representation.

Example:

MONDAY
TUESDAY
WEDNESDAY
THURSDAY
FRIDAY
SATURDAY
SUNDAY

Do not store:

"Monday"

as arbitrary text if the backend requires deterministic
schedule calculations.

Use an enum or validated representation.

========================================================
PART 9 — TIME REPRESENTATION
========================================================

Weekly schedule times represent local wall-clock time.

Example:

09:00
17:30

Do NOT store recurring weekly availability as UTC timestamps.

A weekly rule is:

Monday 09:00 → 17:00

in the Expert's timezone.

Actual generated slots must eventually be resolved to real
date/time values.

========================================================
PART 10 — EXPERT TIMEZONE
========================================================

Timezone handling is mandatory.

An Expert must have a canonical timezone.

Example:

Asia/Kolkata

America/New_York

Europe/London

Use IANA timezone identifiers.

Do NOT store:

IST
EST
PST

as the canonical timezone.

Those abbreviations are ambiguous.

========================================================
PART 11 — TIMEZONE OWNERSHIP
========================================================

Determine the source of truth for Expert timezone.

Prefer:

Expert timezone

or:

Availability timezone

but avoid conflicting values.

Document:

Where timezone is stored
Who can modify it
How existing schedules behave if it changes

========================================================
PART 12 — STUDENT TIMEZONE
========================================================

The student may be in another timezone.

Example:

Expert:
Asia/Kolkata

Student:
America/New_York

The backend should calculate actual slots using the Expert's
canonical availability timezone.

The UI may display those slots in the student's local timezone.

Never calculate availability independently on the client using
the student's timezone.

Backend:

Expert schedule
+
Expert timezone
+
Date range
+
Bookings
+
Exceptions
=
Canonical available slots

Frontend:

Display canonical slots in desired timezone.

========================================================
PART 13 — DAYLIGHT SAVING TIME
========================================================

The implementation must use a timezone-aware date/time library.

Do NOT manually add/subtract timezone offsets.

DST transitions must be handled correctly.

For example:

America/New_York

may shift between:

UTC-5
UTC-4

The system must not assume a fixed offset.

========================================================
PART 14 — BLOCKED DATES
========================================================

Experts must be able to block availability.

Examples:

Vacation
Holiday
Personal appointment
Conference
Travel

A blocked date can override the weekly schedule.

Example:

Weekly:

Monday
09:00 → 17:00

Blocked:

2026-09-07

Result:

No availability on September 7.

========================================================
PART 15 — PARTIAL-DAY BLOCKS
========================================================

Determine whether blocked periods need to support time ranges.

Recommended support:

Full day:

2026-09-07

Partial day:

2026-09-07
13:00 → 17:00

This is important for real scheduling.

If implemented, use actual datetime/timezone-aware representation.

Do not force every exception to be a full-day block.

========================================================
PART 16 — AVAILABILITY EXCEPTIONS
========================================================

Do not assume every exception is a simple "blocked date."

An exception may modify availability.

Examples:

Normal Monday:
09:00 → 17:00

Holiday Monday:
blocked

Special Monday:
12:00 → 18:00

Therefore determine whether the system needs:

BLOCK
or
OVERRIDE

as exception types.

Recommended conceptual model:

Availability Exception

type:
BLOCK
OVERRIDE

date
startTime
endTime
timezone

Only implement what is actually needed.

========================================================
PART 17 — RECURRING EXCEPTIONS
========================================================

Do NOT implement recurring exception rules unless required.

Phase 4 should prioritize:

weekly recurring schedule
+
specific date exceptions

For example:

2026-12-25
2026-12-26

can be blocked individually.

Do not build a full recurrence engine unnecessarily.

========================================================
PART 18 — BOOKING DATA
========================================================

Inspect the existing booking/mentorship model.

If bookings already exist:

reuse them.

Do not create:

calendarBookings

and:

mentorBookings

and:

sessionBookings

without a clear domain reason.

There must be one canonical booking model where possible.

========================================================
PART 19 — BOOKING RELATIONSHIP
========================================================

Future booking should connect:

Expert
Student
Service
Start time
End time
Status

Conceptually:

Booking

id
expertId
studentId
serviceId
startAt
endAt
status
createdAt
updatedAt

Adapt to the existing schema.

========================================================
PART 20 — SERVICE DURATION
========================================================

Available slots depend on service duration.

Example:

Expert availability:

09:00 → 12:00

Service:

60 minutes

Potential slots:

09:00
10:00
11:00

The system must never create:

11:30 → 12:30

because it exceeds availability.

========================================================
PART 21 — SLOT INTERVAL
========================================================

Determine how slots are generated.

Potential:

Every 15 minutes
Every 30 minutes
Every service duration
Custom interval

Do not assume.

Inspect the product requirements.

If configurable:

slotIntervalMinutes

should be explicitly represented.

Otherwise use a documented platform default.

========================================================
PART 22 — BUFFER TIME
========================================================

Determine whether Experts need buffer time.

Example:

Service:
60 minutes

Buffer:
15 minutes

Booking:

10:00 → 11:00

Next available:

11:15

Do not implement buffers unless the product requires them.

If implemented, determine whether buffer is:

before
after
both

and whether it belongs to:

Service
or
Expert availability.

Document the decision.

========================================================
PART 23 — MULTIPLE SERVICES
========================================================

An Expert can have:

Service A = 30 minutes
Service B = 60 minutes
Service C = 90 minutes

The same weekly schedule should support all of them.

Example:

Expert availability:
09:00 → 17:00

Service A:

30 min

Service B:

60 min

Service C:

90 min

The slot generator must calculate availability according to
the requested service duration.

========================================================
PART 24 — AVAILABLE SLOT GENERATION
========================================================

Implement a backend availability calculation.

Input:

expertId
serviceId
date range
timezone/display timezone

Process:

1. Load Expert timezone.
2. Load weekly availability.
3. Load exceptions.
4. Load relevant bookings.
5. Resolve requested service duration.
6. Generate candidate slots.
7. Remove blocked periods.
8. Remove conflicting bookings.
9. Remove invalid/past slots.
10. Return available slots.

========================================================
PART 25 — SLOT GENERATION PSEUDOFLOW
========================================================

For each requested date:

date
 ↓
determine day of week
 ↓
load weekly schedule
 ↓
apply date exception
 ↓
generate intervals
 ↓
apply service duration
 ↓
check booking conflicts
 ↓
remove past slots
 ↓
return remaining slots

Do not implement this entirely on the frontend.

========================================================
PART 26 — PAST SLOTS

Never expose slots that are already in the past.

Example:

Current time:

14:20

Do not return:

14:00
14:15

even if they are technically part of the weekly schedule.

Use actual timezone-aware current time.

========================================================
PART 27 — MINIMUM BOOKING NOTICE

Determine whether Experts need minimum notice.

Example:

Minimum notice:

2 hours

At:

14:20

a 15:00 slot should not be bookable.

Possible setting:

minimumBookingNoticeMinutes

Only implement if required.

If implemented, enforce it server-side.

========================================================
PART 28 — MAXIMUM ADVANCE BOOKING

Determine whether bookings can be made:

7 days ahead
30 days ahead
60 days ahead
90 days ahead

Potential:

maxAdvanceBookingDays

Do not invent a limit.

If a product limit exists:

enforce it in slot generation and booking creation.

========================================================
PART 29 — BOOKING CONFLICTS

This is a critical requirement.

If Expert has:

Booking A:
10:00 → 11:00

Then:

10:00 → 11:00

must not be available.

Also prevent overlapping slots:

09:30 → 10:30
10:30 → 11:30

if Booking A occupies:

10:00 → 11:00

Use proper interval overlap logic.

Conceptually:

newStart < existingEnd
AND
newEnd > existingStart

means overlap.

========================================================
PART 30 — BUFFER CONFLICTS

If buffers are implemented:

Booking:

10:00 → 11:00

15-minute buffer

The effective occupied range may become:

10:00 → 11:15

The slot engine must respect this.

Document the exact behavior.

========================================================
PART 31 — CANCELED BOOKINGS

Determine which booking states consume availability.

For example:

CONFIRMED
PENDING
CANCELLED
COMPLETED
NO_SHOW

Typically:

CANCELLED

should no longer block availability.

But the exact rule must follow the existing booking architecture.

Document it.

========================================================
PART 32 — PENDING BOOKINGS

This is particularly important for future payment integration.

If a student selects:

10:00

but payment is still pending,

another student must not necessarily be able to take the same slot.

Determine whether:

PENDING

temporarily holds a slot.

If implemented:

define:

hold duration
expiration
cleanup behavior

Do not invent payment behavior in Phase 4.

Document the requirement for Phase 5 if payment is not yet implemented.

========================================================
PART 33 — DOUBLE BOOKING PROTECTION

Availability calculation alone is NOT enough.

Two students could request the same slot simultaneously.

Example:

Student A checks 10:00.
Student B checks 10:00.

Both see it available.

Both attempt booking.

The database/backend must prevent both bookings from succeeding.

Future booking creation must use:

transaction
locking
unique constraint
serializable logic
or another reliable concurrency mechanism.

Phase 4 must define the requirement.

========================================================
PART 34 — BOOKING INTERVAL CONSTRAINT

Do not rely only on frontend checks.

The backend must validate:

Expert
Service
Start time
End time
Availability
Exceptions
Existing bookings
Booking status

before creating a booking.

========================================================
PART 35 — CALENDAR DASHBOARD

Create:

/expert/calendar

or follow the existing route conventions.

The Expert should see:

Calendar
Availability
Bookings

Potential tabs:

Calendar
Weekly Schedule
Blocked Dates

Do not create unnecessary separate pages if the UX is clearer
as one calendar workspace.

========================================================
PART 36 — WEEKLY SCHEDULE UI

Create a schedule editor.

Example:

Monday
☑ Available

09:00 ───── 12:00
13:00 ───── 17:00

Tuesday
☑ Available

09:00 ───── 17:00

Wednesday
☐ Unavailable

Thursday
☑ Available

10:00 ───── 18:00

Friday
☑ Available

09:00 ───── 14:00

Saturday
☐ Unavailable

Sunday
☐ Unavailable

Support:

Add interval
Remove interval
Edit interval
Enable/disable day

========================================================
PART 37 — VALIDATION FOR WEEKLY SCHEDULE

Reject:

start >= end

overlapping intervals

invalid times

duplicate intervals

invalid day

invalid timezone

Example:

09:00 → 12:00
11:00 → 15:00

must be rejected or normalized.

Prefer rejecting ambiguous overlaps.

========================================================
PART 38 — SCHEDULE SAVE

Saving a schedule must be atomic.

Do not partially save:

Monday
Tuesday
Wednesday

and fail halfway through.

Use transactional behavior where appropriate.

========================================================
PART 39 — BLOCKED DATE UI

Allow Expert to add:

Blocked date

Example:

Vacation
September 10–September 15

or:

September 10
09:00–12:00

depending on supported functionality.

Display existing blocks.

Allow:

Add
Edit
Remove

========================================================
PART 40 — CALENDAR VIEW

The Expert calendar should show:

Available time
Bookings
Blocked periods

Use clear visual differentiation.

Do not rely only on color.

Each event should expose:

title
time
service
student where permitted
status

Respect privacy and authorization.

========================================================
PART 41 — STUDENT AVAILABILITY VIEW

Prepare a public/student-facing availability API.

Example conceptual flow:

Student
↓
Expert Page
↓
Service
↓
Select date
↓
Available slots


The API should receive:

expert
service
date range

and return:

available slots.

Do not expose the Expert's entire private calendar.

========================================================
PART 42 — PUBLIC AVAILABILITY
========================================================

Public/student response should NOT expose:

private events
private calendar notes
other students
personal appointments
blocked-date reasons
internal metadata

If Expert has:

09:00 → 17:00

and blocks:

13:00 → 14:00

the student should see:

available slots

not:

"Expert has a personal appointment at 13:00."

========================================================
PART 43 — PRIVACY
========================================================

Private calendar information belongs only to the Expert.

Public API should expose:

AVAILABLE

not:

UNAVAILABLE REASON.

Example:

Correct:

10:00 Available
11:00 Available
12:00 Unavailable

Incorrect:

12:00 Doctor appointment

========================================================
PART 44 — DATE RANGE LIMITS
========================================================

Availability APIs must not accept unlimited ranges.

Example:

Do not allow:

2010 → 2050

in one request.

Define a sensible maximum range.

Use pagination or bounded windows where appropriate.

========================================================
PART 45 — API DESIGN
========================================================

Inspect existing API conventions.

Potential:

GET
/api/expert/calendar

GET
/api/expert/availability

PUT
/api/expert/availability/weekly

POST
/api/expert/availability/exceptions

PATCH
/api/expert/availability/exceptions/:id

DELETE
/api/expert/availability/exceptions/:id

GET
/api/expert/availability/slots

GET
/api/public/experts/:expertSlug/availability

These are conceptual.

Use the actual project's API conventions.

Do not create duplicate endpoints if equivalent APIs already exist.

========================================================
PART 46 — WEEKLY SCHEDULE API
========================================================

Expert should be able to:

GET schedule

UPDATE schedule

The update must validate the complete schedule.

Example:

{
  monday: [...],
  tuesday: [...],
  ...
}

Use the project's established request/response conventions.

========================================================
PART 47 — AVAILABILITY SLOT API
========================================================

The slot API should conceptually support:

expertId
serviceId
startDate
endDate
timezone

Return:

date
startAt
endAt

Potential:

{
  date,
  startAt,
  endAt
}

Use ISO-8601 timestamps for actual slots.

Do not return ambiguous:

"10 AM"

strings as the canonical representation.

========================================================
PART 48 — SERVICE VALIDATION
========================================================

When requesting availability:

Verify:

Expert exists
Service exists
Service belongs to Expert
Service is published/eligible
Service duration is valid

Do not allow:

Expert A
+
Expert B's Service

========================================================
PART 49 — SERVICE STATUS IN AVAILABILITY
========================================================

Determine whether draft/unpublished services should have public
availability.

Recommended:

Only eligible published services should expose public booking slots.

An Expert may still preview availability privately for a draft service.

Do not leak draft services through public APIs.

========================================================
PART 50 — EXPERT STATUS
========================================================

Reuse Phase 1 rules.

If Expert must be:

verified
active
onboarded

before accepting bookings,

availability should respect those rules.

Do not create a second verification mechanism.

========================================================
PART 51 — CALENDAR + EXPERT PAGE
========================================================

Phase 2 Expert Page may eventually display:

Service
 ↓
View Service
 ↓
Availability
 ↓
Select Slot

Phase 4 should make availability available as a backend capability.

Do not tightly couple the calendar engine to the Expert Page renderer.

Correct:

Availability domain
      ↓
API
      ↓
Expert Page / Booking UI

========================================================
PART 52 — CALENDAR + SERVICES
========================================================

The calendar does NOT belong to a service.

Example:

Expert:

Monday
09:00 → 17:00

Services:

Resume Review — 30 min
Career Mentorship — 60 min
Product Consultation — 90 min

The same availability can produce different slot sets.

Therefore:

Service
      ↓
duration

Expert
      ↓
availability

Slot Engine
      ↓
available slots

========================================================
PART 53 — CALENDAR + BOOKINGS
========================================================

The final availability calculation is:

Weekly Schedule
+
Exceptions
+
Service Duration
+
Existing Bookings
+
Booking Rules
+
Timezone
+
Current Time
=
Available Slots

This calculation must happen server-side.

========================================================
PART 54 — EXTERNAL CALENDAR INTEGRATION
========================================================

Inspect whether the project already supports:

Google Calendar
Microsoft Outlook
Apple Calendar
ICS

Do not automatically build integrations if they are not required
for Phase 4.

However, the architecture should leave room for:

External Calendar
       ↓
Busy periods
       ↓
Availability engine

Do not tightly couple the core availability model to one provider.

========================================================
PART 55 — EXTERNAL BUSY TIME
========================================================

If external calendars are implemented:

Only import:

busy/unavailable periods

unless explicit permissions allow more.

Do not expose external event titles/details to students.

========================================================
PART 56 — SYNC FAILURE
========================================================

If external calendar integration exists:

define behavior for:

sync failure
expired token
API outage
stale data

Do not silently assume the external calendar is always current.

If external integration is deferred:

document it.

========================================================
PART 57 — CALENDAR CACHING
========================================================

If availability is cached:

invalidate/recalculate when:

weekly schedule changes
exception changes
booking created
booking canceled
service duration changes
timezone changes
booking rules change

Do not serve stale availability indefinitely.

========================================================
PART 58 — AVAILABILITY PERFORMANCE
========================================================

Availability calculation may be expensive.

Avoid:

loading every historical booking.

Only query the relevant date range.

Example:

Request:

September 1–September 30

Query only bookings that could overlap that period.

Do not load:

all bookings for the Expert.

========================================================
PART 59 — INDEXES
========================================================

Determine appropriate database indexes.

Potential:

expertId
startAt
endAt
status
expertId + startAt
expertId + endAt

For availability rules:

expertId + dayOfWeek

For exceptions:

expertId + date

Only create indexes that support actual queries.

========================================================
PART 60 — BOOKING OVERLAP QUERY
========================================================

The backend must efficiently find overlapping bookings.

Conceptually:

existing.startAt < requestedEnd
AND
existing.endAt > requestedStart

Filter by:

expertId

and relevant active booking states.

========================================================
PART 61 — DATA OWNERSHIP
========================================================

Create:

docs/architecture/calendar-data-ownership.md

Document:

| Data | Owner |
|---|---|
| Expert timezone | Expert/Availability |
| Weekly schedule | Availability |
| Blocked date | Availability Exception |
| Booking | Booking |
| Service duration | mentorServices |
| Available slot | Derived |
| Page presentation | ExpertPage |

Most importantly:

Available slots are DERIVED DATA.

They are not the canonical source of truth.

========================================================
PART 62 — SCHEMA SEPARATION
========================================================

Do NOT add calendar fields to:

mentorProfiles

Do NOT add calendar fields to:

mentorServices

unless the field genuinely belongs to the service.

For example:

durationMinutes

belongs to:

mentorServices

while:

Monday 09:00–17:00

belongs to:

Expert Availability.

========================================================
PART 63 — NO EMBEDDED CALENDAR JSON
========================================================

Avoid:

mentorProfiles.availability = {
  monday: ...
}

if the application requires querying, validating, and evolving
availability independently.

Use dedicated relational entities unless the existing architecture
has a strong reason to use structured JSON.

========================================================
PART 64 — TIMEZONE CHANGE
========================================================

Define what happens if Expert changes timezone.

Example:

Old:
Asia/Kolkata

New:
Europe/London

Existing bookings must NOT move.

Historical bookings use their stored actual timestamps.

Future recurring availability may be interpreted using the new timezone.

Document and test this explicitly.

========================================================
PART 65 — BOOKING TIMESTAMP MODEL
========================================================

Actual bookings should use absolute timestamps.

Example:

startAt
endAt

stored as timezone-aware/UTC-compatible timestamps according
to the project's database conventions.

The timezone used to interpret recurring availability should
remain separately known.

Do not store only:

"10:00"

for an actual booking.

========================================================
PART 66 — DISPLAY TIMEZONE
========================================================

The same booking can be displayed as:

Expert:
10:00 AM

Student:
11:30 PM

depending on timezone.

The canonical booking timestamp must remain unchanged.

Only presentation changes.

========================================================
PART 67 — DST TESTING
========================================================

Test availability around DST transitions.

At minimum:

- before DST transition
- transition day
- after transition

Test for relevant supported timezones.

Do not assume every day has exactly:

24 hours.

========================================================
PART 68 — MIDNIGHT / CROSS-DAY INTERVALS
========================================================

Determine whether availability can cross midnight.

Example:

22:00 → 02:00

Do not silently support this if the underlying weekly-day model
cannot represent it correctly.

Either:

support explicitly

or:

reject it with clear validation.

Document the decision.

========================================================
PART 69 — BREAKS
========================================================

Multiple intervals should support breaks.

Example:

09:00–12:00
13:00–17:00

12:00–13:00 must produce no slots.

Test this explicitly.

========================================================
PART 70 — SLOT BOUNDARIES
========================================================

If:

availability:

09:00 → 17:00

service:

60 minutes

then:

16:00 → 17:00

is valid.

But:

16:15 → 17:15

is invalid.

Test boundary conditions.

========================================================
PART 71 — EXACT END TIME
========================================================

A slot is valid only if:

slotEnd <= availabilityEnd

Not:

slotStart < availabilityEnd

This distinction is mandatory.

========================================================
PART 72 — MULTIPLE AVAILABILITY WINDOWS
========================================================

Example:

09:00–12:00
14:00–18:00

A 2-hour service can produce:

09:00–11:00
10:00–12:00

14:00–16:00
15:00–17:00
16:00–18:00

but not:

11:00–13:00
12:00–14:00

because the lunch gap exists.

========================================================
PART 73 — SLOT INTERVAL TEST
========================================================

If slot interval is 30 minutes:

Availability:

09:00–12:00

Service:

60 minutes

Expected:

09:00
09:30
10:00
10:30
11:00

Not:

11:30

because:

11:30 + 60min = 12:30.

========================================================
PART 74 — EXCEPTION PRIORITY
========================================================

Define precedence.

Recommended:

Booking
  overrides availability

Block
  overrides weekly availability

Override
  replaces weekly availability for that date

The exact precedence must be documented.

Example:

Weekly:
09:00–17:00

Override:
12:00–18:00

Result:

12:00–18:00

not:

09:00–17:00 + 12:00–18:00

unless explicitly intended.

========================================================
PART 75 — CALENDAR UI STATES
========================================================

Handle:

Loading
Empty
Error
Saving
Saved
Unsaved changes
No availability
Fully booked
Blocked
Past dates

Do not show an empty calendar without explanation.

========================================================
PART 76 — EXPERT EMPTY STATE
========================================================

If Expert has no schedule:

Show:

"Set your availability"

Explain:

Students will only be able to book times
within your available schedule.

CTA:

[Set Availability]

========================================================
PART 77 — STUDENT EMPTY STATE
========================================================

If no slots exist:

Show:

"No available times"

Possible guidance:

Try another date.

Do not expose private blocking reasons.

========================================================
PART 78 — PUBLIC DATE SELECTION
========================================================

Student availability UI should allow:

date navigation
month navigation
available dates
unavailable dates

Do not allow selecting dates outside configured booking limits.

========================================================
PART 79 — API SECURITY
========================================================

Expert endpoints:

require authentication.

Mutation endpoints:

require Expert ownership.

Student/public availability:

may be public only for published/eligible services.

Private calendar:

must never be public.

========================================================
PART 80 — AUTHORIZATION TEST
========================================================

Expert A:

can read own calendar.

Expert A:

can modify own calendar.

Expert A:

cannot read Expert B's private calendar.

Expert A:

cannot modify Expert B's availability.

Student:

cannot modify Expert availability.

Public visitor:

cannot access private calendar events.

========================================================
PART 81 — BOOKING COMPATIBILITY
========================================================

Phase 4 must prepare for:

Student
 ↓
Service
 ↓
Date
 ↓
Available Slot
 ↓
Booking
 ↓
Payment

The slot returned by the availability engine should be directly
usable by the future booking system.

Do not return a UI-only representation.

========================================================
PART 82 — SLOT STABILITY
========================================================

A returned slot is NOT a permanent reservation.

Example:

10:00 is available.

Student sees it.

Another booking may consume it.

Therefore:

Availability response
      ≠
Reservation

Future booking creation must revalidate availability.

========================================================
PART 83 — BOOKING REVALIDATION
========================================================

When the future booking endpoint receives:

serviceId
startAt

it must re-check:

service belongs to Expert
service is bookable
slot is within availability
slot is not blocked
slot is not conflicting
slot meets booking rules

Do not trust the previously returned availability response.

========================================================
PART 84 — RACE CONDITIONS
========================================================

Document this explicitly in:

docs/architecture/calendar-concurrency.md

Explain how the system will prevent:

double booking
race conditions
stale slots

Phase 4 does not need to implement the full booking transaction
if booking is Phase 5.

But the architecture MUST account for it.

========================================================
PART 85 — NOTIFICATIONS
========================================================

Do not implement full notifications unless already required.

Future events may trigger:

booking confirmation
booking cancellation
availability changes

Document these integration points.

========================================================
PART 86 — ANALYTICS
========================================================

Do not implement analytics in Phase 4.

However future analytics may track:

available slots
bookings
utilization
cancellations

Do not add analytics fields to availability entities prematurely.

========================================================
PART 87 — MIGRATION
========================================================

If existing code contains:

availability fields
calendar fields
booking time fields

inside another entity:

identify them.

Create migration where needed.

Example:

mentorProfiles.availability
→
expertAvailabilityRules[]

Do not delete existing data without migration.

Document:

old field
new field
migration strategy
backward compatibility
cleanup plan

========================================================
PART 88 — API DOCUMENTATION
========================================================

Create:

docs/api/calendar.md

For every endpoint document:

Method
Route
Authentication
Authorization
Request
Response
Validation
Errors
Timezone behavior
Caching
Side effects

========================================================
PART 89 — FRONTEND ROUTES
========================================================

Document:

Expert Calendar route

Expert Availability route

Public Availability route

Student availability route if separate

Use the existing route conventions.

Do not create duplicate pages for the same functionality.

========================================================
PART 90 — UNIT TESTS
========================================================

Test weekly schedule:

Create
Read
Update
Delete interval
Multiple intervals
Disabled day
Invalid time
Overlapping interval

Test exceptions:

Create
Update
Delete