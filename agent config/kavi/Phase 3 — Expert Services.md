You are working on the Embark application.

Act as a senior product engineer, backend engineer, frontend engineer,
database architect, API designer, UX engineer, security engineer,
and QA engineer.

You have already implemented:

PHASE 1 — Expert Foundation
PHASE 2 — Expert Page

Your task is now to implement:

PHASE 3 — EXPERT SERVICES

The goal is to allow an Expert to create, configure, manage,
publish, unpublish, and eventually sell/book professional services.

========================================================
CORE FLOW
========================================================

Expert
   ↓
Services
   ↓
Create Service
   ↓
Configure
   ↓
Save Draft
   ↓
Preview
   ↓
Publish
   ↓
Public Expert Page
   ↓
Service
   ↓
Future Booking / Payment

The service system must be implemented as a dedicated domain.

DO NOT embed service information inside:

mentorProfiles

ExpertProfile

ExpertPage

ExpertPageConfig

ExpertPageSection

Services must have their own entity/model:

mentorServices

or the project's equivalent canonical naming convention.

========================================================
PART 1 — REPOSITORY AUDIT

Before writing code, inspect the current repository.

Review:

Expert model
mentor model if it exists
mentorProfiles
ExpertProfile
ExpertPage
ExpertPageConfig
ExpertPageSection
authentication
authorization
existing APIs
existing public Expert page
existing mentorship APIs
existing order/payment APIs
existing upload APIs
existing validation
existing database conventions
existing dashboard
existing design system

Do not assume the Phase 1 or Phase 2 implementation matches
the documentation.

Inspect the actual implementation.

Document what already exists.

========================================================
PART 2 — CRITICAL DATA OWNERSHIP RULE

This is the most important requirement of Phase 3.

DO NOT add service fields to:

mentorProfiles

For example, DO NOT create:

mentorProfiles.serviceName
mentorProfiles.serviceDescription
mentorProfiles.price
mentorProfiles.duration
mentorProfiles.sessionType
mentorProfiles.bookingType

Services are independent entities.

Correct architecture:

Expert
│
├── ExpertProfile
│
├── ExpertExperience[]
│
├── ExpertEducation[]
│
├── ExpertSkills[]
│
├── ExpertPage
│
└── mentorServices[]


Each service belongs to an Expert.

========================================================
PART 3 — SERVICE DOMAIN
========================================================

Create a dedicated:

mentorServices

entity/table/model.

The exact naming should follow the existing project's conventions.

Conceptually:

mentorServices

id
mentorId / expertId
title
slug
description
status
createdAt
updatedAt

Additional fields should be determined through schema review.

Do NOT blindly copy this structure.

First inspect the existing data model.

========================================================
PART 4 — SERVICE RESPONSIBILITY
========================================================

mentorServices owns:

- what the Expert offers
- service title
- service description
- service type
- pricing
- duration
- delivery mode
- eligibility
- capacity if applicable
- service status
- publication state
- service-specific configuration

mentorProfiles owns:

- Expert identity
- professional identity
- biography
- headline
- experience
- education
- skills
- social links

ExpertPage owns:

- presentation
- section ordering
- visibility
- branding
- CTA presentation

Do not mix these responsibilities.

========================================================
PART 5 — SERVICE LIFECYCLE
========================================================

Implement an explicit service lifecycle.

Recommended:

DRAFT
PUBLISHED
UNPUBLISHED
ARCHIVED

Use only the states that are actually required.

Basic lifecycle:

Create
  ↓
DRAFT
  ↓
Configure
  ↓
Validate
  ↓
Publish
  ↓
PUBLISHED
  ↓
Edit
  ↓
Draft changes
  ↓
Publish again

Optional:

PUBLISHED
  ↓
Unpublish
  ↓
UNPUBLISHED

Optional:

UNPUBLISHED
  ↓
Archive
  ↓
ARCHIVED

Do not permanently delete service records unless there is a
clear business reason.

========================================================
PART 6 — SERVICE OWNERSHIP
========================================================

Every service must belong to exactly one Expert.

Relationship:

Expert 1
   ↓
mentorServices *

An Expert may have:

0 services
1 service
many services

A service must never exist without an owner.

Add:

foreign key

and appropriate index.

========================================================
PART 7 — SERVICE STATUS VS PUBLISH STATUS
========================================================

Carefully distinguish:

Service lifecycle/status

from:

Public visibility/publishing.

Do not create unnecessary duplicated status systems.

For example, determine whether:

status

alone is sufficient.

Possible:

DRAFT
PUBLISHED
UNPUBLISHED
ARCHIVED

or:

status
+
isPublished

Prefer one clear source of truth.

Document the final decision.

========================================================
PART 8 — SERVICE SCHEMA CHECKPOINT
========================================================

Before implementing UI, produce the final service schema.

Create:

docs/architecture/mentor-services-schema.md

For every field document:

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

Example:

| Field | Type | Required | Public | Purpose |
|---|---|---:|---:|---|
| id | UUID | Yes | No | Service identifier |
| expertId | UUID | Yes | No | Owner |
| title | String | Yes | Yes | Service name |
| description | Text | Yes | Yes | Public description |
| status | Enum | Yes | Yes/derived | Lifecycle |
| price | Decimal | Depends | Yes | Service price |
| currency | String | Depends | Yes | Currency |
| duration | Integer | Depends | Yes | Duration |
| createdAt | DateTime | Yes | No | Audit |
| updatedAt | DateTime | Yes | No | Audit |

Do not assume every field is required.

Use actual product requirements and existing APIs.

========================================================
PART 9 — SERVICE TYPES
========================================================

Determine whether the product needs service types.

Potential:

ONE_ON_ONE
GROUP
ASYNC
REVIEW
CONSULTATION
MENTORSHIP

Do not add all of these automatically.

Start with the minimum type system needed by the current product.

However, the schema should be extensible.

For example:

serviceType

should be an enum or validated value.

Avoid arbitrary strings if the application depends on specific
service behavior.

========================================================
PART 10 — SERVICE TITLE
========================================================

Service title should be:

- required
- human readable
- bounded in length
- sanitized

Example:

"1:1 Product Management Mentorship"

Avoid allowing excessively long titles.

The title should be suitable for:

- Expert dashboard
- Expert Page
- service cards
- future checkout
- future bookings

========================================================
PART 11 — SERVICE DESCRIPTION
========================================================

Service description should explain:

- what the student gets
- who it is for
- what happens during the service
- expected outcome

The description belongs to the service.

It does NOT belong to:

mentorProfiles.bio

Do not automatically copy the Expert bio into the service description.

========================================================
PART 12 — SERVICE PRICING
========================================================

Design pricing carefully because this will later connect to:

Orders
Payments
Bookings
Wallet
Refunds

The service should have its own price.

Do not reuse:

mentorProfiles.price

or another profile-level price.

Potential:

price
currency

or a project-standard money representation.

Inspect the existing order/payment models before deciding.

The current payment/order infrastructure must not be broken.

========================================================
PART 13 — MONEY REPRESENTATION
========================================================

Determine how the existing application stores money.

If the existing system uses:

integer minor units

reuse that convention.

For example:

₹999

should not necessarily be stored as:

999.00 floating point.

Use the project's existing safe monetary representation.

Document:

currency
amount
precision

Do not introduce floating-point monetary calculations.

========================================================
PART 14 — SERVICE DURATION
========================================================

If services are time-based, support duration.

Example:

30 minutes
45 minutes
60 minutes
90 minutes

Store duration using a stable representation such as:

durationMinutes

Do not store:

"1 hour"

as the canonical duration.

Human-readable text should be generated by the UI.

========================================================
PART 15 — DELIVERY MODE
========================================================

Determine whether a service requires:

ONLINE
OFFLINE
ASYNC
HYBRID

Do not create unsupported modes.

If online:

future booking integration should be possible.

If offline:

the future system may need location handling.

Do not add location fields unless required.

========================================================
PART 16 — SERVICE CONFIGURATION
========================================================

A service may require additional configuration.

Potential:

serviceType
durationMinutes
deliveryMode
price
currency
capacity
requirements
outcomes

Do not create arbitrary JSON unless necessary.

If JSON is used:

- define a strict schema
- validate it
- version it if necessary

Never allow arbitrary executable content.

========================================================
PART 17 — SERVICE REQUIREMENTS
========================================================

Allow the Expert to optionally define what the student should
provide before the service.

Example:

"Please share your current resume."

"Please provide your LinkedIn profile."

"Please describe your career goal."

However:

Do not implement a complicated form-builder unless required.

For Phase 3, a simple structured requirement model is preferred.

Potential future:

mentorServiceRequirements[]

But do not create it unless the product actually requires
multiple structured inputs.

If using a simple field:

requirements

must have defined validation.

========================================================
PART 18 — SERVICE OUTCOMES
========================================================

Optionally allow the Expert to describe expected outcomes.

Example:

After the session, you will have:

- Resume feedback
- Career direction
- Action plan

Again:

Do not overengineer this.

If implemented, define whether outcomes are:

plain text
or
structured list

Prefer structured data if the UI needs individual bullets.

========================================================
PART 19 — SERVICE IMAGE
========================================================

If services have images:

Reuse the existing upload infrastructure.

Do NOT create a separate storage system.

A service image should belong to the service or its file asset relation,
not to mentorProfiles.

Validate:

- ownership
- file type
- size
- storage
- access

Public service pages may expose only the intended public asset.

========================================================
PART 20 — SERVICE SLUG
========================================================

Determine whether services need public slugs.

Recommended:

/m/:expertSlug/services/:serviceSlug

or:

/m/:expertSlug/:serviceSlug

However, inspect the existing Expert Page architecture first.

Do not create a competing routing system.

Service slug should be:

- unique within appropriate scope
- URL-safe
- lowercase
- stable
- human-readable

Determine whether uniqueness should be:

global

or:

per Expert.

Prefer per-Expert uniqueness if the URL contains the Expert slug.

========================================================
PART 21 — SERVICE CREATION FLOW
========================================================

Implement:

Expert Dashboard
      ↓
Services
      ↓
Create Service
      ↓
Basic Information
      ↓
Pricing
      ↓
Duration / Delivery
      ↓
Requirements
      ↓
Preview
      ↓
Save Draft
      ↓
Publish

The Expert should never need to fill all fields in one giant form
if the UX can be broken into logical sections.

========================================================
PART 22 — SERVICES DASHBOARD

Create an Expert-facing Services page.

Example:

/expert/services

Display:

Services

[+ Create Service]

Published
1:1 Product Mentorship
₹999 · 60 min

[Edit]
[Preview]
[Unpublish]

Draft
Resume Review

[Continue editing]

Empty state:

You haven't created any services yet.

[Create your first service]

========================================================
PART 23 — SERVICE CARD

Service card should display:

title
type
price
currency
duration if applicable
status
updated date
actions

Actions:

Edit
Preview
Publish
Unpublish
Archive

Only show actions appropriate to the current state.

========================================================
PART 24 — CREATE SERVICE UI

Build a structured service editor.

Suggested sections:

Basic Information
Service Type
Description
Pricing
Duration
Delivery
Requirements
Outcomes
Preview
Publishing

Do not overload the user with unnecessary configuration.

========================================================
PART 25 — BASIC INFORMATION

Fields:

Service title
Service type
Short description

Validation:

title:
required
reasonable max length

description:
required if product requires it
reasonable length

service type:
valid enum

========================================================
PART 26 — PRICING UI

Allow:

Paid service

or:

Free service

ONLY if the product requires both.

If free services are supported:

price = 0

must be valid.

Do not represent free services using:

null

unless the schema explicitly defines null as free.

Currency must follow the existing platform/payment conventions.

========================================================
PART 27 — DURATION UI

If duration applies:

Duration:

30 min
45 min
60 min
90 min

Store:

durationMinutes

Validate minimum/maximum.

Do not allow:

negative
zero if invalid
unreasonable durations

========================================================
PART 28 — PREVIEW

Create a service preview.

Preview should show the service as the student will see it.

Example:

1:1 Product Management Mentorship

₹999
60 minutes

Learn product strategy, interview preparation,
and career planning.

What you'll get:

• Career assessment
• Interview guidance
• Action plan

[Book / Get Started]

The exact CTA must reflect currently implemented capabilities.

Do not create fake booking behavior.

========================================================
PART 29 — PUBLIC SERVICE DISPLAY

Integrate services into the Phase 2 Expert Page.

The Expert Page should support:

SERVICES

section

The section should read from:

mentorServices[]

where:

status = PUBLISHED

or equivalent public visibility condition.

Do not copy services into:

ExpertPageSection.config

The Page section controls presentation.

The service entity controls service data.

Correct:

ExpertPageSection
↓
SERVICES
↓
mentorServices[]

Incorrect:

ExpertPageSection.config.services = [...]

========================================================
PART 30 — SERVICE ORDERING ON EXPERT PAGE

The Expert Page should allow the SERVICES section to be positioned
among other sections.

Example:

HERO
ABOUT
SERVICES
EXPERIENCE
EDUCATION
CTA

The Page Builder controls:

whether SERVICES is visible
where SERVICES appears

The Services system controls:

which services exist
which services are published

========================================================
PART 31 — SERVICE VISIBILITY

There are two different concepts:

Service publication
Services section visibility

Example:

Service A = Published
Service B = Draft

Services section = Visible

Public page should show:

Service A

but not:

Service B

If Services section = Hidden:

No services should be displayed publicly even if services are published.

Do not confuse these states.

========================================================
PART 32 — SERVICE PUBLISH VALIDATION

Before publishing a service validate:

[ ] Owner exists
[ ] Service title exists
[ ] Service description exists if required
[ ] Valid service type
[ ] Valid pricing
[ ] Valid currency
[ ] Valid duration if applicable
[ ] Valid delivery mode if applicable
[ ] Required configuration exists
[ ] Slug is valid
[ ] No conflicting data
[ ] Expert satisfies any publication requirements

Do not publish invalid services.

========================================================
PART 33 — EXPERT ELIGIBILITY

Determine whether the Expert must be:

verified
active
onboarding complete

before publishing a service.

Reuse Phase 1 rules.

Do not invent a new verification system.

If Phase 1 says:

Verified Expert
↓
Can publish

then enforce that.

If not defined:

document the missing decision instead of silently assuming.

========================================================
PART 34 — EDITING PUBLISHED SERVICES

Decide whether edits to published services:

A. Immediately affect the public service

or:

B. Create draft changes requiring republish.

Prefer:

Published version
↓
Edit
↓
Draft changes
↓
Preview
↓
Publish

for important customer-facing changes.

However, inspect the existing architecture and avoid unnecessary
versioning complexity.

Document the final behavior.

========================================================
PART 35 — SERVICE DELETION

Do not hard-delete services casually.

Services may eventually be referenced by:

Orders
Payments
Bookings
Reviews
Refunds
Analytics

Therefore:

Prefer:

ARCHIVED

over:

DELETE

If hard deletion is supported:

only allow it when there are no dependent transactional records.

========================================================
PART 36 — HISTORICAL DATA

This is critical for future payments/bookings.

Suppose:

Service A
₹999

Student books it.

Later Expert changes:

Service A
₹1499

The historical order should NOT suddenly become ₹1499.

Therefore future transactional systems must snapshot:

service
price
currency
duration
and relevant configuration

at transaction time.

Do not implement full order snapshots in Phase 3 unless
the current payment system needs it.

But document this requirement.

========================================================
PART 37 — FUTURE BOOKING COMPATIBILITY

Phase 3 must prepare for:

Phase 4 — Calendar / Availability
Phase 5 — Booking / Payments

Future flow:

Student
↓
Expert Page
↓
Service
↓
Select time
↓
Create booking
↓
Payment
↓
Order
↓
Mentorship session


The service must therefore provide a stable identity:

mentorService.id

Future bookings should reference:

serviceId

not:

service title

not:

mentorProfiles

not:

page section ID

========================================================
PART 38 — FUTURE PAYMENT COMPATIBILITY
========================================================

Future payment flow:

mentorService
      ↓
price
      ↓
Order
      ↓
Payment
      ↓
Booking

Do not make the service itself a payment record.

Do not embed payment transaction data into mentorServices.

Service:

defines what is sold.

Order:

defines what was purchased.

Payment:

defines payment transaction.

Booking:

defines scheduled fulfillment.

Keep these domains separate.

========================================================
PART 39 — EXISTING MENTORSHIP API COMPATIBILITY
========================================================

Inspect the current mentorship API.

The existing system supports mentor-related booking behavior.

Determine how:

mentorId

currently maps to the Expert/Mentor entity.

Do not break the existing API.

If the current booking system eventually needs:

serviceId

do not modify it unnecessarily in Phase 3.

Document the required Phase 4/5 integration.

========================================================
PART 40 — EXISTING ORDER/PAYMENT COMPATIBILITY
========================================================

Inspect the current order and payment models.

Determine how a future:

serviceId

should be represented.

Do not create duplicate payment logic.

Do not create a new payment provider.

Do not change existing payment behavior unless required.

Document:

mentorService
      ↓
future OrderItem / order reference

as an integration point.

========================================================
PART 41 — API DESIGN

Inspect existing API conventions.

Potential APIs:

GET
/api/expert/services

POST
/api/expert/services

GET
/api/expert/services/:id

PATCH
/api/expert/services/:id

POST
/api/expert/services/:id/publish

POST
/api/expert/services/:id/unpublish

POST
/api/expert/services/:id/archive

GET
/api/public/experts/:slug/services

GET
/api/public/services/:slug

Do NOT blindly implement all routes.

Use the project's actual routing conventions.

Avoid unnecessary API fragmentation.

========================================================
PART 42 — AUTHORIZATION

Expert A must never be able to modify:

Expert B's service.

Never trust:

expertId

provided by the frontend.

Incorrect:

POST /services

{
"expertId": "some-other-expert"
}

Correct:

Authenticated User
↓
Resolve Expert
↓
Create service for current Expert

For mutations:

authenticated user
↓
resolve Expert
↓
verify service ownership
↓
mutate

========================================================
PART 43 — PUBLIC SERVICE API

Public APIs must return only public service information.

Never expose:

internal notes
admin metadata
private requirements
private pricing configuration
internal IDs unless needed
draft services
archived services
private analytics

Public response should contain only what a student needs.

Example:

{
id,
title,
description,
serviceType,
price,
currency,
durationMinutes,
deliveryMode,
image,
slug
}

Adapt to the actual final schema.

========================================================
PART 44 — SERVICE REQUIREMENTS PRIVACY

If requirements collect information from students:

Clearly separate:

Service definition

from:

Student-provided information.

Do NOT store student answers inside:

mentorServices

Future model:

mentorServiceRequirements
↓
booking/request
↓
student responses

Do not mix provider configuration with student data.

========================================================
PART 45 — SERVICE CONFIGURATION SCHEMA

If configuration JSON is used:

Define an explicit schema.

Example:

{
"serviceType": "ONE_ON_ONE",
"durationMinutes": 60,
"deliveryMode": "ONLINE"
}

Do not accept arbitrary:

{
"anything": "anything"
}

Validate all fields.

========================================================
PART 46 — PUBLIC PAGE INTEGRATION

Update the Phase 2 Expert Page renderer.

Current:

ExpertPage
↓
Sections
↓
ABOUT
EXPERIENCE
EDUCATION
SKILLS

Add:

SERVICES

The renderer should resolve:

SERVICES
↓
Published mentorServices[]

Do not duplicate service data into page configuration.

========================================================
PART 47 — SERVICE CARD ON PUBLIC PAGE

Create a reusable:

ServiceCard

component.

It should support:

title
description
price
duration
service type
image if available
CTA

Example:

1:1 Product Mentorship

₹999 · 60 min

Get personalized guidance on product
management, interviews and career growth.

[View Service]

Do not make the service card responsible for booking logic.

It should invoke the appropriate route/action.

========================================================
PART 48 — SERVICE DETAIL PAGE

Determine whether the product needs a dedicated service detail page.

Recommended future-compatible route:

/m/:expertSlug/services/:serviceSlug

If implemented:

show:

Expert identity
Service title
Description
Price
Duration
Delivery mode
Requirements
Expected outcomes
CTA

The page should link back to the Expert Page.

Do not create a completely separate Expert identity header.

Reuse existing Expert Page components.

========================================================
PART 49 — CTA BEHAVIOR

CTA must correspond to actual functionality.

If booking is not implemented:

Do not create:

[Book Now]

that leads to a broken page.

Possible Phase 3 behavior:

[View Service]

Then Phase 4/5:

[Choose a Time]
or
[Book Session]

The UI must never imply functionality that does not exist.

========================================================
PART 50 — SERVICE SORTING

Experts may eventually have multiple services.

Determine whether ordering is required.

If yes, create:

displayOrder

or equivalent.

Do not use:

createdAt

as the canonical display order.

Potential:

Service A
Service B
Service C

Expert can reorder them.

This should be independent from:

ExpertPageSection

because:

Page section order
and
Service order

are different concerns.

========================================================
PART 51 — FEATURED SERVICE

Determine whether the product requires a featured service.

If implemented:

isFeatured

must belong to:

mentorServices

not:

mentorProfiles

and not:

ExpertPageSection.

If only one service can be featured, enforce the constraint.

Do not add this feature unless it is actually needed.

========================================================
PART 52 — SERVICE LIMITS

Determine whether there is a maximum number of services per Expert.

Do not invent an arbitrary limit.

If there is a product limit:

enforce it server-side.

Never rely only on frontend validation.

========================================================
PART 53 — SERVICE DUPLICATION

Determine whether Experts can duplicate an existing service.

If implemented:

Duplicate
↓
New DRAFT service

The new service must have:

new ID
new slug
DRAFT status

Do not duplicate transactional history.

========================================================
PART 54 — AUTOSAVE / SAVE

Use the application's existing editing conventions.

If autosave:

debounce
display saving state
handle failure
prevent race conditions

If explicit save:

warn before navigation if unsaved changes exist

Do not silently lose service configuration.

========================================================
PART 55 — DATABASE CONSTRAINTS

Add appropriate:

foreign keys
indexes
unique constraints
not-null constraints
check constraints where supported

Potential indexes:

expertId
status
slug
expertId + status
expertId + slug

Only add indexes that are actually useful.

========================================================
PART 56 — SERVICE SLUG UNIQUENESS

If service slugs are scoped to Expert:

unique:

(expertId, slug)

not:

slug

globally.

Document the decision.

========================================================
PART 57 — SERVICE PUBLICATION

Public queries must filter correctly.

Never:

SELECT all services

and filter only in the frontend.

Correct:

database/API
↓
status = PUBLISHED
↓
public response

Draft and archived services must not leak through public APIs.

========================================================
PART 58 — CACHE INVALIDATION

If public Expert Pages are cached:

When service is:

published
unpublished
edited
archived

invalidate/revalidate:

Expert Page
Service Page

Do not leave old service data cached indefinitely.

========================================================
PART 59 — PERFORMANCE

When loading an Expert Page:

Do not make:

1 request per service.

Prefer:

Expert Page
+
Published Services

in an efficient query/composition.

Avoid N+1 queries.

If an Expert has:

20 services

the public page should not make:

20 additional API requests.

========================================================
PART 60 — RESPONSIVE DESIGN

Services must work on:

Desktop
Tablet
Mobile

Service cards should adapt gracefully.

Handle:

long titles
long descriptions
large prices
multiple services
different durations

========================================================
PART 61 — ACCESSIBILITY

Service editor:

labels
keyboard navigation
validation messages
accessible form controls
focus states

Public service cards:

semantic headings
accessible CTA
proper links
image alt text

Do not rely only on color for status.

========================================================
PART 62 — SECURITY

Test:

Expert A cannot edit Expert B's service.

Expert A cannot publish Expert B's service.

Expert A cannot archive Expert B's service.

Student cannot create Expert services.

Public user cannot see draft services.

Public user cannot see archived services.

Public user cannot access private service configuration.

Invalid URLs rejected.

Invalid prices rejected.

Invalid currencies rejected.

Invalid durations rejected.

Arbitrary HTML/JS injection prevented.

========================================================
PART 63 — DATA VALIDATION

Validate server-side:

title
description
serviceType
price
currency
durationMinutes
deliveryMode
slug
status
configuration
displayOrder

Do not trust frontend validation.

========================================================
PART 64 — SERVICE PAGE + EXPERT PAGE RELATIONSHIP

The relationship must be:

Expert
↓
ExpertPage
↓
SERVICES section
↓
mentorServices[]

Not:

Expert
↓
ExpertPage
↓
copied services

and not:

mentorProfile.services

The Service domain owns service data.

The Page domain only controls presentation.

========================================================
PART 65 — PHASE 2 COMPATIBILITY

Phase 2 created:

ExpertPage
ExpertPageConfig
ExpertPageSection

Phase 3 adds:

mentorServices

The SERVICES section should be introduced into:

ExpertPageSection.sectionType

without changing the fundamental page architecture.

Example:

sectionType:

HERO
ABOUT
EXPERIENCE
EDUCATION
SKILLS
SOCIAL_LINKS
SERVICES
CTA

========================================================
PART 66 — FUTURE PHASE COMPATIBILITY

Design for:

PHASE 4 — Calendar / Availability

PHASE 5 — Booking / Payment

Future architecture:

Expert
│
├── mentorServices[]
│
└── Availability[]
│
▼
Student
│
▼
Service
│
▼
Available Time
│
▼
Booking
│
▼
Order
│
▼
Payment


The service must remain the stable product definition throughout
this flow.

========================================================
PART 67 — SERVICE + CALENDAR RELATIONSHIP
========================================================

Do not put availability inside:

mentorServices

unless the product specifically defines service-specific availability.

Future architecture should be capable of:

Expert availability
+
Service duration

producing:

available booking slots

For example:

Service:
60 minutes

Expert availability:
Monday 10 AM–4 PM

Calendar engine:
generates possible 60-minute slots.

Do not build the calendar in Phase 3.

========================================================
PART 68 — SERVICE + BOOKING RELATIONSHIP
========================================================

Future Booking should reference:

serviceId

Example:

Booking

id
expertId
studentId
serviceId
startTime
endTime
status

Do not identify the service by:

title
slug
page section ID

========================================================
PART 69 — SERVICE + PAYMENT RELATIONSHIP
========================================================

Future order/payment should reference the purchased service.

Example:

Order
 ↓
OrderItem
 ↓
serviceId

The order must preserve the historical price at purchase time.

mentorServices.price

is the CURRENT service price.

OrderItem.price

is the PURCHASED price.

Do not confuse these.

========================================================
PART 70 — REVIEWS COMPATIBILITY
========================================================

Future reviews may reference:

serviceId

if reviews are service-specific.

Do not create review functionality now.

Just ensure:

mentorServices.id

is stable and not regenerated when service configuration changes.

========================================================
PART 71 — SERVICE ARCHIVING
========================================================

When a service is archived:

It should:

- disappear from public page
- disappear from new booking options
- remain available for historical records
- remain available to authorized Expert/admin views

Existing bookings/orders must not break.

This is why hard deletion should be avoided.

========================================================
PART 72 — SERVICE VERSIONING
========================================================

Do not implement full service versioning unless required.

But document:

Current service data
       ↓
future transaction snapshot
       ↓
historical record

This is sufficient for Phase 3.

========================================================
PART 73 — MIGRATION FROM EMBEDDED DATA
========================================================

If the current application already stores service information inside:

mentorProfiles

or another profile object:

DO NOT simply delete it.

First:

1. Identify existing embedded service fields.
2. Map them to mentorServices.
3. Create migration.
4. Validate migrated records.
5. Preserve existing behavior.
6. Update consumers.
7. Remove deprecated fields only after migration is safe.

Document:

old field
→
new field

Example:

mentorProfiles.serviceName
→
mentorServices.title

mentorProfiles.serviceDescription
→
mentorServices.description

mentorProfiles.servicePrice
→
mentorServices.price

Do not lose existing data.

========================================================
PART 74 — SCHEMA CHANGE LOG
========================================================

Update:

docs/architecture/schema-change-log.md

Add:

Phase 3
mentorServices
relationship to Expert
indexes
constraints
publication state
future transactional references

========================================================
PART 75 — DATA OWNERSHIP MATRIX
========================================================

Create:

docs/architecture/expert-services-data-ownership.md

Document:

| Data | Owner | Read by Page | Written by |
|---|---|---:|---|
| Expert name | ExpertProfile | Yes | Profile |
| Expert bio | ExpertProfile | Yes | Profile |
| Service title | mentorServices | Yes | Service |
| Service description | mentorServices | Yes | Service |
| Service price | mentorServices | Yes | Service |
| Service duration | mentorServices | Yes | Service |
| Service status | mentorServices | Yes | Service |
| Service order | mentorServices | Yes | Service |
| Services section visibility | ExpertPageSection | Yes | Page Builder |
| Services section position | ExpertPageSection | Yes | Page Builder |

Adjust to the final implementation.

========================================================
PART 76 — API DOCUMENTATION
========================================================

Document all new APIs.

For each:

Method
Route
Authentication
Authorization
Request
Response
Validation
Errors
Side effects

Also document:

Public API
Private Expert API

Do not expose private fields through public endpoints.

========================================================
PART 77 — UNIT TESTS
========================================================

Test:

Create service
Read service
Update service
Publish service
Unpublish service
Archive service
List Expert services
List public services

Validation:

Invalid title
Invalid price
Invalid currency
Invalid duration
Invalid type
Invalid slug

Authorization:

Expert A cannot edit Expert B
Expert A cannot publish Expert B
Student cannot create service

========================================================
PART 78 — INTEGRATION TESTS
========================================================

Test:

Expert
 ↓
Create service
 ↓
Save draft
 ↓
Edit
 ↓
Publish
 ↓
Public API
 ↓
Expert Page
 ↓
Service appears

Then:

Unpublish
 ↓
Service disappears

Then:

Archive
 ↓
Service remains in private history
 ↓
Service disappears publicly

========================================================
PART 79 — PROFILE SEPARATION TEST
========================================================

This test is mandatory.

Verify that:

mentorProfiles

contains ONLY profile-level information.

Verify that:

mentorServices

contains service information.

Attempt to create a service.

Confirm:

mentorProfiles is not modified with service fields.

Then modify:

mentorProfiles.bio

Confirm:

mentorServices remains unchanged.

Then modify:

mentorServices.price

Confirm:

mentorProfiles remains unchanged.

This proves proper domain separation.

========================================================
PART 80 — PUBLIC PAGE TEST
========================================================

Create:

Service A = Published
Service B = Draft
Service C = Archived

Expert Page:

SERVICES section = Visible

Public page must show:

Service A

Must NOT show:

Service B
Service C

Then hide:

SERVICES section

Public page must show:

No Services section.

Then publish Service B.

Public page should now show:

Service A
Service B

without changing the Page Builder configuration.

========================================================
PART 81 — SERVICE ORDER TEST
========================================================

Create:

Service A
Service B
Service C

Set:

A = order 1
B = order 2
C = order 3

Change:

C = order 1
A = order 2
B = order 3

Verify public page renders:

C
A
B

Service ordering must be independent from Expert Page section ordering.

========================================================
PART 82 — PUBLISHING TEST
========================================================

Create draft service.

Verify:

Expert dashboard:
DRAFT

Public page:
not visible

Preview:
visible to Expert

Publish.

Verify:

Expert dashboard:
PUBLISHED

Public page:
visible

Unpublish.

Verify:

Expert dashboard:
UNPUBLISHED

Public page:
not visible

Archive.

Verify:

Expert dashboard:
ARCHIVED

Public page:
not visible

========================================================
PART 83 — FUTURE TRANSACTION SAFETY TEST
========================================================

Do not implement a full payment flow unless already required.

But verify that:

mentorService.id

is stable.

Changing:

title
description
price
duration

must NOT create a new service ID.

This allows future bookings/orders to reference the service safely.

========================================================
PART 84 — PERFORMANCE TEST
========================================================

Create an Expert with:

20 services.

Load public Expert Page.

Verify:

No N+1 API request pattern.

Do not make:

20 separate service requests.

Use efficient data loading.

========================================================
PART 85 — UX REQUIREMENTS
========================================================

The Expert should always understand:

What services exist?
Which are drafts?
Which are live?
What needs completion?
What will students see?
What happens after publishing?

Use clear states:

Draft
Published
Unpublished
Archived

Use explicit actions:

Edit
Preview
Publish
Unpublish
Archive

Avoid ambiguous labels.

========================================================
PART 86 — NO FAKE FUNCTIONALITY
========================================================

Do not create:

fake booking
fake checkout
fake payment
fake calendar
fake availability
fake reviews
fake analytics

If a CTA depends on Phase 4/5 functionality:

either:

hide it

or:

clearly indicate that functionality is not yet available.

Do not create broken flows.

========================================================
PART 87 — DATABASE SCHEMA CHECKPOINT
========================================================

Before declaring implementation complete, output:

FINAL SCHEMA

Expert
 ↓
mentorServices[]

mentorServices:

id
expertId
title
slug
description
serviceType
price
currency
durationMinutes
deliveryMode
status
displayOrder
createdAt
updatedAt

IMPORTANT:

This is only a conceptual baseline.

You MUST modify it according to the actual repository,
existing schema, and product requirements.

Do not blindly implement fields that are not necessary.

========================================================
PART 88 — RELATIONSHIP DIAGRAM
========================================================

Document:

User
 │
 ▼
Expert
 │
 ├── ExpertProfile
 │
 ├── ExpertExperience[]
 │
 ├── ExpertEducation[]
 │
 ├── ExpertSkill[]
 │
 ├── ExpertPage
 │      │
 │      └── ExpertPageSection[]
 │                 │
 │                 └── SERVICES
 │
 └── mentorServices[]
         │
         ├── Service A
         ├── Service B
         └── Service C

The Services section references the service domain.

It does not own the services.

========================================================
PART 89 — FINAL ARCHITECTURE RULE

The following rules are NON-NEGOTIABLE:

RULE 1:

mentorProfiles = WHO THE EXPERT IS

RULE 2:

mentorServices = WHAT THE EXPERT OFFERS

RULE 3:

ExpertPage = HOW THE EXPERT IS PRESENTED

RULE 4:

ExpertPageSection = WHERE/WHETHER SERVICES ARE DISPLAYED

RULE 5:

Orders = WHAT WAS PURCHASED

RULE 6:

Bookings = WHEN THE SERVICE IS FULFILLED

RULE 7:

Payments = HOW THE PURCHASE WAS PAID

Do not merge these domains.

========================================================
PART 90 — FINAL IMPLEMENTATION REPORT

Create:

docs/phases/phase-3-services.md

Include:

Phase 3 — Expert Services
Objective
Existing functionality reused
Existing schema inspected
New entities
Modified entities
Database migration
API routes
Frontend routes
Service lifecycle
Service schema
Pricing model
Duration model
Delivery model
Publication model
Expert Page integration
Security
Authorization
Public API
Future Calendar integration
Future Booking integration
Future Payment integration
Future Reviews integration
Tests
E2E tests
Known limitations
Deferred functionality
========================================================
PART 91 — FINAL VERIFICATION

At the end answer:

Can an Expert:

Open Services?
Create a service?
Configure service information?
Configure pricing?
Configure duration?
Save as draft?
Preview?
Publish?
Unpublish?
Archive?
Edit an existing service?
Have multiple services?
Reorder services?
See published services on the Expert Page?
Keep draft services private?
Keep archived services private?
Do all of this without modifying mentorProfiles with service data?
Maintain stable service IDs for future bookings/payments?
Prevent another Expert from modifying their services?
Preserve existing payment/booking architecture?

Answer:

YES — VERIFIED

or

PARTIAL

or

NO

or

BLOCKED

Do not answer VERIFIED unless the actual flows have been tested.

========================================================
MOST IMPORTANT FINAL CHECK

Prove this architecture:

                EXPERT
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
ExpertProfile   ExpertPage   mentorServices[]
                   │                │
                   │                │
            Page Sections           │
                   │                │
                   ▼                ▼
                SERVICES ───────► Service Cards
                                    │
                                    ▼
                              Future Booking
                                    │
                                    ▼
                                 Order
                                    │
                                    ▼
                                 Payment

The service system must remain independent from:

mentorProfiles

and independent from:

ExpertPage

The Expert Page consumes services.

It does not own them.

mentorServices is the canonical source of truth for what the Expert
offers.
One architectural point I'd make especially strict

For your project, I would keep these four concepts completely separate:

┌─────────────────────────────────────────────────┐
│                 ExpertProfile                   │
│                                                 │
│ Who is this person?                             │
│ Name, bio, headline, experience, education...  │
└──────────────────────┬──────────────────────────┘
                       │
                       │
┌──────────────────────▼──────────────────────────┐
│                 ExpertPage                     │
│                                                 │
│ How should this person be presented?            │
│ Theme, cover, sections, ordering, visibility... │
└──────────────────────┬──────────────────────────┘
                       │
                       │ SERVICES section
                       ▼
┌─────────────────────────────────────────────────┐
│                mentorServices[]                 │
│                                                 │
│ What does this Expert actually offer?           │
│ Title, description, price, duration, type...    │
└──────────────────────┬──────────────────────────┘
                       │
                       │ future
                       ▼
             ┌────────────────────┐
             │      Booking       │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │       Order        │
             └─────────┬──────────┘
                       │
                       ▼
             ┌────────────────────┐
             │      Payment       │
             └────────────────────┘