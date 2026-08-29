You are working on the Embark application.

Act as a senior product engineer, backend engineer, frontend engineer,
database architect, API designer, booking-system architect,
transaction/concurrency engineer, security engineer, UX engineer,
and QA engineer.

You have already implemented:

PHASE 1 — Expert Foundation
PHASE 2 — Expert Page
PHASE 3 — Services
PHASE 4 — Calendar & Availability

Now implement:

PHASE 5 — REAL BOOKING

========================================================
CORE FLOW
========================================================

Student
   ↓
Expert
   ↓
Service
   ↓
Available Slot
   ↓
Intake
   ↓
Booking
   ↓
Session

The objective is to replace the existing mock-session-oriented
architecture with a proper production-ready booking architecture.

========================================================
CRITICAL ARCHITECTURAL CHANGE
========================================================

The current:

mockSessions

architecture should NOT continue to be stretched to represent
real bookings.

Introduce a proper:

Booking

domain/entity.

A Booking represents the student's reservation/purchase of an
Expert Service at a specific time.

A Session represents the actual mentorship appointment associated
with the booking.

Conceptually:

Student
   │
   ▼
Booking
   │
   ├── Expert
   ├── Service
   ├── Slot
   ├── Intake Response
   ├── Order / Payment
   │
   ▼
Session
   │
   ├── Meeting
   ├── Status
   ├── Start / End
   └── Session metadata

Do not treat Booking and Session as the same concept.

========================================================
PART 1 — REPOSITORY AUDIT
========================================================

Before implementing anything, inspect the entire repository.

Specifically locate:

- mockSessions
- sessions
- mentorship sessions
- mentorServices
- mentorProfiles
- expert pages
- availability
- availability rules
- availability exceptions
- bookings
- orders
- payments
- students
- users
- intake forms
- meetings
- notifications
- calendar integrations
- authentication
- authorization

Determine:

1. What mockSessions currently represents.
2. Where mockSessions is referenced.
3. Which APIs depend on mockSessions.
4. Which UI pages depend on mockSessions.
5. Whether a real Booking entity already exists.
6. Whether Order already exists.
7. Whether Payment already exists.
8. Whether Session already exists.
9. Whether Intake already exists.

Do NOT immediately delete mockSessions.

First map its dependencies.

========================================================
PART 2 — MIGRATION STRATEGY
========================================================

Create:

docs/architecture/booking-migration.md

Document:

mockSessions
      ↓
Booking
      ↓
Session

Explain:

- existing mockSessions usage
- fields that can be migrated
- fields that should be discarded
- fields that belong to Booking
- fields that belong to Session
- fields that belong to Order
- fields that belong to Payment
- migration strategy
- backward compatibility
- API migration
- frontend migration
- deletion/deprecation plan

Do not silently break existing flows.

========================================================
PART 3 — CORE DOMAIN MODEL
========================================================

The target domain should conceptually become:

User
 │
 ├── Student
 │
 └── Expert
       │
       └── mentorServices
                │
                ▼
             Booking
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
     Student  Expert   Service
                │
                ▼
             Session

Booking may also reference:

Intake
Order
Payment

Do not duplicate ownership unnecessarily.

========================================================
PART 4 — BOOKING VS SESSION
========================================================

Use this conceptual distinction:

BOOKING:

"What did the student reserve?"

SESSION:

"What actual mentorship appointment will happen?"

Example:

Booking:

Student:
Alice

Expert:
John

Service:
Career Mentorship

Start:
2026-09-10 10:00

End:
2026-09-10 11:00

Status:
CONFIRMED

↓

Session:

Booking:
Booking #123

Meeting:
Google Meet / platform meeting

Start:
2026-09-10 10:00

End:
2026-09-10 11:00

Status:
SCHEDULED

Do not merge these entities unless the existing architecture provides
a very strong reason.

========================================================
PART 5 — FINAL SCHEMA CHECKPOINT
========================================================

Before implementing the final database changes, create:

docs/architecture/booking-schema.md

Document every relevant entity.

For every field include:

Entity
Field
Type
Required?
Nullable?
Default
Unique?
Indexed?
Owner
Purpose
Lifecycle

At minimum evaluate:

Booking
Session
Intake
BookingStatus
SessionStatus

Also evaluate existing:

Order
Payment
mentorServices
User
Expert

Do not blindly create duplicate entities.

========================================================
PART 6 — BOOKING ENTITY
========================================================

A conceptual Booking may contain:

id
studentId
expertId
serviceId
startAt
endAt
timezone
status
intakeId
orderId
createdAt
updatedAt

This is conceptual only.

Use the actual project's naming conventions.

Determine whether:

timezone

needs to be stored on Booking or derived from the original
availability context.

Actual booking timestamps must remain stable even if the Expert
later changes their timezone.

========================================================
PART 7 — BOOKING IDENTITY
========================================================

Every booking must have a stable identifier.

Do not identify bookings using:

studentId + serviceId + date

or other derived combinations.

Use a proper primary key.

If a human-readable booking reference is useful, create a separate
booking reference.

Example:

bookingId:
UUID

bookingReference:
EMB-8F42K

Do not expose database internals unnecessarily.

========================================================
PART 8 — BOOKING STATUS
========================================================

Define an explicit lifecycle.

Potential states:

PENDING
HELD
CONFIRMED
CANCELLED
COMPLETED
EXPIRED
NO_SHOW

Do NOT implement every state automatically.

Determine which are actually required by the existing product.

Document:

state
meaning
allowed transitions
who can trigger transition
side effects

Example:

PENDING
 ↓
CONFIRMED

or:

PENDING
 ↓
EXPIRED

or:

CONFIRMED
 ↓
CANCELLED

Do not allow arbitrary status changes.

========================================================
PART 9 — STATE MACHINE
========================================================

Create:

docs/architecture/booking-state-machine.md

Document the legal transitions.

Example:

                  ┌───────────┐
                  │  PENDING  │
                  └─────┬─────┘
                        │
                payment/confirmation
                        │
                        ▼
                  ┌───────────┐
                  │ CONFIRMED │
                  └─────┬─────┘
                    │       │
              cancel│       │time passes
                    ▼       ▼
               CANCELLED  COMPLETED

Adapt this to the actual payment architecture.

Do not let frontend code directly assign arbitrary status values.

========================================================
PART 10 — SERVICE OWNERSHIP
========================================================

Every booking must reference a real:

mentorService

and verify:

service exists
service belongs to Expert
service is eligible for booking
service duration is valid

Never trust:

serviceId
expertId

provided by the client independently.

The backend must verify the relationship.

========================================================
PART 11 — PRICE SNAPSHOT
========================================================

If the service has a price, determine whether Booking should preserve
the price at the time of booking.

Example:

Service price today:
₹1,000

Student books.

Later Expert changes price:
₹1,500

The existing booking should not unexpectedly become ₹1,500.

Therefore determine where the immutable commercial snapshot belongs:

Booking
Order
OrderItem

Prefer the existing commerce architecture if one exists.

Document the decision.

========================================================
PART 12 — SERVICE SNAPSHOT
========================================================

Determine whether Booking/Order needs a snapshot of:

service name
service duration
price
currency

This protects historical records from future service edits.

Do not duplicate data unnecessarily if the existing Order system
already provides the canonical historical snapshot.

========================================================
PART 13 — SLOT SELECTION
========================================================

Student flow:

Expert Page
   ↓
Service
   ↓
Availability
   ↓
Select Slot

The selected slot must contain an actual:

startAt
endAt

Do not submit:

"Monday 10 AM"

as the canonical booking request.

Use actual timestamps.

========================================================
PART 14 — SLOT VALIDATION
========================================================

When the Student submits a booking request, the server MUST
revalidate the selected slot.

Verify:

1. Expert exists.
2. Expert is bookable.
3. Service exists.
4. Service belongs to Expert.
5. Service is bookable.
6. Service duration matches requested interval.
7. startAt is valid.
8. endAt is valid.
9. slot is within Expert availability.
10. slot is not blocked.
11. slot is not in the past.
12. slot satisfies minimum notice.
13. slot satisfies maximum advance booking.
14. slot does not conflict with another booking.
15. Student is allowed to book this service.

Never trust the availability response previously shown to the Student.

========================================================
PART 15 — STALE SLOT PROTECTION
========================================================

This scenario MUST work safely:

Student A:
requests availability

10:00 is available.

Student B:
books 10:00.

Student A:
submits booking for 10:00.

The system must reject Student A's booking attempt.

It must NOT create two confirmed bookings.

Return a clear conflict response.

========================================================
PART 16 — CONCURRENCY
========================================================

This is one of the most important requirements.

Availability checking and booking creation must be designed
for concurrent requests.

Do not rely only on:

if available:
    create booking

because two requests can pass the check simultaneously.

Use the database's transactional/concurrency capabilities.

Determine the correct implementation for the project's database.

Possible mechanisms:

transaction
locking
serializable isolation
exclusion constraint
unique constraint
atomic conditional insert
other database-supported concurrency mechanism

Choose based on the actual stack.

Document the approach.

========================================================
PART 17 — DOUBLE BOOKING
========================================================

The system MUST prevent:

Expert
+
same time range
+
two confirmed bookings

from existing simultaneously.

Test:

Student A → 10:00
Student B → 10:00

Only one may successfully acquire the slot.

========================================================
PART 18 — BOOKING HOLD
========================================================

Determine whether a temporary booking hold is required.

This is especially important if payment exists.

Potential flow:

Student
 ↓
Select Slot
 ↓
Create Hold
 ↓
Payment
 ↓
Confirm Booking

If holds are implemented, define:

hold status
hold expiration
hold duration
cleanup
race conditions
payment failure behavior

Do not invent a hold period.

Use the existing product/payment requirements.

If payment is deferred:

document the booking hold requirement for the next phase.

========================================================
PART 19 — INTAKE
========================================================

Before final booking, Student may need to complete intake.

Flow:

Student
 ↓
Service
 ↓
Slot
 ↓
Intake
 ↓
Booking

The intake must belong to the booking flow.

Do not create a generic:

studentProfile.extraData

blob for booking-specific answers.

========================================================
PART 20 — INTAKE SCHEMA
========================================================

Determine whether intake questions belong to:

Service
Booking
Expert
global templates

Recommended conceptual relationship:

mentorService
      │
      └── intake configuration/questions

Booking
      │
      └── submitted intake responses

This allows:

Service:
"Career Mentorship"

to ask:

"What is your current role?"
"What are your goals?"
"What would you like help with?"

The booking stores the answers provided at booking time.

========================================================
PART 21 — INTAKE SNAPSHOT
========================================================

Important:

Service intake questions may change later.

Historical booking records should not become ambiguous.

Determine whether Booking needs an intake snapshot/version.

For example:

IntakeTemplate
version 1

Booking
uses version 1

Later:

IntakeTemplate
version 2

Existing booking still references version 1.

Document the chosen approach.

========================================================
PART 22 — INTAKE VALIDATION
========================================================

Validate server-side:

required questions
question type
maximum length
allowed options
URLs if applicable
file references if supported

Do not trust client-side validation.

========================================================
PART 23 — SENSITIVE INTAKE DATA
========================================================

Determine whether any intake fields may contain sensitive/private
information.

Such information must not be exposed through:

public Expert Page
public booking APIs
unrelated Student APIs

Expert should only see intake responses for bookings they own.

Student should only see their own intake responses.

========================================================
PART 24 — BOOKING OWNERSHIP
========================================================

Booking belongs logically to:

Student
Expert
Service

Authorization:

Student can:
- create own booking
- view own booking
- cancel own eligible booking
- view own intake

Expert can:
- view bookings for own services
- view relevant intake
- manage eligible booking/session states

Admin permissions should follow the existing authorization model.

========================================================
PART 25 — AUTHORIZATION TESTS
========================================================

Student A cannot:

view Student B's booking.

Student A cannot:

modify Expert B's booking.

Expert A cannot:

view Expert B's private booking data.

Expert A cannot:

modify Expert B's booking.

Public users cannot:

access booking details.

========================================================
PART 26 — BOOKING API
========================================================

Inspect existing API conventions.

Potential endpoints:

POST
/api/bookings

GET
/api/bookings/:id

GET
/api/student/bookings

GET
/api/expert/bookings

POST
/api/bookings/:id/cancel

These are conceptual.

Use actual project conventions.

Do not duplicate an existing booking API.

========================================================
PART 27 — CREATE BOOKING REQUEST
========================================================

Conceptual request:

{
  serviceId,
  startAt,
  endAt,
  intake
}

Do NOT trust:

expertId

if it can be derived from service.

Prefer:

serviceId
+
slot

and resolve Expert server-side.

If the API requires expertId, validate it against the service.

========================================================
PART 28 — CREATE BOOKING RESPONSE
========================================================

Return a stable booking representation.

Potential:

{
  id,
  status,
  expert,
  service,
  startAt,
  endAt,
  intake,
  createdAt
}

Do not expose:

private expert calendar information
internal payment metadata
internal authorization data
database implementation details

========================================================
PART 29 — BOOKING DETAILS
========================================================

Student booking detail should show:

Expert
Service
Date
Time
Timezone
Duration
Status
Intake
Meeting information when available
Cancellation information when applicable

Do not expose irrelevant internal fields.

========================================================
PART 30 — EXPERT BOOKING VIEW
========================================================

Expert should have:

/expert/bookings

or equivalent.

Show:

Upcoming
Past
Cancelled

Potential filters:

service
date
status

Each booking should show:

Student
Service
Date
Time
Status

and relevant intake.

========================================================
PART 31 — STUDENT BOOKINGS
========================================================

Student should have:

/student/bookings

or existing equivalent.

Show:

Upcoming
Past
Cancelled

Allow:

View
Cancel if eligible
Join when session is active/eligible

Do not allow arbitrary editing of booking timestamps.

========================================================
PART 32 — BOOKING CANCELLATION
========================================================

Define cancellation rules.

Determine:

Who can cancel?
Student?
Expert?
Admin?

When can they cancel?

How close to start time?

Does cancellation release availability?

Does it affect payment/refund?

Does it create a notification?

Do not invent refund behavior if payments are not implemented yet.

Document deferred payment/refund behavior.

========================================================
PART 33 — CANCELLED BOOKINGS
========================================================

A cancelled booking should generally stop consuming the Expert's
availability, depending on product rules.

However:

historical booking records must remain.

Do not delete bookings.

Use status transitions.

========================================================
PART 34 — SOFT DELETE
========================================================

Do NOT physically delete a booking as a normal user operation.

Bookings are historical business records.

Use status/lifecycle management.

If deletion is required for privacy/legal reasons, implement it
through the application's established data-retention process.

========================================================
PART 35 — SESSION CREATION
========================================================

Determine when a Session is created.

Potential:

Booking confirmed
       ↓
Create Session

or:

Booking confirmed
       ↓
Session scheduled

The Session should reference the Booking.

Example:

Session

id
bookingId
startAt
endAt
status
meetingId
createdAt
updatedAt

Adapt to existing architecture.

========================================================
PART 36 — SESSION SHOULD NOT REDEFINE BOOKING
========================================================

Avoid duplicating:

studentId
expertId
serviceId
price

inside Session unless there is a strong domain reason.

Prefer:

Session
  ↓
Booking
  ↓
Student
Expert
Service

If snapshots are necessary, document why.

========================================================
PART 37 — SESSION STATUS
========================================================

Session may have a separate lifecycle.

Potential:

SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
NO_SHOW

Do not automatically reuse Booking status.

Example:

Booking:
CONFIRMED

Session:
SCHEDULED

Later:

Booking:
COMPLETED

Session:
COMPLETED

Define the relationship explicitly.

========================================================
PART 38 — SESSION DATE/TIME
========================================================

Session should use the booking's actual scheduled time.

Do not regenerate session time from the current Expert schedule.

If Expert later changes availability:

Existing Session remains unchanged.

========================================================
PART 39 — BOOKING IMMUTABILITY
========================================================

Once confirmed, determine which fields are immutable.

Typically:

expert
service
startAt
endAt
price snapshot

should not be silently changed.

If rescheduling is required:

implement an explicit reschedule flow.

Do NOT allow arbitrary PATCH operations.

========================================================
PART 40 — RESCHEDULING
========================================================

Do not implement unless required.

If required later, design:

Booking
 ↓
Reschedule request
 ↓
New slot validation
 ↓
Conflict check
 ↓
Update booking/session
 ↓
Notifications

Do not allow direct manipulation of startAt/endAt.

If deferred, document it.

========================================================
PART 41 — CALENDAR INTEGRATION
========================================================

When a booking becomes confirmed:

future calendar integration may create:

calendar event
meeting link

Do not implement fake integrations.

If the current system already has meeting/calendar infrastructure,
integrate with it.

Otherwise document:

Booking confirmed
        ↓
Calendar event integration
        ↓
Meeting details

as a future integration.

========================================================
PART 42 — MEETING LINK
========================================================

Determine whether the platform already supports:

Google Meet
Zoom
internal meeting room
other provider

If not available:

do not generate fake meeting links.

Session may temporarily contain:

meetingStatus:
PENDING

or equivalent.

Use the existing architecture.

========================================================
PART 43 — PAYMENT RELATIONSHIP
========================================================

Inspect existing:

Order
Payment
Checkout

architecture.

Do not create:

BookingPayment

if the existing commerce model can represent it.

Possible future relationship:

Booking
  ↓
Order
  ↓
Payment

Determine whether:

Order belongs to Booking

or:

Booking references Order.

Document the final relationship.

========================================================
PART 44 — BOOKING VS ORDER
========================================================

These concepts must remain distinct.

Booking:

"What service/time was reserved?"

Order:

"What was purchased?"

Payment:

"How was the purchase paid?"

Example:

Booking
Career Mentorship
10:00

Order
₹2,000

Payment
UPI/Card/etc.

Do not merge all three into Booking.

========================================================
PART 45 — FREE SERVICES
========================================================

Determine whether services can be free.

If yes:

Booking may become confirmed without payment.

If not:

booking must follow the existing payment flow.

Do not assume every booking requires payment.

========================================================
PART 46 — PAID BOOKING FLOW
========================================================

If payment is already available:

Student
 ↓
Service
 ↓
Slot
 ↓
Intake
 ↓
Create booking/order
 ↓
Payment
 ↓
Confirm booking
 ↓
Create session

The exact transactional sequence must follow the existing payment
architecture.

Do not mark a booking CONFIRMED merely because the frontend
redirected to checkout.

========================================================
PART 47 — PAYMENT FAILURE
========================================================

If payment fails:

determine whether booking becomes:

FAILED
EXPIRED
CANCELLED

and whether the slot is released.

Do not leave permanent phantom reservations.

========================================================
PART 48 — PAYMENT SUCCESS RACE CONDITION
========================================================

Payment callbacks/webhooks may arrive:

multiple times
late
out of order

Booking confirmation must be idempotent.

Do not create:

two sessions
two bookings
two orders

because a payment webhook was delivered twice.

========================================================
PART 49 — IDEMPOTENCY
========================================================

Create an idempotent booking creation strategy.

If the same request is submitted twice because of:

double click
network retry
browser retry
API retry

the system must not create duplicate bookings.

Determine whether to use:

idempotency key
client request ID
transactional uniqueness
other reliable mechanism

Document it.

========================================================
PART 50 — API IDEMPOTENCY
========================================================

If POST /bookings is not naturally idempotent:

support an idempotency mechanism.

Example:

Idempotency-Key

Do not rely on frontend button disabling.

Frontend protection is UX.

Backend idempotency is correctness.

========================================================
PART 51 — BOOKING TRANSACTION
========================================================

Where appropriate, booking creation should be transactional.

Conceptually:

BEGIN TRANSACTION

validate student
validate service
validate expert
validate slot
validate availability
check conflicts
create booking
create session if appropriate
create order if appropriate

COMMIT

The exact transaction boundary must follow the project's payment
architecture.

========================================================
PART 52 — FAILURE ROLLBACK
========================================================

If:

booking created

but:

session creation fails

or:

order creation fails

the system must not leave inconsistent state.

Use transaction boundaries or reliable compensating behavior.

Document the approach.

========================================================
PART 53 — BOOKING NUMBER
========================================================

If support/admin workflows require a human-readable reference,
introduce:

bookingReference

Example:

EMB-2026-000123

It must be unique.

Do not use it as the database primary key unless that matches
the project's established architecture.

========================================================
PART 54 — TIMEZONE
========================================================

Booking must store actual timestamps in the canonical backend format.

Example:

startAt
endAt

The original Expert timezone context must remain available where
required.

Student UI may display:

Expert timezone
Student timezone

but the underlying booking remains one actual moment in time.

========================================================
PART 55 — TIMEZONE DISPLAY
========================================================

Example:

Expert:
10:00 AM
Asia/Kolkata

Student:
11:30 PM
America/New_York

Both refer to the same booking.

Do not create separate booking timestamps for each user.

========================================================
PART 56 — DST
========================================================

Booking creation must correctly handle DST.

Never manually apply:

UTC-5
UTC-4

based on hardcoded offsets.

Use IANA timezone support.

========================================================
PART 57 — BOOKING EXPIRATION
========================================================

If:

PENDING
or
HELD

exists, define expiration.

Example:

Created:
10:00

Expires:
10:15

After expiration:

slot becomes available again.

Do not implement arbitrary expiration values.

Use product/payment requirements.

========================================================
PART 58 — CRON / CLEANUP
========================================================

If temporary holds exist:

implement or document cleanup.

Potential:

scheduled job
database expiration query
lazy expiration

Do not allow expired holds to permanently block availability.

========================================================
PART 59 — PUBLIC BOOKING SECURITY
========================================================

Never trust:

studentId
expertId
price
duration
status

from the client.

Derive or verify them server-side.

Example:

Client:

serviceId = X

Backend:

service X belongs to Expert Y
service duration = 60
service price = 1000

Do not accept:

duration = 30

from the client as authoritative.

========================================================
PART 60 — CLIENT FLOW
========================================================

Build the Student booking experience:

Step 1:
Expert

Step 2:
Service

Step 3:
Date

Step 4:
Available Slot

Step 5:
Intake

Step 6:
Review

Step 7:
Booking / Payment

Step 8:
Confirmation

Do not overload one page with all functionality if the existing
design system supports a clearer multi-step flow.

========================================================
PART 61 — BOOKING REVIEW
========================================================

Before final submission show:

Expert
Service
Date
Time
Timezone
Duration
Price if applicable
Intake summary

Student should clearly understand:

"What am I booking?"

========================================================
PART 62 — CONFIRMATION
========================================================

After successful booking:

Show:

Booking confirmed
Expert
Service
Date
Time
Timezone
Booking reference
Session information if available

CTA:

View booking

Potential:

Add to calendar

only if calendar integration exists.

========================================================
PART 63 — FAILURE STATES
========================================================

Handle:

Slot no longer available
Service unavailable
Expert unavailable
Invalid intake
Booking conflict
Payment failure
Network error
Authorization failure
Server error

Do not display generic:

"Something went wrong"

when the system knows the actual reason.

========================================================
PART 64 — SLOT TAKEN UX
========================================================

If the slot disappears during booking:

Show:

"This time was just booked."

Then:

Refresh availability

Do not silently move the student to another time.

Never automatically change the student's selected slot without
explicit consent.

========================================================
PART 65 — BOOKING HISTORY
========================================================

Student:

Upcoming
Past
Cancelled

Expert:

Upcoming
Past
Cancelled

Use server-side pagination if the dataset can become large.

Do not load all historical bookings indefinitely.

========================================================
PART 66 — BOOKING SEARCH/FILTER
========================================================

Expert dashboard may eventually need:

date filter
service filter
status filter
student search

Implement only what's required for Phase 5.

Keep API design extensible.

========================================================
PART 67 — NOTIFICATIONS
========================================================

Inspect existing notification infrastructure.

Booking lifecycle may eventually trigger:

booking created
booking confirmed
booking cancelled
booking reminder
session starting

Do not build duplicate notification systems.

If notifications are deferred:

document integration points.

========================================================
PART 68 — AUDIT TRAIL
========================================================

Determine whether booking status changes require auditing.

Recommended for important transitions:

created
confirmed
cancelled
completed

Potential:

BookingEvent

or:

AuditLog

Do not introduce a new audit system if one already exists.

========================================================
PART 69 — BOOKING EVENTS
========================================================

If event-driven architecture already exists, define events such as:

booking.created
booking.confirmed
booking.cancelled
booking.completed

These can later drive:

notifications
calendar integrations
analytics
payment reconciliation

Do not introduce event infrastructure solely for Phase 5
if the application does not use it elsewhere.

========================================================
PART 70 — DATABASE CONSTRAINTS
========================================================

Use database-level protection where appropriate.

Examples:

foreign keys
not-null constraints
unique constraints
indexes
status constraints

Do not rely entirely on application validation.

========================================================
PART 71 — BOOKING INDEXES
========================================================

Determine indexes based on actual queries.

Potential:

studentId
expertId
serviceId
startAt
status

Potential composite indexes:

expertId + startAt
studentId + startAt
expertId + status

Only create useful indexes.

========================================================
PART 72 — OVERLAP QUERY
========================================================

Booking conflict detection should use:

existing.startAt < requestedEnd
AND
existing.endAt > requestedStart

combined with:

expertId

and eligible blocking statuses.

Test boundary behavior explicitly.

========================================================
PART 73 — HISTORICAL DATA
========================================================

If mockSessions contains existing records:

DO NOT blindly delete them.

Determine:

Which records represent actual historical sessions?
Which are test/demo data?
Which can migrate to Booking?
Which should remain legacy?

Create a migration strategy.

========================================================
PART 74 — MOCK DATA
========================================================

Separate:

development seed data

from:

production booking data.

Do not call real bookings:

mockSessions

after Phase 5.

If mockSessions remains temporarily for development:

rename or clearly mark it as legacy.

========================================================
PART 75 — API DEPRECATION
========================================================

Find APIs such as:

/mock-sessions
/sessions/mock
or similar.

Determine whether they should be:

removed
deprecated
redirected
migrated

Do not leave two competing sources of truth.

Target:

Booking API
+
Session API

========================================================
PART 76 — SESSION API
========================================================

If Session APIs exist, determine their relationship to Booking.

Potential:

GET /sessions/:id

GET /student/sessions

GET /expert/sessions

But do not duplicate booking functionality.

Booking answers:

"What was booked?"

Session answers:

"What appointment is happening?"

========================================================
PART 77 — EXPERT DASHBOARD
========================================================

Add booking information to the Expert Dashboard.

Potential sections:

Upcoming bookings
Today's sessions
Recent bookings
Calendar

Do not duplicate the entire booking management interface
inside the dashboard.

Use summary + links to detailed views.

========================================================
PART 78 — STUDENT DASHBOARD
========================================================

Add:

Upcoming sessions
Upcoming bookings
Recent bookings

Student should be able to continue from:

Dashboard
 ↓
Booking
 ↓
Session

========================================================
PART 79 — EXPERT PAGE INTEGRATION
========================================================

Phase 2 Expert Page:

Service
 ↓
Book

Phase 3 Service:

Service duration
price
intake configuration

Phase 4:

Availability

Phase 5:

Booking

The layers should connect without embedding all functionality
inside Expert Page.

========================================================
PART 80 — ARCHITECTURAL SEPARATION
========================================================

Keep these domains separate:

Expert Profile
        ↓
Expert Page
        ↓
Services
        ↓
Availability
        ↓
Booking
        ↓
Session
        ↓
Order
        ↓
Payment

They may reference one another.

They should not become one giant entity.

========================================================
PART 81 — BOOKING DATA OWNERSHIP
========================================================

Document:

| Data | Owner |
|---|---|
| Expert identity | mentorProfile |
| Service definition | mentorServices |
| Service duration | mentorServices |
| Service price | Service / Order |
| Weekly availability | Availability |
| Exceptions | Availability |
| Selected appointment | Booking |
| Intake configuration | Service |
| Intake answers | Booking |
| Actual appointment | Session |
| Purchase | Order |
| Transaction | Payment |

Adapt this to the actual schema.

========================================================
PART 82 — SCHEMA CHANGE LOG
========================================================

Update:

docs/architecture/schema-change-log.md

Record:

Phase 5

New entities:
Booking
Session changes
Intake changes

Modified entities:
mentorServices
Order
Payment
Availability

Deprecated:
mockSessions

Include:

field
reason
migration
dependencies
future extension

========================================================
PART 83 — API DOCUMENTATION
========================================================

Create:

docs/api/booking.md

Document:

Create booking
Get booking
List student bookings
List expert bookings
Cancel booking
Session relationship

For every endpoint include:

Method
Route
Authentication
Authorization
Request
Response
Validation
Errors
Status transitions
Concurrency behavior
Idempotency behavior

========================================================
PART 84 — BOOKING STATE DOCUMENT
========================================================

Create:

docs/architecture/booking-state-machine.md

Include:

state diagram
allowed transitions
actors
validation
side effects
payment dependency
session dependency
cancellation behavior
expiration behavior

========================================================
PART 85 — TESTING
========================================================

Create unit tests for:

service ownership
slot validation
availability validation
booking creation
booking status transitions
cancellation
timezone
DST
overlap detection
intake validation
authorization
idempotency

========================================================
PART 86 — CONCURRENCY TEST
========================================================

This test is mandatory.

Create two simultaneous booking requests:

Student A:
Expert X
Service Y
10:00

Student B:
Expert X
Service Y
10:00

Expected:

Exactly ONE succeeds.

The other receives:

slot unavailable / conflict

No database state may contain two conflicting confirmed bookings.

========================================================
PART 87 — IDEMPOTENCY TEST
========================================================

Submit the same booking request twice with the same idempotency
identifier.

Expected:

one booking.

Not:

two bookings.

========================================================
PART 88 — STALE AVAILABILITY TEST
========================================================

1. Student A loads availability.
2. 10:00 appears available.
3. Student B books 10:00.
4. Student A submits 10:00.

Expected:

Student A fails safely.

No double booking.

========================================================
PART 89 — TIMEZONE TEST
========================================================

Expert:

Asia/Kolkata

Student:

America/New_York

Booking:

actual canonical timestamp.

Verify:

Expert sees correct local time.
Student sees correct local time.

The underlying booking remains the same event.

========================================================
PART 90 — SERVICE DURATION TEST
========================================================

Service:

60 minutes

Availability:

09:00–17:00

Test:

09:00–10:00 → valid
16:00–17:00 → valid
16:30–17:30 → invalid

========================================================
PART 91 — BLOCKED PERIOD TEST
========================================================

Availability:

09:00–17:00

Blocked:

13:00–14:00

Service:

60 minutes

No slot may overlap the blocked period.

========================================================
PART 92 — CANCELLATION TEST
========================================================

Create:

confirmed booking

Cancel it.

Verify:

booking status changes correctly.

Verify:

availability is released according to business rules.

Verify:

session behavior is correct.

Verify:

historical record remains.

========================================================
PART 93 — AUTHORIZATION TEST
========================================================

Student A cannot access:

Student B booking.

Expert A cannot access:

Expert B booking.

Expert A cannot modify:

Expert B booking.

Public visitor cannot access:

private booking details.

========================================================
PART 94 — PAYMENT INTEGRATION TEST
========================================================

If payment exists:

Payment success
 ↓
Booking confirmation

Payment failure
 ↓
No permanent confirmed booking

Duplicate payment callback
 ↓
No duplicate booking/session

Do not test fictional payment providers.

Use the actual payment architecture.

========================================================
PART 95 — E2E FLOW
========================================================

Implement/test the complete flow:

Student
 ↓
Open Expert Page
 ↓
Select Service
 ↓
Select Date
 ↓
Select Available Slot
 ↓
Complete Intake
 ↓
Review
 ↓
Submit Booking
 ↓
Payment if required
 ↓
Booking Confirmation
 ↓
View Booking
 ↓
View Session

Verify every step works against real backend data.

========================================================
PART 96 — EXPERT E2E FLOW
========================================================

Expert:

Login
 ↓
Dashboard
 ↓
Bookings
 ↓
Open Booking
 ↓
View Student
 ↓
View Intake
 ↓
View Session
 ↓
Manage eligible state

Verify authorization at every step.

========================================================
PART 97 — NO FAKE FUNCTIONALITY
========================================================

Do NOT create fake:

bookings
payments
meeting links
calendar events
notifications
session states

unless explicitly part of existing development infrastructure.

If functionality belongs to a future phase:

document it as:

DEFERRED

========================================================
PART 98 — FINAL ARCHITECTURE
========================================================

The target architecture should look like:

                         EXPERT
                           │
                    mentorServices
                           │
                           ▼
                        SERVICE
                           │
                           ▼
                     AVAILABILITY
                           │
                           ▼
                    AVAILABLE SLOT
                           │
                           ▼
                         STUDENT
                           │
                           ▼
                        INTAKE
                           │
                           ▼
                        BOOKING
                     ┌─────┼─────┐
                     │     │     │
                     ▼     ▼     ▼
                  Student Expert Service
                           │
                           ▼
                         Order
                           │
                           ▼
                        Payment
                           │
                           ▼
                        Session
                           │
                           ▼
                      Meeting

The exact Order/Payment position depends on the existing commerce
architecture.

========================================================
PART 99 — FINAL SOURCE OF TRUTH

The final ownership rules must be:

mentorProfiles

Who the Expert is.

mentorServices

What the Expert offers.

Availability

When the Expert is available.

Booking

What a Student reserved.

Intake

Information collected for the booking.

Order

What was purchased.

Payment

How it was paid.

Session

The actual appointment created from the booking.

Available Slots

Derived availability.

mockSessions

LEGACY / DEPRECATED.

========================================================
PART 100 — FINAL VERIFICATION

At the end, verify:

Can Student select an Expert?
Can Student select a Service?
Can Student select an available slot?
Can Student complete intake?
Can Student create a Booking?
Is slot availability revalidated server-side?
Can two Students double-book the same slot?
Is concurrency protected?
Is booking creation idempotent?
Is Booking separate from Session?
Does Session reference Booking?
Is Service ownership verified?
Is Expert ownership verified?
Are booking timestamps timezone-safe?
Are historical timestamps immutable?
Are cancelled bookings preserved?
Are private intake responses protected?
Can Student view only their own bookings?
Can Expert view only their own bookings?
Is mockSessions no longer the source of truth?
Is Order separate from Booking?
Is Payment separate from Booking?
Can payment failure leave phantom confirmed bookings?
Can duplicate payment callbacks create duplicate sessions?
Does the full Student → Booking → Session flow work?

For each answer:

YES — VERIFIED

PARTIAL

NO

BLOCKED

Never mark something VERIFIED unless it was actually tested.

========================================================
PART 101 — FINAL REPORT

At completion provide:

Files created
Files modified
Files deprecated
Database migrations
New entities
Modified entities
API endpoints
Frontend routes
Booking state machine
Session relationship
Intake architecture
Payment integration
Concurrency strategy
Idempotency strategy
Authorization strategy
Timezone strategy
Tests added
E2E flow result
Remaining issues
Deferred functionality

Most importantly, explicitly state:

CURRENT mockSessions ROLE:
...

NEW Booking ROLE:
...

NEW Session ROLE:
...

MIGRATION STATUS:
...

SOURCE OF TRUTH:
...

========================================================
NON-NEGOTIABLE RULES
Do not use mockSessions as the source of truth for real bookings.
Do not create duplicate booking models if one already exists.
Do not allow the client to determine price, duration, Expert,
status, or booking eligibility.
Do not trust stale availability results.
Revalidate availability when creating a booking.
Prevent double booking at the backend/database level.
Make booking creation idempotent.
Do not delete historical bookings.
Do not expose private intake or calendar information.
Do not merge Booking, Session, Order, and Payment into one entity.
Do not create fake payment/calendar/meeting integrations.
Do not let frontend-only validation determine booking correctness.
Do not silently change confirmed booking times.
Do not store generated available slots as the primary source
of truth.
Preserve timezone correctness.
Keep the architecture extensible for:
rescheduling
refunds
reminders
calendar integrations
meeting providers
recurring services
group sessions
analytics

without implementing unnecessary future functionality now.


### The architectural transition I would enforce

The biggest thing to make your LLM verify is this:

```text
BEFORE

mockSessions
    │
    ├── expert
    ├── student
    ├── service
    ├── time
    └── session-ish data


AFTER

                    mentorServices
                         │
                         ▼
                    Availability
                         │
                         ▼
                  Available Slot
                         │
                         ▼
                       Booking
                    ┌────┼────┐
                    │    │    │
                 Student Expert Service
                         │
                  ┌──────┼──────┐
                  ▼      ▼      ▼
                Intake  Order  Payment
                         │
                         ▼
                       Session
                         │
                         ▼
                      Meeting

The distinction is important because later you'll be able to support things like rescheduling, cancellation/refunds, different meeting providers, multiple sessions, group sessions, and payment reconciliation without turning mockSessions into an increasingly complicated catch-all entity.