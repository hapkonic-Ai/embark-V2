You are working on the Embark application.

Act as a:

- Senior Product Engineer
- Senior Frontend Engineer
- Senior Backend Engineer
- Database Architect
- API Architect
- Security Engineer
- Authorization Engineer
- Scheduling Engineer
- Payment/Booking Engineer
- UX Engineer
- QA Engineer

Your task is to fully implement and verify:

# PHASE 6 — EXPERT OPERATIONS & CUSTOMER MANAGEMENT

The previous phases are:

Phase 1 — Expert Foundation
Phase 2 — Expert Page
Phase 3 — Services
Phase 4 — Calendar & Availability
Phase 5 — Real Booking

Phase 6 must build directly on those systems.

Do not recreate existing domain models.

============================================================
1. PHASE 6 OBJECTIVE
============================================================

The purpose of Phase 6 is to give an Expert a complete operational
workspace for managing:

- Bookings
- Customers
- Sessions
- Service relationships
- Payments
- WhatsApp access
- Private notes
- Rescheduling
- Cancellation
- Completion
- Reviews
- Ratings

The Expert should be able to understand the complete relationship
with a customer from one place.

The intended experience is:

Expert
 ↓
Operations
 ├── Dashboard
 ├── Bookings
 ├── Customers
 ├── Services
 └── Reviews

The central Customer 360 relationship is:

Customer
   │
   ├── Profile
   ├── Services
   ├── Bookings
   ├── Sessions
   ├── Payments
   ├── WhatsApp Access
   ├── Notes
   └── Reviews
============================================================
2. CRITICAL PRODUCT DECISION — WHATSAPP

Embark will NOT be the primary communication platform between
Students and Experts.

Student ↔ Expert communication happens through WhatsApp.

Therefore:

DO NOT build an in-app messaging system for Phase 6.

Do NOT create:

Conversation
Message
Chat
Inbox
Chat thread
Message composer
In-app messaging dashboard

for Student ↔ Expert communication.

If existing messaging entities already exist in the repository,
inspect them before deleting anything.

Determine whether they are:

actively used elsewhere
unused
deprecated
future functionality

Do not blindly delete existing infrastructure.

============================================================
3. PRODUCT RESPONSIBILITY BOUNDARY

Embark owns:

Expert profiles
Expert pages
Services
Pricing
Availability
Bookings
Payments
Sessions
Customer relationships
WhatsApp access eligibility
Private Expert notes
Reviews
Ratings

WhatsApp owns:

Direct Student ↔ Expert communication
WhatsApp Group communication
Ongoing mentorship communication
Group discussions
Messages
Follow-ups
Announcements

Embark must NOT pretend to control WhatsApp unless an actual
WhatsApp integration exists.

============================================================
4. IMPORTANT ARCHITECTURAL PRINCIPLE

The system must remain:

mentorProfiles
=
Expert identity/profile

mentorServices
=
What the Expert offers

Availability
=
When the Expert can be booked

Booking
=
Reservation

Session
=
Actual appointment/session

Payment / Order
=
Financial transaction

Customer
=
Operational relationship between an Expert and a Student

WhatsApp Configuration
=
Communication method for a Service

Note
=
Private Expert information

Review
=
Student feedback/reputation

Do not create duplicate versions of these concepts.

============================================================
5. DO NOT REINTRODUCE MOCK SESSIONS

Phase 5 replaced the old mock session concept with the proper:

Booking
+
Session

architecture.

Do NOT create:

mockSessions
expertSessions
mentorSessions
expertBookings
mentorBookings

or any other duplicate lifecycle model.

Phase 6 must operate on the existing Booking and Session models.

============================================================
6. EXPERT OPERATIONS INFORMATION ARCHITECTURE

Create or extend:

Expert Operations

with:

Overview
Bookings
Customers
Services
Reviews

Potential route structure:

/expert/dashboard

/expert/bookings

/expert/bookings/:id

/expert/customers

/expert/customers/:id

/expert/services

/expert/reviews

Use the application's existing routing conventions.

Do not create duplicate routes if equivalent pages already exist.

============================================================
7. EXPERT DASHBOARD

The Expert dashboard should be an operational overview.

Show relevant information such as:

Today's Sessions

Upcoming Bookings

Recent Customers

Pending Actions

Recent Reviews

Service Performance if already supported

Useful metrics may include:

Today's bookings
Upcoming sessions
Completed sessions
Active customers
New customers
Unread operational notifications if such a system exists
Average rating
Review count

Do not turn this into a full analytics dashboard.

Keep it operational.

============================================================
8. BOOKINGS

Create or extend:

Expert
↓
Bookings

The booking list should show:

Customer
Service
Date
Time
Timezone
Booking status
Payment status
Session status
Communication method

Support:

Upcoming
Today
Past
Cancelled
Completed

Use server-side pagination where appropriate.

============================================================
9. BOOKING SEARCH

Expert should be able to search bookings by:

Customer name
Customer email
Booking ID/reference
Service name

Search must be scoped to the authenticated Expert.

Expert A must never receive Expert B's bookings.

============================================================
10. BOOKING FILTERS

Support useful filters:

Status
Service
Customer
Date range
Payment status
Session status

Do not load the entire booking dataset into the browser merely
to perform filtering.

============================================================
11. BOOKING DETAIL

Booking Detail should show:

Customer

Service

Date

Time

Timezone

Duration

Booking status

Payment status

Session status

Intake information

Communication method

WhatsApp access status

Relevant private notes

Review status

Available actions

Actions may include:

[Reschedule]

[Cancel]

[Complete]

[Contact on WhatsApp]

[Open Customer]

Only display actions that are valid for the current state.

============================================================
12. BOOKING ACTIONS

Supported Expert operations:

Reschedule
Cancel
Complete

Potential future action:

Mark No-show

Only implement No-show if required by the existing product.

Do not allow arbitrary status editing.

Never expose a generic status dropdown that allows the Expert to
manually set any state.

============================================================
13. BOOKING STATE MACHINE

Use the Phase 5 booking lifecycle.

Do not create a competing state machine.

Determine the existing valid transitions.

Conceptually:

CONFIRMED
│
├── CANCELLED
│
└── COMPLETED

Use the actual Phase 5 implementation as the source of truth.

Document the state transitions.

============================================================
14. SESSION STATE MACHINE

Use the existing Session lifecycle.

Conceptually:

SCHEDULED
│
├── CANCELLED
├── NO_SHOW
└── COMPLETED

Do not assume these exact statuses if Phase 5 defines them differently.

Inspect the repository and use the existing implementation.

============================================================
15. RESCHEDULE

Expert rescheduling must use the Calendar/Availability system.

Correct flow:

Expert
↓
Booking
↓
Reschedule
↓
Select date
↓
Select available slot
↓
Server-side validation
↓
Confirm
↓
Update Booking
↓
Update Session
↓
Update availability/occupancy
↓
Notify Student if notification infrastructure exists

Do NOT simply update:

startAt
endAt

from the client.

============================================================
16. RESCHEDULE VALIDATION

The backend must verify:

Booking belongs to authenticated Expert.
Booking can be rescheduled.
Service still exists.
New slot is valid.
New slot belongs to Expert availability.
New slot is not blocked.
New slot is not in the past.
New slot does not conflict with another booking.
New slot satisfies service duration.
New slot satisfies booking rules.
Student conflict rules if applicable.

Never trust frontend availability.

============================================================
17. RESCHEDULE CONCURRENCY

Rescheduling must be concurrency-safe.

Scenario:

Expert selects 15:00.

Another booking consumes 15:00.

Expert confirms.

Expected:

Reschedule fails safely.

The original booking must remain intact.

Do not partially update the booking.

Do not create a double booking.

============================================================
18. RESCHEDULE TRANSACTION

Determine the correct transaction boundary.

The operation should be atomic.

Conceptually:

validate
↓
reserve new slot
↓
release old slot
↓
update booking
↓
update session
↓
commit

Adapt the implementation to the existing database architecture.

============================================================
19. CANCELLATION

Expert can cancel eligible bookings.

Flow:

Expert
↓
Booking
↓
Cancel
↓
Confirmation
↓
Cancellation reason if required
↓
Update Booking
↓
Update Session
↓
Payment/refund handling if supported
↓
Update access state if required
↓
Notify Student if supported

Do NOT physically delete bookings.

Historical bookings must remain available.

============================================================
20. CANCELLATION RULES

Determine from the existing business rules:

Can an Expert cancel at any time?
Is there a minimum notice period?
Can completed bookings be cancelled?
Can cancelled bookings be cancelled again?
Does cancellation trigger refund?
Does cancellation affect WhatsApp access?

Do not invent financial or access behavior.

============================================================
21. PAYMENT AND REFUNDS

Inspect the existing:

Order
Payment
Refund

architecture.

If cancellation requires a refund:

use the existing payment system.

Do NOT create fake refunds.

If refund functionality does not exist:

document the integration point as deferred.

============================================================
22. SESSION COMPLETION

Expert can complete an eligible session.

Flow:

Expert
↓
Booking
↓
Session
↓
Complete
↓
Server validation
↓
Session = COMPLETED
↓
Review eligibility
↓
Student can review

Do not allow arbitrary frontend status changes.

============================================================
23. CUSTOMER MANAGEMENT

Phase 6 must include a proper:

Customer Management

area.

This is NOT a full CRM.

It is a Customer 360 operational system.

The Expert should be able to understand:

Who is this customer?

What did they purchase?

What services did they book?

What sessions have happened?

What payments were made?

How do I communicate with them?

What private notes do I have?

Have they reviewed my service?

============================================================
24. STUDENT VS CUSTOMER

Do not confuse:

Student/User

with:

Customer

Student/User is the platform identity.

Customer is the operational relationship between:

Expert
+
Student

A student may exist on Embark without ever becoming a customer
of a particular Expert.

A customer relationship exists when the student has a legitimate
relationship with that Expert, such as through:

Booking
Purchase
Completed service
Other explicitly supported interaction
============================================================
25. CUSTOMER ENTITY DECISION

Before creating:

Customer
ExpertCustomer
MentorCustomer
ExpertStudent

inspect the existing architecture.

Do not create a new entity if the relationship can safely be derived
from existing bookings.

However, if persistent Expert ↔ Student relationship data is required,
a dedicated relationship entity may be appropriate.

Possible future structure:

ExpertStudentRelationship

but do not introduce it unless needed.

Document the decision.

============================================================
26. CUSTOMER LIST

Create:

Expert
↓
Customers

Display:

Customer name
Profile image if available
Services purchased
Booking count
Last session
Next session
Customer status
Joined/first booking date
Last activity if available

Support:

Search
Filters
Sorting
Pagination
============================================================
27. CUSTOMER SEGMENTS

At minimum support operational categories such as:

All Customers

New Customers

Active Customers

Past Customers

Do not implement advanced CRM segmentation yet.

No:

marketing segments
lead scoring
sales pipeline
campaign management

These belong to a future CRM/Growth phase.

============================================================
28. CUSTOMER STATUS

If a customer status is needed, define it clearly.

Potential:

NEW
ACTIVE
PAST

Do not create a manually editable status unless there is a real
business requirement.

Prefer deriving status from actual relationship activity where
possible.

============================================================
29. CUSTOMER SEARCH

Expert can search customers by:

Name
Email
Phone if permitted
Booking reference
Service

All searches must be scoped to the authenticated Expert.

============================================================
30. CUSTOMER DETAIL — CUSTOMER 360

Create:

Expert
↓
Customers
↓
Customer Detail

The Customer Detail page should contain:

Overview

Services

Bookings

Sessions

Payments

WhatsApp

Notes

Reviews

============================================================
31. CUSTOMER PROFILE

Show appropriate student information:

Name
Profile image
Email if permitted
Phone if permitted
Relevant profile information
Customer since
Relationship status

Do not expose unrelated private platform information.

============================================================
32. CUSTOMER SERVICES

Show services the customer has interacted with.

Example:

Services

Career Mentorship
Resume Review
Interview Preparation

For each:

Service
First booking
Most recent booking
Booking count
Status if relevant
============================================================
33. CUSTOMER BOOKINGS

Show the customer's booking history with this Expert.

Include:

Upcoming
Completed
Cancelled

Each booking should link to:

Booking Detail.

============================================================
34. CUSTOMER SESSIONS

Show:

Upcoming Sessions

Past Sessions

Cancelled Sessions where appropriate

Each session should link back to its Booking.

Do not create another session history model.

============================================================
35. CUSTOMER PAYMENTS

If payment/order information is available:

show appropriate payment history.

Display:

Service
Amount
Payment status
Date
Order/reference

Do not expose:

card numbers
payment credentials
sensitive payment information

Reuse existing payment/order APIs.

============================================================
36. CUSTOMER WHATSAPP

Customer Detail must provide the communication method configured
for the relevant service.

Examples:

[WhatsApp Direct]

[Contact on WhatsApp]

or:

[Private WhatsApp Group]

[Join WhatsApp Group]

The actual CTA depends on:

Service communication configuration
+
Booking eligibility
+
Payment status
+
Access policy.

============================================================
37. PRIVATE NOTES

Expert can create private notes about Customers.

Notes are internal Expert information.

Notes are NOT WhatsApp messages.

Notes are NOT visible to Students.

============================================================
38. NOTE MODEL

Inspect whether a Note entity already exists.

If not, determine the minimal appropriate schema.

Conceptually:

Note
├── id
├── expertId
├── studentId/customer relationship
├── bookingId optional
├── sessionId optional
├── content
├── createdAt
└── updatedAt

Do not blindly add every relationship.

Determine whether notes are:

Student-level

or:

Session-level

or:

Booking-level.

Document the final decision.

============================================================
39. NOTE CRUD

Expert should be able to:

Create Note
View Note
Edit Note
Delete Note if permitted

All operations require authorization.

============================================================
40. NOTE PRIVACY

Notes must NEVER be exposed through:

Public Expert Page
Public Service Page
Student profile
Student booking APIs
Student session APIs

unless explicitly designed otherwise.

============================================================
41. WHATSAPP COMMUNICATION MODEL

Services must support communication configuration.

Potential modes:

WHATSAPP_DIRECT

WHATSAPP_GROUP

WHATSAPP_DIRECT_AND_GROUP

Use only the modes required by the product.

============================================================
42. SERVICE COMMUNICATION CONFIGURATION

While creating/editing a Service:

Communication

○ WhatsApp Direct

○ Private WhatsApp Group

○ Both

If WhatsApp Direct:

configure the appropriate WhatsApp contact.

If WhatsApp Group:

configure the group access mechanism.

============================================================
43. SERVICE-LEVEL OWNERSHIP

WhatsApp configuration belongs to:

mentorServices

NOT globally to:

mentorProfiles

because one Expert can offer multiple services with different
communication models.

Example:

Service A
₹500
WhatsApp Direct

Service B
₹2,000
Private WhatsApp Group

Service C
Free
WhatsApp Direct

============================================================
44. COMMUNICATION BADGES

Public service pages should clearly communicate the channel.

Examples:

[WhatsApp]

[WhatsApp Direct]

[Private WhatsApp Group]

For free services:

[WhatsApp]

"Communication happens via WhatsApp."

For paid services:

[WhatsApp Direct]

or:

[Private WhatsApp Group]

Do not imply WhatsApp is embedded into Embark.

============================================================
45. PUBLIC VS PRIVATE WHATSAPP ACCESS

Public users can see:

"Communication via WhatsApp"

or:

"Private WhatsApp Group"

But private access information must NOT be exposed publicly.

Never expose private group invitation URLs on:

Public Expert Page
Public Service Page
Search results
SEO metadata
Unauthenticated APIs
============================================================
46. PAID SERVICE ACCESS

For paid services:

Student
↓
Booking
↓
Payment
↓
Payment successful
↓
Booking confirmed
↓
WhatsApp access unlocked

Do NOT expose private WhatsApp group access before payment.

============================================================
47. FREE SERVICE ACCESS

For free services:

Student
↓
Book/Register
↓
Booking confirmed
↓
WhatsApp access

No payment is required.

============================================================
48. ACCESS ELIGIBILITY

Determine access using:

Booking status
Payment status
Service communication configuration
Access policy

Do not create a separate access entity unless the product requires
an independent access lifecycle.

Prefer derived access when possible.

============================================================
49. WHATSAPP DIRECT

If direct WhatsApp is configured:

show:

[Contact on WhatsApp]

Use a valid WhatsApp link/action if supported.

Do not expose unnecessary phone numbers if a CTA can be used.

============================================================
50. WHATSAPP GROUP

If a private group is configured:

show:

[Join Private WhatsApp Group]

only to eligible customers.

Do not expose the actual invitation URL publicly.

============================================================
51. WHATSAPP API LIMITATIONS

Unless a real WhatsApp Business/API integration exists:

Embark CANNOT claim to:

automatically add students to groups
automatically remove students from groups
read WhatsApp messages
send WhatsApp messages from the backend
verify group membership
track WhatsApp activity

Do not fake these capabilities.

If only a group invitation URL exists:

Embark provides the link to eligible users.

============================================================
52. WHATSAPP ACCESS AFTER CANCELLATION

Determine the product rule:

Does cancellation:

A. revoke access?
B. keep access?
C. revoke after a defined period?

If Embark cannot actually remove a student from WhatsApp:

do not claim that membership was revoked.

Instead distinguish:

Embark access eligibility

from:

actual WhatsApp membership.

============================================================
53. WHATSAPP ACCESS AFTER COMPLETION

Determine whether access:

ends after completion
remains permanently
remains for a defined period

If this varies by service, make it service-level configuration.

Do not invent the policy.

============================================================
54. SERVICE EDITING

If an Expert changes WhatsApp configuration for an existing service:

determine the effect on:

existing customers
existing bookings
future bookings

Do not unexpectedly invalidate existing customers.

If historical consistency matters, use appropriate snapshots.

Document the decision.

============================================================
55. REVIEW SYSTEM

Phase 6 must include:

Reviews
+
Ratings.

After an eligible completed service/session:

Student
↓
Completed Booking
↓
Leave Review
↓
Rating
↓
Written Review
↓
Submit
↓
Review stored
↓
Rating aggregation updated

============================================================
56. REVIEW ELIGIBILITY

Student can review only when eligible.

At minimum verify:

Student has a legitimate booking.
Booking belongs to the relevant Expert/service.
Session/service is completed if completion is required.
Student has not already reviewed the booking if one-review-per-
booking is the chosen rule.

Do not trust frontend eligibility.

============================================================
57. REVIEW DUPLICATION

Prevent duplicate reviews.

Recommended:

one review per completed booking/session.

Use a database constraint where appropriate.

Do not rely only on frontend checks.

============================================================
58. RATING

Use the product's chosen rating scale.

If no scale exists, use:

1–5 stars.

Backend should provide:

averageRating

ratingCount

Do not calculate the official rating solely in the frontend.

============================================================
59. REVIEW MODEL

Inspect whether a Review entity already exists.

If not, determine the minimal schema.

Conceptually:

Review
├── id
├── bookingId
├── serviceId
├── expertId
├── studentId
├── rating
├── reviewText
├── status
├── createdAt
└── updatedAt

Do not duplicate IDs unnecessarily if relationships can safely be
derived.

============================================================
60. REVIEW VISIBILITY

Determine whether reviews are:

Public
Private
Moderated

If public:

reviews may appear on:

Expert Page
Service Page

Do not expose private student information.

============================================================
61. REVIEW MODERATION

If moderation already exists:

reuse it.

Potential statuses:

PENDING
PUBLISHED
HIDDEN
REJECTED

Do not build a complete moderation system if it does not exist.

============================================================
62. REVIEW AFTER CANCELLATION

Cancelled bookings should not normally become review-eligible.

Do not allow:

CANCELLED
↓
Review

unless explicitly required.

============================================================
63. COMPLETION → REVIEW

After a valid completion:

Student Dashboard:

[Leave a Review]

After review:

[View Review]

Do not repeatedly show:

[Leave a Review]

after submission.

============================================================
64. EXPERT REVIEWS

Expert should have a Reviews section.

Show:

Average rating
Rating count
Recent reviews
Service associated with review
Date

If moderation exists, show review status where appropriate.

============================================================
65. CUSTOMER 360 — FINAL VIEW

The Customer Detail page should provide a consolidated view:

================================================
CUSTOMER

Profile

Customer since:
...

Status:
ACTIVE

SERVICES

Career Mentorship
Resume Review

BOOKINGS

Upcoming
Completed
Cancelled

SESSIONS

Upcoming
Past

PAYMENTS

Orders
Payment history

WHATSAPP

[WhatsApp Direct]
[Contact on WhatsApp]

or:

[Private WhatsApp Group]
[Join Group]

NOTES

Private Expert Notes

[+ Add Note]

REVIEWS

Rating
Review history

================================================
66. CUSTOMER NAVIGATION

The system should allow:

Booking
↓
Customer Detail

Customer Detail
↓
Booking Detail

Customer Detail
↓
Service

Customer Detail
↓
WhatsApp

Customer Detail
↓
Review

Booking Detail
↓
Customer

This should feel like one connected operational system.

================================================
67. CUSTOMER RELATIONSHIP BOUNDARY

Do not turn Phase 6 into a full CRM.

Do NOT implement:

Lead pipeline
Sales stages
Lead scoring
Marketing campaigns
Email campaigns
Automated customer journeys
Customer segmentation engine
Sales automation
CRM workflows

These can become a future:

Phase 7 — Advanced CRM / Customer Engagement.

Phase 6 is:

Customer 360
+
Operational Management.

================================================
68. AUTHORIZATION

Every Expert operation must derive the Expert from authenticated
session/auth context.

Never trust:

expertId

from the client.

Example:

POST /bookings/123/cancel

Backend must verify:

booking.expertId === authenticatedExpertId

before executing.

================================================
69. IDOR PROTECTION

Test:

Expert A requests Expert B's booking.

Expected:

403/404 according to API conventions.

Expert A requests Expert B's customer.

Expected:

rejected.

Expert A requests Expert B's notes.

Expected:

rejected.

Expert A requests Expert B's service communication config.

Expected:

rejected.

================================================
70. CUSTOMER DATA PRIVACY

Only expose the information required for Expert operations.

Do not expose:

passwords
authentication data
payment credentials
unrelated private profile information
security information
================================================
71. WHATSAPP PRIVACY

WhatsApp contact information and group links must be protected.

Do not expose private group links through:

Public APIs
Public pages
Search
SEO metadata
Unauthenticated endpoints
================================================
72. REVIEW SECURITY

Students must not be able to:

review services they never booked
review another Expert
submit arbitrary reviews
duplicate reviews

Experts must not be able to manipulate Student reviews unless
explicit moderation permissions exist.

================================================
73. API ARCHITECTURE

Inspect the existing API conventions first.

Potential conceptual APIs:

GET /expert/bookings

GET /expert/bookings/:id

POST /expert/bookings/:id/reschedule

POST /expert/bookings/:id/cancel

POST /expert/bookings/:id/complete

GET /expert/customers

GET /expert/customers/:id

GET /expert/customers/:id/bookings

GET /expert/customers/:id/sessions

GET /expert/customers/:id/payments

GET /expert/customers/:id/notes

POST /expert/customers/:id/notes

PATCH /expert/notes/:id

DELETE /expert/notes/:id

GET /expert/reviews

Use the existing architecture.

Do not create duplicate APIs.

================================================
74. API RESPONSE DESIGN

Do not return unnecessary internal database fields.

Return only fields required by the client.

Keep customer information privacy-scoped.

================================================
75. PAGINATION

Use appropriate pagination for:

Bookings
Customers
Sessions
Payments
Notes
Reviews

Use the application's existing pagination convention.

================================================
76. SEARCH PERFORMANCE

Do not fetch all:

customers
bookings
sessions
reviews

into the browser for filtering.

Use server-side search/filtering where appropriate.

================================================
77. CACHE INVALIDATION

After:

Reschedule
Cancel
Complete
Review submission
Note creation
Note editing
Note deletion
Service communication changes

ensure affected cached data is invalidated or updated.

Do not display stale booking/customer information.

================================================
78. CONCURRENCY

Protect against:

Double cancellation
Double completion
Double reschedule
Slot race conditions
Concurrent booking changes
Concurrent review submission

Business-critical operations should be server-authoritative.

================================================
79. TRANSACTION INTEGRITY

Multi-entity operations must remain consistent.

Example:

Reschedule:

Booking
and
Session

must not permanently diverge.

Cancellation:

Booking
and
Session

must remain consistent.

Completion:

Session
and
review eligibility

must remain consistent.

================================================
80. NOTIFICATIONS

Use the existing notification infrastructure if available.

Potential events:

booking.confirmed
booking.rescheduled
booking.cancelled
session.completed
review.available

Do not build a duplicate notification system.

Notifications may tell the Student:

"Your session was rescheduled."

"Your booking was cancelled."

"Your session is complete."

"Leave a review."

WhatsApp remains the communication channel.

================================================
81. CALENDAR INTEGRATION

Use the Phase 4 availability system.

Reschedule:

old slot released
new slot consumed

Cancel:

slot becomes available if product rules allow.

Complete:

historical session remains.

Do NOT modify weekly availability rules when a booking changes.

Weekly schedule:

defines availability.

Booking:

consumes availability.

================================================
82. EMPTY STATES

Create meaningful empty states.

Bookings:

"No bookings yet."

Customers:

"Customers will appear here after they book your services."

Reviews:

"No reviews yet."

Notes:

"No notes yet."

Do not leave empty pages blank.

================================================
83. LOADING STATES

Use proper loading states.

Prevent duplicate mutation submissions.

Do not optimistically change business-critical states unless the
architecture supports safe rollback.

================================================
84. ERROR STATES

Handle:

Unauthorized
Booking not found
Booking already cancelled
Booking already completed
Slot unavailable
Payment failure
Invalid state transition
Network error
Review already submitted
Access denied

Errors should be understandable to the Expert/Student.

================================================
85. MOBILE RESPONSIVENESS

Customer management and booking operations must work on:

Desktop
Tablet
Mobile

Prioritize:

Booking detail
Customer detail
Reschedule
Cancel
WhatsApp CTA
Notes
================================================
86. ACCESSIBILITY

Ensure:

accessible buttons
labelled inputs
keyboard-accessible dialogs
accessible status indicators
clear error messages
proper focus handling
non-color-only status indicators
================================================
87. DATABASE SCHEMA CHECKPOINT

Before modifying the database, inspect:

mentorProfiles
mentorServices
users/students
bookings
sessions
orders
payments
reviews
notes
availability

Determine the minimum required schema changes.

================================================
88. SERVICE COMMUNICATION SCHEMA

Determine whether Service should contain:

communicationMode

and appropriate WhatsApp configuration.

Potential conceptual:

mentorServices
├── communicationMode
├── whatsappContact
├── whatsappGroupInviteUrl
└── communicationAccessPolicy

Do NOT blindly add every field.

Choose the smallest correct schema.

================================================
89. CUSTOMER SCHEMA CHECK

Determine whether a dedicated customer relationship entity is
actually required.

If Customer can safely be derived from:

Expert
+
Student
+
Booking

do not create an unnecessary entity.

If persistent relationship data is required:

document the reason before creating it.

================================================
90. NOTE SCHEMA CHECK

Determine:

Who owns the note?
Who can read it?
Who can edit it?
Who can delete it?
Is it Student-level?
Booking-level?
Session-level?
Can it survive after booking completion?
What happens if a relationship ends?

Document the decision.

================================================
91. REVIEW SCHEMA CHECK

Determine:

Review ownership
Student relationship
Expert relationship
Service relationship
Booking relationship
Rating scale
Review text
Status
Duplicate constraints
Visibility

Document the final schema.

================================================
92. SCHEMA DOCUMENTATION

Create/update:

docs/architecture/expert-operations-schema.md

Document:

mentorServices
Booking
Session
Customer relationship
Payment/Order
WhatsApp configuration
Note
Review

For each field document:

name
type
required
nullable
default
index
foreign key
purpose
privacy
source of truth
================================================
93. SCHEMA CHANGE LOG

Update:

docs/architecture/schema-change-log.md

Record:

Phase 6

New entities:
...

Modified entities:
...

Deprecated entities:
...

Indexes:
...

Constraints:
...

Migrations:
...

Do not overwrite Phase 5 history.

================================================
94. API DOCUMENTATION

Create/update:

docs/api/expert-operations.md

Document:

Bookings
Customers
Notes
WhatsApp access
Reschedule
Cancel
Complete
Reviews

For every endpoint include:

method
route
authentication
authorization
request
response
validation
errors
state transitions
================================================
95. PRODUCT DOCUMENTATION

Create/update:

docs/architecture/expert-operations.md

Document:

Expert dashboard
Booking operations
Customer Management
Customer 360
WhatsApp architecture
Notes
Reviews
Ratings
Rescheduling
Cancellation
Completion
Authorization
Payment integration
Calendar integration
Notification integration
Deferred functionality
================================================
96. E2E TEST — PAID WHATSAPP DIRECT

Test:

Expert
↓
Create Service
↓
Paid
↓
WhatsApp Direct
↓
Configure contact
↓
Publish

Student
↓
Service
↓
Book
↓
Pay
↓
Payment successful
↓
Booking confirmed
↓
WhatsApp CTA unlocked
↓
Contact Expert
↓
Session completed
↓
Review CTA appears
↓
Student submits rating/review

Verify every step.

================================================
97. E2E TEST — PAID WHATSAPP GROUP

Test:

Expert
↓
Create Paid Service
↓
Private WhatsApp Group
↓
Configure group
↓
Publish

Student
↓
Book
↓
Payment successful
↓
Private group access appears
↓
Student joins externally
↓
Session completed
↓
Review available

Verify the group link is NOT visible before payment.

================================================
98. E2E TEST — FREE SERVICE

Test:

Expert
↓
Create Free Service
↓
WhatsApp Direct
↓
Publish

Student
↓
Book/Register
↓
Booking confirmed
↓
WhatsApp CTA available

Verify payment is not required.

================================================
99. E2E TEST — CUSTOMER MANAGEMENT

Test:

Student books service.

Expert:

Dashboard
↓
Customers
↓
Customer
↓
Customer 360

Verify:

Profile
Services
Bookings
Sessions
Payments
WhatsApp
Notes
Reviews

are correctly connected.

================================================
100. E2E TEST — RESCHEDULE

Expert
↓
Bookings
↓
Booking
↓
Reschedule
↓
Select available slot
↓
Confirm
↓
Booking updated
↓
Session updated
↓
Old slot released
↓
New slot consumed

Refresh the page.

Verify state persists.

================================================
101. E2E TEST — CANCEL

Expert
↓
Booking
↓
Cancel
↓
Confirm
↓
Booking cancelled
↓
Session updated
↓
Payment behavior applied if supported
↓
Customer sees correct state

Verify historical booking remains.

================================================
102. E2E TEST — COMPLETE

Expert
↓
Booking
↓
Complete
↓
Session completed
↓
Review eligibility enabled

Student:

My Booking
↓
Completed
↓
Leave Review
↓
Rating
↓
Review

================================================
103. E2E TEST — REVIEW

Student:

Completed Booking
↓
Leave Review
↓
5-star rating
↓
Written review
↓
Submit

Verify:

review saved
rating updated
duplicate review prevented
public visibility follows rules
================================================
104. E2E TEST — SECURITY

Test:

Expert A
↓
Expert B booking

Expected:

FORBIDDEN.

Expert A
↓
Expert B customer

Expected:

FORBIDDEN.

Expert A
↓
Expert B notes

Expected:

FORBIDDEN.

Public visitor
↓
Private WhatsApp group URL

Expected:

NOT EXPOSED.

Unpaid Student
↓
Paid service group access

Expected:

FORBIDDEN.

Student A
↓
Student B review

Expected:

FORBIDDEN.

================================================
105. E2E TEST — CONCURRENCY

Test:

Expert cancels twice.
Expert completes twice.
Expert reschedules twice.
Slot is consumed during reschedule.
Student cancels while Expert completes.
Student submits review twice.

Expected:

No duplicate transitions.

No double bookings.

No corrupted data.

No duplicate reviews.

================================================
106. NO FAKE INTEGRATIONS

Do NOT fake:

WhatsApp API
WhatsApp group membership
WhatsApp message sending
WhatsApp message reading
Refund processing
Calendar synchronization
Notifications

If integration does not exist:

document the integration point.

================================================
107. FUTURE EXTENSIBILITY

Keep the architecture ready for future:

Phase 7 — Advanced CRM / Customer Engagement

Potential future functionality:

Customer tags
Customer segments
Follow-ups
CRM pipeline
Customer lifecycle
Automated reminders
Engagement tracking
Customer analytics
Retention
Repeat purchases

DO NOT implement these in Phase 6.

================================================
108. FINAL DOMAIN MODEL

The final architecture should conceptually be:

                EXPERT
                   │
                   ▼
              mentorProfile
                   │
                   ▼
              mentorService
                   │
         ┌─────────┴─────────┐
         │                   │
    Availability      Communication
         │                   │
         │             ┌─────┴─────┐
         │             │           │
         │            DM         Group
         │
         ▼
      Booking
         │
   ┌─────┼──────┐
   │     │      │
Payment  │    Customer
         │       │
         ▼       ├── Services
      Session    ├── Bookings
         │       ├── Sessions
         │       ├── Payments
         │       ├── WhatsApp
         │       ├── Notes
         │       └── Reviews
         │
         ▼
     Completed
         │
         ▼
    Review/Rating
================================================
109. SOURCE OF TRUTH

Explicitly document:

Expert identity:
mentorProfiles

Service:
mentorServices

Availability:
Availability system

Reservation:
Booking

Appointment:
Session

Financial transaction:
Order / Payment

Customer relationship:
Existing Student/User + Expert relationship derived from valid
bookings unless a dedicated relationship entity is justified.

Communication:
WhatsApp

Communication configuration:
mentorServices

Private Expert information:
Note

Reputation:
Review + Rating

================================================
110. FINAL VERIFICATION

At the end report:

Expert dashboard
Booking management
Customer management
Customer 360
Service communication configuration
WhatsApp Direct
WhatsApp Group
Free service communication
Paid service communication
WhatsApp access control
Private notes
Reschedule
Cancellation
Completion
Payment integration
Calendar integration
Review eligibility
Ratings
Reviews
Authorization
Privacy
Concurrency protection
API implementation
Database changes
Schema documentation
Tests
E2E tests
Deferred functionality

For every item report exactly one:

YES — VERIFIED

PARTIAL

NO

BLOCKED

Never mark:

YES — VERIFIED

unless it was actually implemented and tested.

============================================================
111. FINAL IMPLEMENTATION REPORT

Provide:

Files created
Files modified
Files deprecated

Database migrations

New entities

Modified entities

Deprecated entities

API endpoints

Frontend routes

Booking state transitions

Session state transitions

Customer relationship model

WhatsApp configuration model

WhatsApp access model

Notes model

Reviews model

Ratings model

Authorization model

Concurrency strategy

Payment integration

Calendar integration

Notification integration

Tests added

E2E results

Remaining issues

Deferred functionality

============================================================
112. REQUIRED FINAL ANSWERS

Explicitly answer:

BOOKING SOURCE OF TRUTH:
...

SESSION SOURCE OF TRUTH:
...

CUSTOMER SOURCE OF TRUTH:
...

SERVICE SOURCE OF TRUTH:
...

WHATSAPP SOURCE OF TRUTH:
...

WHATSAPP CONFIGURATION SOURCE OF TRUTH:
...

PAYMENT SOURCE OF TRUTH:
...

REVIEW SOURCE OF TRUTH:
...

NOTE SOURCE OF TRUTH:
...

RESCHEDULE IMPLEMENTATION:
...

CANCELLATION IMPLEMENTATION:
...

COMPLETION IMPLEMENTATION:
...

CUSTOMER 360 IMPLEMENTATION:
...

MOCK SESSIONS STATUS:
...

IN-APP MESSAGING STATUS:
...

SCHEMA STATUS:
...

============================================================
113. NON-NEGOTIABLE RULES
Do NOT build Student ↔ Expert in-app messaging.
WhatsApp is the communication channel.
Do NOT create duplicate Booking models.
Do NOT create duplicate Session models.
Do NOT reintroduce mockSessions.
Do NOT create a duplicate Student/User model.
Do NOT create a Customer entity unless the architecture genuinely
requires persistent Expert ↔ Student relationship data.
Customer Management must exist as Customer 360.
mentorServices owns service-specific communication configuration.
Do not put service-specific WhatsApp configuration into
mentorProfiles unless there is a genuine global configuration.
Do not expose private WhatsApp group links publicly.
Do not expose paid-service WhatsApp access before payment/booking
eligibility.
Do not fake WhatsApp API capabilities.
Do not store WhatsApp message content.
Do not use WhatsApp activity as proof of session completion.
Booking owns reservation lifecycle.
Session owns appointment lifecycle.
Payment owns financial transaction state.
Review owns Student feedback/reputation.
Notes remain private to the Expert.
Reviews require legitimate eligibility.
Prevent duplicate reviews.
Rescheduling must use server-side availability validation.
Rescheduling must be concurrency-safe.
Cancellation must preserve historical records.
Completion must use controlled state transitions.
Never trust expertId from the client.
Prevent IDOR/cross-Expert access.
Never expose sensitive Student/payment information unnecessarily.
Never fake refunds.
Never fake calendar integration.
Never fake notifications.
Reuse existing infrastructure wherever possible.
Do not build a full CRM in Phase 6.
Keep Customer Management focused on Customer 360 and operations.
Document every schema decision.
Document every important state transition.
Test all business-critical mutations.
Test authorization boundaries.
Test concurrency.
Ensure Booking and Session remain consistent.
Ensure Student-facing consequences of Expert actions are correct.
Keep the architecture extensible for future WhatsApp API
integration.
Keep the architecture extensible for a future advanced CRM.
Do not silently invent functionality that is not supported by the
existing application architecture.
============================================================
END OF PHASE 6

### The final Phase 6 scope I'd lock in

```text
PHASE 6
Expert Operations & Customer Management
│
├── Dashboard
│
├── Bookings
│   ├── View
│   ├── Search
│   ├── Filter
│   ├── Reschedule
│   ├── Cancel
│   └── Complete
│
├── Customers
│   ├── All
│   ├── New
│   ├── Active
│   ├── Past
│   └── Customer 360
│       ├── Profile
│       ├── Services
│       ├── Bookings
│       ├── Sessions
│       ├── Payments
│       ├── WhatsApp
│       ├── Notes
│       └── Reviews
│
├── Services
│   └── WhatsApp Configuration
│       ├── Direct
│       ├── Private Group
│       └── Both
│
└── Reviews
    ├── Ratings
    ├── Reviews
    └── Reputation