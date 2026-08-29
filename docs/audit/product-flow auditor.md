You are a senior product engineer, QA engineer, and technical auditor.

I want you to perform a COMPLETE END-TO-END FLOW AUDIT of the current Embark application.

Do NOT just review the code and tell me what appears to exist.

You must actually inspect the repository, routes, components, API integrations, database interactions, authentication/authorization, state management, and wherever possible run/test the application and APIs to determine whether each flow is REALLY implemented and working.

Your job is to answer:

1. Does this flow exist?
2. Is every step implemented?
3. Are the frontend and backend correctly connected?
4. Does the API actually support the required operation?
5. Does the flow work end-to-end?
6. Are there missing pages/screens?
7. Are there broken API calls?
8. Are there incorrect assumptions between frontend and backend?
9. Are permissions/RBAC correctly enforced?
10. Are loading, empty, error and success states handled?
11. Are database/state changes actually persisted?
12. Can a real user complete the flow without manually bypassing anything?

==================================================
PROJECT CONTEXT
==================================================

The product has two primary user experiences:

A. EXPERT
B. STUDENT

There are also administrative/operational capabilities.

The main goal is an expert marketplace where experts can create and customize their page, create services/packages, manage availability and bookings, interact with students, and manage their earnings.

Students should be able to discover experts, view their profiles/services, book them, interact with them, and access other Embark features.

==================================================
FLOW 1 — EXPERT ONBOARDING
==================================================

Expected flow:

Expert
  ↓
Sign up / Login
  ↓
Expert onboarding
  ↓
Collect expert details
  ↓
Select services
  ↓
Optional upload of additional information/assets
  ↓
WhatsApp / Email verification
  ↓
Expert dashboard
  ↓
Complete remaining profile/page information
  ↓
Expert can create packages
  ↓
Expert can manage bookings
  ↓
Expert can manage students/customers
  ↓
Expert can manage other advanced settings

Audit every step.

Specifically verify:

- Can a new expert create an account?
- Does the system know that the user is an expert?
- Does expert onboarding start correctly?
- Are expert details saved?
- Are professional details saved?
- Are experience/education details supported?
- Can the expert select services?
- Can the expert create/configure services?
- Can the expert upload supporting documents/assets if required?
- Is WhatsApp verification implemented?
- Is email verification implemented?
- Is verification status persisted?
- Can the expert enter the dashboard after onboarding?
- Does the dashboard know what onboarding steps are incomplete?
- Can the expert return later and continue onboarding?
- Is onboarding resumable?
- Is there a completion state?
- What happens if the expert skips optional information?
- What happens if verification fails?
- What happens if the API fails?
- What happens if the expert refreshes halfway through onboarding?

Do not assume something is implemented just because there is a component for it.

==================================================
FLOW 2 — EXPERT PROFILE / PAGE
==================================================

The expert should have a proper public-facing page.

Expected structure:

Expert
  ↓
Profile
  ↓
Experience
  ↓
Education
  ↓
Expertise
  ↓
Services
  ↓
Packages
  ↓
Availability
  ↓
Reviews
  ↓
Page customization

Verify that:

- A public expert page exists.
- The page can be accessed by slug/identifier.
- Expert profile data is loaded from the backend.
- Experience is displayed.
- Education is displayed.
- Expertise is displayed.
- Services are displayed.
- Packages are displayed.
- Availability can be displayed.
- Reviews are displayed.
- Verification status is displayed where appropriate.
- Social links work.
- The page works for an expert with incomplete data.
- The page works for an expert with multiple services.
- The page works for an expert with packages.
- The page works when there are no reviews.
- The page works when there is no availability.

==================================================
FLOW 3 — EXPERT PAGE CUSTOMIZATION
==================================================

Expected flow:

Expert Dashboard
  ↓
My Page / Page Builder
  ↓
Customize page
  ↓
Cover image
  ↓
Accent color
  ↓
Section visibility
  ↓
Section ordering
  ↓
Meeting settings
  ↓
Calendar settings
  ↓
Preview
  ↓
Save
  ↓
Public expert page reflects changes

Verify:

- Page builder exists.
- Settings are loaded from backend.
- Settings can be changed.
- Settings are persisted.
- Refreshing the page retains changes.
- Public page uses saved settings.
- Section ordering works.
- Section visibility works.
- Cover image works.
- Accent color works.
- Meeting settings work if supported.
- Calendar settings work if supported.
- Preview accurately reflects the public page.
- Unauthorized users cannot modify another expert's page.

If any feature exists only visually but does not persist, mark it as:

IMPLEMENTED UI ONLY — NOT FUNCTIONAL

==================================================
FLOW 4 — EXPERT SERVICES
==================================================

Expected:

Expert Dashboard
  ↓
Services
  ↓
Create service
  ↓
Configure:
  - Name
  - Description
  - Category
  - Outcomes
  - Duration
  - Price
  - Currency
  - Buffer
  - Cancellation policy
  - Intake questions
  - Meeting method
  - Response SLA where applicable
  ↓
Save
  ↓
Service appears on expert page
  ↓
Student can purchase/book service

Verify complete CRUD:

- Create
- Read
- Update
- Delete
- Publish/activate/deactivate if supported

Verify that the public expert page receives the correct service data.

Verify that the service can actually be used in a booking.

==================================================
FLOW 5 — EXPERT PACKAGES
==================================================

Expected:

Expert
  ↓
Packages
  ↓
Create package
  ↓
Select services
  ↓
Set quantity per service
  ↓
Set price
  ↓
Set validity
  ↓
Save
  ↓
Package appears publicly
  ↓
Student purchases package
  ↓
Package credit is created
  ↓
Student can use package services
  ↓
Expert sees package-related activity

Verify:

- Package CRUD exists.
- Services can be added to packages.
- Quantity works.
- Price works.
- Validity works.
- Package is persisted.
- Package appears on public expert page.
- Student can purchase package.
- Payment flow works.
- Package credit is created after successful payment.
- Package credit can actually be consumed.
- Expired package behavior works.
- Invalid package/service combinations are rejected.

==================================================
FLOW 6 — EXPERT AVAILABILITY / CALENDAR
==================================================

Expected:

Expert
  ↓
Calendar
  ↓
Set weekly availability
  ↓
Set blocked dates
  ↓
Existing bookings occupy slots
  ↓
Availability API generates available slots
  ↓
Student sees available slots

Verify:

- Weekly availability CRUD works.
- Individual days can be enabled/disabled.
- Start/end times are persisted.
- Blocked dates work.
- Existing bookings are excluded from available slots.
- Service duration is respected.
- Buffer time is respected if implemented.
- Timezone handling works.
- Available slots API works.
- Student sees the same slots the backend considers available.
- Double booking is prevented.
- Past slots cannot be booked.
- Blocked dates cannot be booked.

IMPORTANT:
Do not only inspect the calendar UI.
Verify the actual backend availability calculation.

==================================================
FLOW 7 — STUDENT ONBOARDING
==================================================

Expected:

New Student
  ↓
Sign up
  ↓
Enter resume/profile details
  ↓
Verify details
  ↓
Complete profile
  ↓
Student can enter application

Verify:

- Student registration works.
- Student persona/role is assigned correctly.
- Student profile is created.
- Resume upload works if implemented.
- Profile details persist.
- Required fields are enforced.
- Student can edit profile later.
- Incomplete profiles are handled correctly.
- Verification works if required.
- Student can reach the main application after completion.

==================================================
FLOW 8 — STUDENT EXPLORE / DISCOVER
==================================================

Expected:

Student
  ↓
Explore
  ↓
Detailed expert list
  ↓
Mentors / Experts
  ↓
Select expert
  ↓
View services
  ↓
Back
  ↓
Lectures / other Embark experiences

Verify:

- Explore page exists.
- Expert search works.
- Expert cards contain correct information.
- Search/filtering works.
- Clicking an expert opens the correct expert page.
- Back navigation works.
- Services are visible.
- Students can identify what each service does.
- Loading states exist.
- Empty states exist.
- API errors are handled.

Also verify whether "Lectures" or related experiences actually exist in the current implementation.

If they do not exist, mark them as NOT IMPLEMENTED rather than assuming they are planned functionality.

==================================================
FLOW 9 — STUDENT → EXPERT SERVICE → BOOKING
==================================================

This is one of the most important flows.

Expected:

Student
  ↓
Explore Experts
  ↓
Expert Profile
  ↓
Select Service
  ↓
View service details
  ↓
Select date
  ↓
Select available slot
  ↓
Answer intake questions
  ↓
Create booking
  ↓
Create order/payment where required
  ↓
Payment
  ↓
Payment verification
  ↓
Booking confirmed
  ↓
Expert sees booking
  ↓
Student sees booking
  ↓
Session happens
  ↓
Booking completed
  ↓
Student can review expert

Audit this as a REAL end-to-end transaction.

Verify:

- Correct expert is selected.
- Correct service is selected.
- Correct price is used.
- Availability is fetched from backend.
- Selected slot is actually available.
- Intake questions are submitted.
- Booking is created.
- Booking belongs to correct student.
- Booking belongs to correct expert.
- Payment/order is correctly associated.
- Payment verification changes the correct state.
- Booking becomes confirmed only when appropriate.
- Expert can see booking.
- Student can see booking.
- Cancellation works where supported.
- Rescheduling works where supported.
- Completion works.
- Review eligibility works.

IMPORTANT:
Trace the entire data flow from frontend → API → database → API → frontend.

==================================================
FLOW 10 — PAYMENT
==================================================

Audit every supported payment flow.

Expected examples:

PLAYBOOK
MENTORSHIP
BOOKING
PRIORITY_DM
PACKAGE
HACKATHON_FEE

Verify:

- Order creation works.
- Correct amount is calculated server-side.
- Correct product/type is attached.
- Razorpay checkout integration works if configured.
- Payment response is handled.
- Payment verification works.
- Invalid payment cannot mark an order as successful.
- Duplicate verification is handled safely.
- Successful booking payment confirms booking where appropriate.
- Successful package payment creates package credit.
- Wallet credit happens correctly where applicable.

IMPORTANT:

There is a documented generic payment endpoint that may not be implemented.

Do NOT create frontend dependencies on APIs that are currently 501/not implemented.

Clearly report such cases.

==================================================
FLOW 11 — PRIORITY DM
==================================================

Expected:

Student
  ↓
Expert page
  ↓
Priority DM
  ↓
Write question
  ↓
Add context
  ↓
Optional attachments
  ↓
Submit
  ↓
Payment if required
  ↓
Expert receives request
  ↓
Expert responds
  ↓
Student sees response
  ↓
Review

Verify the entire lifecycle.

==================================================
FLOW 12 — EXPERT MANAGES STUDENTS
==================================================

Expected:

Expert Dashboard
  ↓
Customers / Students
  ↓
Select student
  ↓
View relevant history
  ↓
Private notes
  ↓
Add/edit notes

Verify:

- Student/customer list exists.
- Expert can only access authorized customers.
- Student information is correct.
- Booking history is available if supported.
- Private notes can be created.
- Private notes can be edited/deleted if supported.
- Notes are not exposed to students.
- Notes persist after refresh.

==================================================
FLOW 13 — EXPERT BOOKINGS
==================================================

Expected:

Expert Dashboard
  ↓
Bookings
  ↓
Pending
  ↓
Upcoming
  ↓
Today
  ↓
Completed
  ↓
Cancelled
  ↓
Reschedule requests

Verify every status/filter.

For each booking verify:

- Student
- Service
- Date
- Time
- Status
- Intake responses
- Payment information where available
- Meeting information where available

Verify actions such as:

- Confirm
- Complete
- Cancel
- Reschedule

Only report an action as functional if the backend actually processes it.

==================================================
FLOW 14 — REVIEWS
==================================================

Expected:

Completed interaction
  ↓
Student leaves rating
  ↓
Review submitted
  ↓
Review appears on expert profile
  ↓
Expert can feature/unfeature where supported

Verify:

- Eligibility rules.
- Rating validation.
- Review submission.
- Persistence.
- Expert profile display.
- Feature/unfeature functionality.
- Duplicate review prevention if applicable.

==================================================
FLOW 15 — EXPERT WALLET / EARNINGS
==================================================

Expected:

Student payment
  ↓
Payment verification
  ↓
Expert wallet credited
  ↓
Expert sees balance
  ↓
Transaction appears
  ↓
Expert requests payout
  ↓
Payout processed

Verify:

- Wallet balance.
- Credit transactions.
- Debit transactions.
- Transaction history.
- Booking revenue.
- Package revenue.
- Priority DM revenue.
- Payout creation.
- Payout status.
- BANK payout if supported.
- UPI payout if supported.
- Authorization.
- Amount correctness.

Do not assume money movement works because a wallet page exists.

Trace the backend transaction logic.

==================================================
FLOW 16 — EXPERT ANALYTICS
==================================================

Verify:

- Analytics dashboard exists.
- Summary metrics load.
- Funnel metrics load.
- Revenue metrics load.
- Revenue-by-type works.
- Daily revenue works.
- Service-level analytics work.
- Analytics events are actually emitted.
- Profile view events work.
- Service view events work.
- Checkout start events work.

Check whether analytics are:
A. Real backend data
B. Mock/static data
C. Partially implemented

==================================================
FLOW 17 — EXPERT VERIFICATION
==================================================

Expected:

Expert
  ↓
Submit verification
  ↓
Pending
  ↓
Admin reviews
  ↓
Approve / Reject
  ↓
Expert status updated
  ↓
Public profile reflects verification

Verify both sides:

EXPERT:
- Submit verification
- View status
- View result

ADMIN:
- View applications
- Open application
- Review
- Approve
- Reject

Verify state synchronization.

==================================================
FLOW 18 — NOTIFICATIONS
==================================================

Verify:

- Notification list exists.
- Notifications are created for supported events.
- Unread state works.
- Mark individual as read works.
- Mark all as read works.
- Correct destination/action works if supported.

Do not invent notification events that are not implemented.

==================================================
FLOW 19 — PLAYBOOKS
==================================================

Verify:

- Access check.
- Playbook listing.
- Playbook access.
- Progress loading.
- Progress saving.
- Checked items persistence.
- Unauthorized access prevention.
- Purchase → access flow if supported.

==================================================
FLOW 20 — HACKATHONS / COMPETITIONS
==================================================

Verify current implementation rather than assuming the feature exists.

For hackathons inspect:

- Listing
- Details
- Registration
- Teams
- Invitations
- Joining
- Leaving
- Removing members
- Submission
- Evaluation
- Results

For competitions inspect the legacy competition implementation separately.

Clearly distinguish:

V1 HACKATHON SYSTEM

from

LEGACY COMPETITION SYSTEM

Do not merge them conceptually unless the code actually does.

==================================================
FLOW 21 — ADMIN
==================================================

Audit admin capabilities.

Verify:

- Admin authentication
- RBAC
- Expert management
- Expert suspension where supported
- Expert verification
- Booking/mentorship management
- Orders
- Payments
- Payouts
- Reviews
- Hackathons
- Competitions
- Speaker applications
- Lecture requests

IMPORTANT:
Test authorization, not just visibility.

A normal student/expert must NOT be able to call admin APIs successfully.

==================================================
FLOW 22 — SECURITY / RBAC AUDIT
==================================================

For every important endpoint verify:

- Authentication required?
- Correct role required?
- Resource ownership checked?
- Can Expert A modify Expert B's services?
- Can Expert A view Expert B's private notes?
- Can Student A access Student B's booking?
- Can Student modify an expert service?
- Can Student access admin endpoints?
- Can Expert access admin endpoints?
- Can unauthenticated users create bookings?
- Can users manipulate IDs to access another user's resource?

Look for IDOR/insecure direct object reference issues.

==================================================
FLOW 23 — ERROR / EDGE CASE AUDIT
==================================================

For every major flow test:

- Empty state
- Loading state
- API failure
- Invalid input
- Unauthorized request
- Expired session
- Duplicate request
- Double submission
- Refresh during process
- Browser back during process
- Network interruption
- Missing optional data
- Missing profile image
- No services
- No packages
- No availability
- No reviews
- Cancelled booking
- Completed booking
- Expired package
- Invalid payment

==================================================
FLOW 24 — API ↔ FRONTEND CONSISTENCY
==================================================

Create a mapping of:

Frontend page/component
        ↓
API endpoint
        ↓
HTTP method
        ↓
Request payload
        ↓
Response shape
        ↓
Database mutation
        ↓
UI state update

Find mismatches such as:

- Frontend sends incorrect field names.
- Backend expects fields frontend does not send.
- Frontend expects fields backend does not return.
- Wrong HTTP method.
- Wrong route.
- Wrong ID.
- Incorrect enum.
- Incorrect status.
- Missing authentication header.
- Incorrect role.
- API returns success but frontend does not update.
- Frontend displays mock data instead of API data.

==================================================
TESTING REQUIREMENTS
==================================================

Do not limit yourself to static code inspection.

If the project can be run:

1. Start the application.
2. Inspect console errors.
3. Inspect network/API errors.
4. Test the important flows manually or through available automated tooling.
5. Test API endpoints directly where possible.
6. Inspect database changes where appropriate.
7. Test authenticated and unauthenticated behavior.
8. Test Student and Expert separately.

If credentials/environment variables are required and unavailable, do not pretend the flow works.

Mark it:

BLOCKED — ENVIRONMENT / CREDENTIAL REQUIRED

and explain exactly what is missing.

==================================================
OUTPUT FORMAT
==================================================

Your final report MUST NOT be a generic summary.

Create the following sections.

# 1. EXECUTIVE SUMMARY

Give:

- Total flows audited
- Fully working
- Partially working
- Not implemented
- Broken
- Blocked by environment

Example:

| Status | Count |
|---|---:|
| Fully Working | X |
| Partially Working | X |
| Broken | X |
| Not Implemented | X |
| Blocked | X |

# 2. FLOW SCORECARD

Use:

| Flow | Exists | Backend | Frontend | E2E Working | Status | Severity |
|---|---|---|---|---|---|---|

Status must be one of:

✅ WORKING
⚠️ PARTIAL
❌ BROKEN
🚫 NOT IMPLEMENTED
⏸ BLOCKED

Do NOT mark something WORKING based only on the existence of code.

# 3. STUDENT FLOW REPORT

For each student flow:

Expected:
A → B → C → D

Actual:
A → B → C → [broken]

Missing:
...

Broken:
...

API:
...

Database:
...

Result:
...

# 4. EXPERT FLOW REPORT

Do the same for every expert flow.

# 5. ADMIN FLOW REPORT

Do the same for admin flows.

# 6. API AUDIT

Create:

| Endpoint | Used By | Frontend Connected | Backend Exists | Auth | Tested | Result |
|---|---|---|---|---|---|---|

Include important API mismatches.

# 7. DATABASE / STATE AUDIT

Identify whether each important operation actually persists.

Examples:

- Expert profile → persisted?
- Service → persisted?
- Package → persisted?
- Availability → persisted?
- Booking → persisted?
- Payment → persisted?
- Wallet → persisted?
- Review → persisted?
- Notes → persisted?

# 8. RBAC / SECURITY AUDIT

List every authorization issue.

Use severity:

CRITICAL
HIGH
MEDIUM
LOW

# 9. BROKEN FLOWS

For every broken flow provide:

### Problem
### Expected behavior
### Actual behavior
### Root cause
### Files involved
### API involved
### Recommended fix

# 10. MISSING FLOWS

List features implied by the product requirements that currently do not exist.

Do NOT recommend unnecessary new features.

Only identify missing functionality required for the defined flows.

# 11. PARTIAL FLOWS

For every partial flow:

Implemented:
- ...

Missing:
- ...

Needs:
- ...

# 12. MOCK / FAKE / PLACEHOLDER DATA

Identify every place where:

- Mock data
- Hardcoded data
- Fake API responses
- Placeholder buttons
- TODOs
- Unimplemented handlers
- Simulated payment
- Simulated availability
- Static analytics

are being used.

This is extremely important.

# 13. PRIORITY FIX LIST

Create:

P0 — Blocks core product
P1 — Breaks major user flow
P2 — Important but non-blocking
P3 — Polish / UX

For every issue provide:

Issue
Impact
Root cause
Recommended fix
Files
API
Priority

# 14. FINAL VERDICT

Answer these questions explicitly:

1. Can a NEW EXPERT sign up and become operational?
2. Can an EXPERT create and customize their public page?
3. Can an EXPERT create SERVICES?
4. Can an EXPERT create PACKAGES?
5. Can an EXPERT configure AVAILABILITY?
6. Can a STUDENT discover an EXPERT?
7. Can a STUDENT view an EXPERT'S services?
8. Can a STUDENT select a real availability slot?
9. Can a STUDENT book a service?
10. Can the STUDENT pay?
11. Does payment verification actually work?
12. Does the EXPERT receive the booking?
13. Can the EXPERT manage the student?
14. Can the EXPERT complete the session?
15. Can the STUDENT review the expert?
16. Does the EXPERT receive wallet credit?
17. Can the EXPERT request payout?
18. Does the ADMIN workflow work?
19. Are RBAC boundaries secure?
20. Is the complete marketplace flow production-ready?

For each answer use:

YES — VERIFIED
PARTIAL
NO
BLOCKED

and explain why.

==================================================
IMPORTANT RULES
==================================================

RULE 1:
Never claim a feature works simply because the UI exists.

RULE 2:
Never claim an API works simply because the route exists.

RULE 3:
Trace important operations end-to-end.

RULE 4:
Distinguish:
- UI exists
- API exists
- API connected
- Data persists
- End-to-end flow works

These are NOT the same thing.

RULE 5:
Do not silently modify the implementation while auditing it.

First audit and report.

RULE 6:
Do not invent missing APIs or functionality.

If something is absent, say:

NOT IMPLEMENTED

RULE 7:
If something is implemented but broken, say:

BROKEN

and identify the root cause.

RULE 8:
If something cannot be tested because the environment is missing, say:

BLOCKED

Do not call it working.

RULE 9:
Use the actual API contracts and existing code as the source of truth.

RULE 10:
Pay special attention to the core marketplace path:

Student
→ Explore
→ Expert
→ Service
→ Availability
→ Slot
→ Booking
→ Payment
→ Verification
→ Confirmation
→ Session
→ Completion
→ Review

and the expert path:

Expert
→ Onboarding
→ Profile
→ Services
→ Packages
→ Availability
→ Page customization
→ Bookings
→ Students
→ Reviews
→ Wallet
→ Payouts

==================================================
START THE AUDIT NOW
==================================================

First inspect the repository structure.

Then identify:

1. Frontend framework
2. Backend/API architecture
3. Database
4. Authentication
5. RBAC
6. API route structure
7. Student routes/pages
8. Expert routes/pages
9. Admin routes/pages
10. Payment integration
11. Booking implementation
12. Availability implementation

Then perform the complete audit above.

DO NOT stop after identifying the architecture.

Continue until you have audited the actual flows.

At the end, give me a clear answer:

"Can the current application successfully execute the complete Student → Expert → Booking → Payment → Session flow and the Expert onboarding → management → earnings flow?"

Support the answer with evidence from the code, APIs, tests, and runtime behavior.