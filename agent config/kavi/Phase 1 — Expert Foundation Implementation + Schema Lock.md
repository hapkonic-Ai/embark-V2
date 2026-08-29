You are working on the Embark application.

Act as a senior product engineer, backend architect, frontend engineer, database architect, and QA engineer.

Your task is to IMPLEMENT PHASE 1 — EXPERT FOUNDATION.

This phase is the foundation for all future Expert marketplace functionality.

DO NOT jump directly into coding.

First inspect the existing repository, database schema, API contracts, authentication system, existing mentor/expert implementation, file upload system, resume parsing capabilities, and current onboarding/profile/dashboard implementation.

Then produce a schema and architecture plan.

Only after the schema/architecture is internally consistent should you implement the phase.

========================================================
PHASE 1 OBJECTIVE
========================================================

Build this complete Expert lifecycle:

Expert Registration
        ↓
Expert Onboarding
        ↓
Resume Upload / Resume Parsing
        ↓
Review Extracted Information
        ↓
Edit / Verify Information
        ↓
Complete Missing Information
        ↓
Expert Profile
        ↓
Profile Completion
        ↓
Expert Verification
        ↓
Expert Dashboard
        ↓
Profile Editor
        ↓
Ready for Phase 2

The final result should allow a real Expert to go from:

"new account"

to:

"verified, profile-complete Expert with a usable public profile and dashboard."

========================================================
IMPORTANT PRODUCT PRINCIPLE

The current application already has an existing mentor system.

Do NOT blindly replace the existing mentor architecture.

First understand:

mentorProfiles
mentorships
mockSessions
existing mentor dashboard
existing mentor profile
existing authentication
existing candidate/student model
existing admin model
existing API structure

Determine what can be reused.

The new system should gradually evolve:

CURRENT:

User
↓
Mentor
↓
mentorProfiles

TARGET:

User
↓
Expert
↓
Expert Profile
↓
Expert Services
↓
Expert Availability
↓
Expert Bookings
↓
Expert Earnings

Phase 1 only needs to build the Expert foundation.

Do NOT implement Phase 2+ functionality unless it is required for Phase 1.

========================================================
PART 1 — REPOSITORY AUDIT

Before making changes, inspect the entire repository.

Identify:

Frontend framework
Backend framework
Database technology
ORM
Authentication mechanism
Role system
Existing user table/model
Existing mentor/expert table/model
Existing profile table/model
Existing onboarding state
Existing verification state
Existing file upload system
Existing resume upload capability
Existing resume parsing capability
Existing storage provider
Existing admin system
Existing API routes
Existing dashboard routes
Existing profile editor
Existing validation schemas
Existing migrations
Existing tests

Do not assume anything.

Use the repository as the source of truth.

========================================================
PART 2 — CURRENT SCHEMA AUDIT

Before modifying the database, create a complete inventory of the existing entities.

At minimum inspect:

users
mentorProfiles
mentorships
mockSessions
playbooks
events
submissions
orders/payments if present
files/assets if present
admin-related entities

For each entity document:

Entity:
Table:
Purpose:
Primary key:
Foreign keys:
Important fields:
Enums:
Indexes:
Unique constraints:
Nullable fields:
Relations:
Used by APIs:
Used by frontend:
Potential future usage:

Also identify:

duplicated information
fields that should be normalized
fields that should remain denormalized
fields that are currently doing multiple jobs
fields that will become problematic when Services/Bookings/Packages are introduced later
fields that should NOT be deleted yet because existing features depend on them
========================================================
PART 3 — FINAL PHASE 1 ENTITY MODEL

Before implementation, design the Phase 1 canonical entities.

The initial target should conceptually contain:

User
Expert
ExpertProfile
ExpertOnboarding
ExpertResume
ExpertVerification
ExpertProfileSection / ProfileCompletion
FileAsset

You may reuse existing tables where appropriate.

DO NOT create duplicate tables simply because the existing naming uses "mentor".

For example:

If mentorProfiles can safely become the canonical Expert profile entity, determine whether:

A. Rename it
B. Keep it and treat it as ExpertProfile
C. Create a new Expert entity and migrate gradually

Choose the safest option based on the existing codebase.

Explain the decision.

========================================================
PART 4 — SCHEMA CHECKPOINT

Before implementing the features, produce a schema proposal.

Use a table like:

Entity	Purpose	PK	Important Fields	Relations	Existing/New	Future Usage

Then provide the actual proposed schema.

At minimum reason about the following entities.

USER

Purpose:
Identity/authentication.

Potential fields:

id
email
phone
name
role
status
createdAt
updatedAt

Do not duplicate authentication information into ExpertProfile unless necessary.

EXPERT

Purpose:
Represents the Expert persona/account.

Potential fields:

id
userId
status
onboardingStatus
verificationStatus
profileCompletionPercent
createdAt
updatedAt

Potential statuses:

DRAFT
ONBOARDING
ACTIVE
SUSPENDED
DEACTIVATED

Potential verification states:

NOT_STARTED
PENDING
VERIFIED
REJECTED

Do not create unnecessary duplicate user fields.

EXPERT PROFILE

Purpose:
Professional/public-facing profile.

Potential fields:

id
expertId
displayName
headline
bio
profileImage
coverImage
location
country
timezone
yearsOfExperience
currentCompany
currentRole
website
linkedinUrl
githubUrl
portfolioUrl
otherSocialLinks
createdAt
updatedAt

Also consider:

professionalTitle
specializations
industries
skills
educationSummary
experienceSummary

But do not add fields blindly.

If experience and education should become normalized entities later, design the schema to support that.

EXPERT EXPERIENCE

Determine whether experience should be a separate entity.

Recommended conceptual structure:

id
expertId
company
role/title
employmentType
location
startDate
endDate
isCurrent
description
displayOrder
createdAt
updatedAt

This should support multiple experiences.

Do not store all experiences as one giant string if the product will later display them individually.

EXPERT EDUCATION

Determine whether education should be separate.

Potential:

id
expertId
institution
degree
fieldOfStudy
startDate
endDate
grade
description
displayOrder
createdAt
updatedAt

Support multiple education entries.

EXPERT SKILLS / EXPERTISE

Determine whether skills should be:

JSON
string array
normalized table
taxonomy/reference table

Choose based on current architecture and future requirements.

The system should eventually support:

skills
expertise
industries
specializations

Do not over-engineer a global taxonomy in Phase 1 unless the existing product already uses one.

EXPERT RESUME

This is VERY IMPORTANT.

The Expert should be able to upload a resume during onboarding.

Create a dedicated resume concept rather than storing resume data directly on ExpertProfile.

Potential structure:

ExpertResume

id
expertId
fileAssetId
status
parserStatus
parserProvider
rawText
parsedData
parsingError
uploadedAt
parsedAt
verifiedAt
createdAt
updatedAt

Possible status:

UPLOADED
PARSING
PARSED
REVIEW_REQUIRED
VERIFIED
FAILED

Important:

The resume itself is the SOURCE DOCUMENT.

The extracted profile data is a DERIVED representation.

Never treat automatically parsed data as user-confirmed truth.

FILE ASSET

If the project already has a file abstraction, reuse it.

Otherwise determine whether a generic file entity is required.

Potential:

id
ownerId
storageKey
url
fileName
mimeType
size
provider
status
createdAt
updatedAt

The resume should reference this entity rather than storing the complete file inside ExpertResume.

Avoid base64 storage in the database unless the existing infrastructure absolutely requires it.

EXPERT ONBOARDING

Create an explicit onboarding state.

Potential fields:

id
expertId
currentStep
status
startedAt
completedAt
lastCompletedStep
createdAt
updatedAt

Possible steps:

ACCOUNT
RESUME
RESUME_REVIEW
PROFILE
EXPERIENCE
EDUCATION
EXPERTISE
SERVICES
VERIFICATION
COMPLETE

IMPORTANT:

Phase 1 should not require implementing Services.

If SERVICES is part of a future phase, the onboarding architecture should be able to represent that step without pretending it exists.

Do not block Phase 1 unnecessarily.

EXPERT VERIFICATION

Create a proper verification concept.

Potential:

id
expertId
status
submittedAt
reviewedAt
reviewedBy
rejectionReason
verificationType
metadata
createdAt
updatedAt

Potential states:

NOT_STARTED
PENDING
APPROVED
REJECTED

If verification documents are needed, link them through FileAsset.

Do not hardcode a boolean like:

isVerified = true/false

if a proper lifecycle can be supported.

PROFILE COMPLETION

Do not necessarily create a physical table for this.

First determine whether completion can be calculated from canonical profile data.

The system should distinguish:

Required fields
Optional fields
Recommended fields

For example:

REQUIRED:

Name
Profile image
Headline
Bio
At least one experience
At least one expertise/skill
Location/timezone

RECOMMENDED:

LinkedIn
Portfolio
Education
Additional experience
Cover image

OPTIONAL:

Other links
Additional sections

The exact required fields should be based on the product requirements and existing implementation.

Do not invent arbitrary mandatory fields.

The backend should be the source of truth for completion.

Do not calculate completion only in React.

========================================================
PART 5 — RESUME UPLOAD FLOW

Implement this flow:

Expert Registration
↓
Expert Onboarding
↓
Upload Resume
↓
File Validation
↓
Store Resume
↓
Parse Resume
↓
Extract Candidate Information
↓
Show Review Screen
↓
Expert Verifies / Edits
↓
Save Confirmed Profile Data
↓
Continue Onboarding


The resume upload must support:

- PDF
- DOC/DOCX if supported by current infrastructure

Determine the actual supported formats from the repository.

Validate:

- MIME type
- file size
- upload success
- storage success
- parsing success

Do not trust the file extension alone.

========================================================
PART 6 — RESUME PARSING
========================================================

The resume parser should attempt to extract useful information.

At minimum look for:

Name
Email
Phone
LinkedIn
GitHub
Portfolio
Location
Headline
Current role
Current company
Professional summary
Skills
Expertise
Experience
Education
Certifications
Achievements

Potential extracted structure:

{
  "identity": {
    "name": "",
    "email": "",
    "phone": ""
  },

  "links": {
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },

  "summary": "",

  "experience": [],

  "education": [],

  "skills": [],

  "certifications": [],

  "achievements": []
}

Do NOT assume every resume has every field.

The parser must tolerate missing information.

========================================================
PART 7 — RESUME PARSING FALLBACK
========================================================

The system should support multiple parsing strategies.

Preferred:

Structured resume parser / existing resume parsing API.

Fallback:

Extract text from the resume and identify information using robust keyword/section detection.

Examples of keywords/sections:

NAME
EMAIL
PHONE
LINKEDIN
GITHUB
PORTFOLIO
SUMMARY
ABOUT
EXPERIENCE
WORK EXPERIENCE
EMPLOYMENT
EDUCATION
SKILLS
TECHNICAL SKILLS
CERTIFICATIONS
ACHIEVEMENTS

The fallback parser should not require a particular resume template.

However, if parsing confidence is low, do NOT invent data.

Return:

"Could not confidently extract this information."

and allow the Expert to manually enter it.

========================================================
PART 8 — RESUME TEMPLATE
========================================================

Provide an optional "Use our recommended resume template" experience.

The template should help experts create resumes that are easier to parse.

The recommended template should contain:

1. Name
2. Professional headline
3. Contact information
4. LinkedIn
5. Portfolio
6. Professional summary
7. Current role
8. Work experience
9. Education
10. Skills
11. Certifications
12. Achievements

Important:

The template is OPTIONAL.

Do NOT force experts to use the Embark resume template.

If they upload an arbitrary resume, the parser should still attempt extraction.

The onboarding UI should explain:

"Using a structured resume can improve profile extraction, but any standard resume is supported."

Do not promise perfect extraction.

========================================================
PART 9 — RESUME REVIEW UI
========================================================

After parsing, DO NOT automatically publish extracted information.

Show a review screen.

Example:

----------------------------------------
Review your profile
----------------------------------------

We found the following information from
your resume.

Name
[ John Doe ]

Headline
[ Product Manager ]

LinkedIn
[ linkedin.com/in/johndoe ]

Experience
[ Microsoft ]
Product Manager
2022 - Present

[ Google ]
Associate Product Manager
2020 - 2022

Education
[ IIT Delhi ]
MBA

Skills
Product Management
Strategy
Analytics

----------------------------------------

[ Edit ]
[ Confirm & Continue ]
----------------------------------------

Every extracted field should be editable.

The Expert is the final authority.

========================================================
PART 10 — FIELD CONFIDENCE
========================================================

If the parser supports confidence scores, preserve them internally.

Example:

{
  "field": "linkedinUrl",
  "value": "...",
  "confidence": 0.98
}

Do not expose technical confidence values unless useful to the UX.

Use confidence internally to identify fields that need review.

For example:

HIGH CONFIDENCE
→ pre-filled

LOW CONFIDENCE
→ highlight for verification

UNKNOWN
→ leave empty

Never fabricate information.

========================================================
PART 11 — RESUME → PROFILE MAPPING
========================================================

Define exactly how parsed data maps into the canonical schema.

Example:

Resume
 ↓
Name
 ↓
User.name / ExpertProfile.displayName

Resume
 ↓
LinkedIn
 ↓
ExpertProfile.linkedinUrl

Resume
 ↓
Experience[]
 ↓
ExpertExperience[]

Resume
 ↓
Education[]
 ↓
ExpertEducation[]

Resume
 ↓
Skills[]
 ↓
Expert skills/expertise

Resume
 ↓
Summary
 ↓
ExpertProfile.bio

Important:

Parsed data should be treated as a proposal.

The final profile contains USER-CONFIRMED data.

Do not overwrite manually entered data unexpectedly when the resume is re-uploaded.

========================================================
PART 12 — RE-UPLOAD BEHAVIOR
========================================================

Define behavior when an Expert uploads a second resume.

DO NOT automatically overwrite the existing profile.

Instead:

New Resume
 ↓
Parse
 ↓
Compare with Existing Profile
 ↓
Show Changes
 ↓
Expert chooses what to update
 ↓
Save selected changes

At minimum, make sure re-upload cannot silently destroy previously verified profile information.

========================================================
PART 13 — EXPERT ONBOARDING STATE MACHINE
========================================================

Implement an explicit state machine.

Example:

REGISTERED
   ↓
ONBOARDING
   ↓
RESUME_UPLOADED
   ↓
RESUME_PARSED
   ↓
PROFILE_REVIEW
   ↓
PROFILE_COMPLETION
   ↓
VERIFICATION_PENDING
   ↓
VERIFIED
   ↓
ACTIVE

But adapt the states to the actual product.

Important:

An Expert should be able to leave onboarding and come back.

Example:

Expert uploads resume
 ↓
closes browser
 ↓
returns next day
 ↓
continues from resume review

The onboarding state must persist server-side.

========================================================
PART 14 — PROFILE COMPLETION
========================================================

Create a robust profile completion system.

The dashboard should show something like:

Complete your Expert profile

████████████░░░ 80%

✓ Basic information
✓ Profile photo
✓ Professional headline
✓ About
✓ Experience
✓ Education

○ Add LinkedIn
○ Add portfolio

[Complete profile]

The completion calculation must be deterministic.

The backend should expose something like:

profileCompletion:
{
  percentage: 80,
  completedSections: [...],
  missingRequiredSections: [...],
  recommendedSections: [...]
}

Do not hardcode "80%" in the frontend.

========================================================
PART 15 — EXPERT PROFILE EDITOR
========================================================

Build a proper profile editor.

The Expert should be able to edit:

Basic Information
- Name/display name
- Profile image
- Headline
- Bio
- Location
- Timezone

Professional Information
- Current role
- Current company
- Years of experience
- Expertise
- Skills

Experience
- Add
- Edit
- Delete
- Reorder

Education
- Add
- Edit
- Delete
- Reorder

Links
- LinkedIn
- GitHub
- Portfolio
- Website
- Other links

Resume
- View current resume
- Replace resume
- Re-parse resume
- Keep current profile data

The editor must persist changes.

Refresh must not lose data.

========================================================
PART 16 — EXPERT VERIFICATION
========================================================

Build the initial verification flow.

Expert:

Profile complete
 ↓
Submit for verification
 ↓
Status = PENDING
 ↓
Admin review
 ↓
APPROVED / REJECTED

For rejection:

REJECTED
 ↓
show reason
 ↓
Expert updates profile
 ↓
Resubmit
 ↓
PENDING

The exact verification criteria should come from existing product/API requirements.

Do not invent verification requirements.

If the existing system only supports a simple admin approval mechanism, improve the data model without unnecessarily creating a complicated KYC system.

========================================================
PART 17 — EXPERT DASHBOARD

Create the Expert dashboard as the central operating page.

It should contain:

HEADER

Profile image
Expert name
Verification status

Example:

John Doe
Verified Expert ✓

PROFILE COMPLETION

Complete your profile

82%

[Continue setup]

QUICK ACTIONS

Edit Profile
My Page
Services
Calendar
Bookings

IMPORTANT:

Services, Calendar and Bookings may be future-phase features.

Do not create fake working functionality.

If they are not implemented yet, they should either:

appear as "Coming next"
not appear
or be disabled clearly

Do NOT create buttons that pretend to work.

OVERVIEW

Possible cards:

Profile views
Upcoming sessions
Active services
Earnings

But ONLY display metrics that actually exist.

Do not use mock values.

SETUP CHECKLIST

✓ Account created
✓ Resume uploaded
✓ Profile reviewed
✓ Profile completed
○ Verification
○ Add services
○ Set availability

The checklist should reflect real backend state.

========================================================
PART 18 — EXPERT DASHBOARD ROUTING

Determine the correct route structure.

Potential:

/expert
/expert/onboarding
/expert/onboarding/resume
/expert/onboarding/review
/expert/profile
/expert/profile/edit
/expert/verification

Use existing project conventions where possible.

Do not introduce inconsistent routing.

========================================================
PART 19 — ROLE / ACCESS CONTROL

This is mandatory.

Student/Candidate:

Must NOT access:

/expert
/expert/onboarding
/expert/profile/edit
/expert/verification

Expert:

Can only access their own:

profile
resume
experience
education
verification
onboarding state

Expert A must NOT be able to access Expert B's private onboarding/profile-management APIs by changing IDs.

Admin:

Can review verification.

Public:

Can only see the public profile data that is intended to be public.

Resume files should NOT automatically become public.

========================================================
PART 20 — API DESIGN

Inspect existing API conventions.

Then implement or adapt endpoints for:

Expert onboarding
Expert profile
Resume upload
Resume parsing
Resume review
Profile completion
Experience
Education
Verification
Dashboard

Possible conceptual endpoints:

GET /api/expert/me
PATCH /api/expert/profile

GET /api/expert/onboarding
PATCH /api/expert/onboarding

POST /api/expert/resume
POST /api/expert/resume/parse
GET /api/expert/resume
DELETE /api/expert/resume/:id

GET /api/expert/profile/completion

GET /api/expert/experience
POST /api/expert/experience
PATCH /api/expert/experience/:id
DELETE /api/expert/experience/:id

GET /api/expert/education
POST /api/expert/education
PATCH /api/expert/education/:id
DELETE /api/expert/education/:id

GET /api/expert/verification
POST /api/expert/verification/submit

The exact routes MUST follow existing API conventions.

Do not create duplicate APIs if equivalent APIs already exist.

========================================================
PART 21 — VALIDATION

Use server-side validation.

Validate:

Email
Phone
LinkedIn URL
GitHub URL
Portfolio URL
Dates
Experience
Education
Resume file type
Resume file size

Prevent:

Invalid dates
Malformed URLs
Huge uploads
Unsupported file types
Duplicate records where inappropriate

Use the existing validation library if one exists.

========================================================
PART 22 — DATABASE MIGRATION SAFETY

This is critical.

Do NOT destroy existing mentor data.

Before migration:

Inspect production/local schema.
Identify existing mentor records.
Determine how they map to Expert.
Create backward-compatible migration.
Preserve existing functionality.
Run existing tests.
Run migration.
Verify old mentor profiles still work.

If mentorProfiles is being evolved into ExpertProfile, document the migration.

Do not simply drop mentorProfiles.

========================================================
PART 23 — SCHEMA DECISION LOG

Create a document in the repository:

docs/architecture/expert-foundation-schema.md

It must contain:

Existing schema
New schema
Entity relationships
Migration decisions
Field definitions
Enum definitions
Ownership rules
Public vs private fields
Resume parsing model
Profile completion model
Verification model
Future extension points

This document will become the reference point for future phases.

========================================================
PART 24 — FUTURE-PHASE COMPATIBILITY

The Phase 1 schema must not make Phase 2 difficult.

Future functionality will include:

Services
Packages
Availability
Calendar
Bookings
Sessions
Payments
Reviews
Messages
Wallet
Payouts
Analytics
Notifications

Design relationships so future entities can reference:

Expert
ExpertProfile
User

For example:

ExpertService
↓
expertId

Booking
↓
expertId
serviceId
studentId

Review
↓
expertId
studentId
bookingId

Wallet
↓
expertId

Do NOT implement these future entities now unless required.

But ensure the Phase 1 Expert entity is stable enough to become their parent.

========================================================
PART 25 — PUBLIC PROFILE COMPATIBILITY

The current public mentor profile already exists.

Do not break it.

Determine how:

Current:

/mentors/:id
/m/:slug

should interact with the new Expert model.

The public profile should eventually consume:

Expert
↓
ExpertProfile
↓
Experience
↓
Education
↓
Expertise

For Phase 1, preserve current public behavior while migrating the underlying model safely.

========================================================
PART 26 — UI/UX REQUIREMENTS

The onboarding should feel like a professional platform, not a database form.

Recommended experience:

Step 1
Welcome to Embark

Step 2
Upload your resume

Step 3
We're extracting your professional information

Step 4
Review what we found

Step 5
Complete missing information

Step 6
Review your profile

Step 7
Submit for verification

Step 8
Expert Dashboard

Do not force users to manually enter information that can reliably be extracted from their resume.

At the same time, never silently publish extracted information without user confirmation.

========================================================
PART 27 — RESUME UX DETAILS

Upload screen:

"Upload your resume"

"We'll use your resume to quickly build your Expert profile."

Accepted formats:
Show only formats actually supported.

Optional:

"Don't have a structured resume?"

[Download Embark Resume Template]

Then:

[Upload Resume]

After upload:

Uploading...
Parsing...
Extracting profile information...

Then:

"We found 24 pieces of information."

[Review information]

========================================================
PART 28 — ERROR STATES

Handle:

Resume upload failure
Resume parsing failure
Unsupported format
File too large
Corrupted file
No text extracted
Low-quality resume
Parser timeout
API failure
Session expiry
Profile save failure
Verification submission failure

Example:

"We couldn't automatically read this resume."

Options:

[Try another resume]
[Enter information manually]

Never block the Expert permanently because parsing failed.

========================================================
PART 29 — TESTING

Add tests for:

AUTH

Expert registration
Student cannot access expert dashboard
Expert can access own dashboard

ONBOARDING

New expert starts onboarding
State persists
Expert can resume onboarding
Completed onboarding redirects correctly

RESUME

Upload supported resume
Reject unsupported file
Reject oversized file
Parse resume
Handle parser failure
Extract LinkedIn
Extract experience
Extract education
Extract skills
Review extracted information
Edit extracted information
Confirm extracted information
Re-upload resume without overwriting confirmed profile data

PROFILE

Edit profile
Add experience
Edit experience
Delete experience
Add education
Edit education
Delete education
Profile completion updates

VERIFICATION

Submit verification
Prevent duplicate invalid submissions
Admin can review
Admin can approve
Admin can reject
Expert can see status
Rejected expert can resubmit

SECURITY

Expert A cannot access Expert B
Student cannot access Expert APIs
Public cannot access private resume
Non-admin cannot approve verification
========================================================
PART 30 — E2E TEST

Create an end-to-end test for:

NEW EXPERT

↓

Register

↓

Login

↓

Expert onboarding

↓

Upload resume

↓

Resume parsed

↓

Review extracted information

↓

Edit one field

↓

Confirm

↓

Complete missing profile information

↓

Submit verification

↓

Expert dashboard

↓

Profile completion shown

↓

Edit profile

↓

Refresh

↓

Verify data persists

The test should use real application behavior.

Do not mock the entire backend.

Where an external resume parser cannot be used in CI, create a controlled test adapter/mock at the parser boundary while still testing the actual application flow.

========================================================
PART 31 — NO FAKE FUNCTIONALITY

This rule is mandatory.

Do NOT implement:

fake profile completion
fake verification
fake resume parsing
fake upload success
fake dashboard metrics
fake user data

If a real backend operation is unavailable, either:

Implement it properly, or
Clearly mark the feature as unavailable.

Do not make a button appear functional when it isn't.

========================================================
PART 32 — API / EXISTING INFRASTRUCTURE CHECK

Before creating any new external integration:

Search the repository for existing:

resume parser
file storage
upload APIs
email verification
WhatsApp verification
OTP
user verification
admin verification

Reuse existing infrastructure where possible.

If the product/API specification already defines an API for resume parsing, use it.

If no resume parser currently exists:

DO NOT invent an undocumented external API.

Instead:

Create an internal parser abstraction.
Implement the available parser strategy.
Keep the parser provider behind an interface.

Example conceptual architecture:

ResumeService
↓
ResumeParser
↓
ParserProvider

This allows a real provider to be plugged in later.

========================================================
PART 33 — EMAIL / WHATSAPP VERIFICATION

Inspect the existing authentication and verification implementation.

The Expert onboarding should use existing verification infrastructure if available.

Do not build a completely separate authentication system.

Determine whether:

Email verification
WhatsApp verification
Phone OTP

already exist.

If they exist:
reuse them.

If they do not:
document the missing capability rather than silently creating an unrelated system.

Verification status should be represented in the canonical user/expert state model.

========================================================
PART 34 — DATABASE FIELD OWNERSHIP

For every piece of information decide its canonical owner.

Example:

Email
→ User

Phone
→ User or canonical contact entity

Display Name
→ ExpertProfile

LinkedIn
→ ExpertProfile

Experience
→ ExpertExperience

Education
→ ExpertEducation

Resume
→ ExpertResume + FileAsset

Verification
→ ExpertVerification

Onboarding state
→ ExpertOnboarding

Do not store the same information in:

User
AND
Expert
AND
ExpertProfile

unless there is a clear reason.

If duplicated, document why.

========================================================
PART 35 — PUBLIC VS PRIVATE DATA

Explicitly classify fields.

PUBLIC:

displayName
headline
bio
profileImage
coverImage
experience
education
skills
LinkedIn
portfolio

PRIVATE:

email
phone
resume file
parser metadata
verification documents
verification notes
internal admin notes
onboarding state

Do not expose private fields through public profile APIs.

========================================================
PART 36 — FINAL SCHEMA CHECK

Before coding, output:

FINAL PHASE 1 SCHEMA

with:

Entity
Field
Type
Required?
Default
Public?
Owner
Relation
Purpose

Then output:

RELATIONSHIP DIAGRAM

Conceptually:

User
│
└── Expert
│
├── ExpertProfile
│
├── ExpertOnboarding
│
├── ExpertResume
│ │
│ └── FileAsset
│
├── ExpertExperience[]
│
├── ExpertEducation[]
│
└── ExpertVerification


This schema should be treated as the Phase 1 canonical contract.

========================================================
PART 37 — IMPLEMENTATION ORDER
========================================================

After the schema is finalized, implement in this order:

1. Database/schema changes
2. Migration
3. Expert entity/state
4. Expert profile model
5. Resume/file model
6. Resume upload
7. Resume parsing abstraction
8. Resume parsing implementation
9. Resume review API
10. Profile mapping
11. Onboarding state
12. Profile completion
13. Experience CRUD
14. Education CRUD
15. Verification state
16. Verification submission
17. Expert dashboard
18. Profile editor
19. Routing
20. RBAC
21. Tests
22. E2E flow
23. Documentation

Do not start with UI and invent the backend later.

========================================================
PART 38 — MIGRATION / BACKWARD COMPATIBILITY
========================================================

At the end verify that all current functionality still works:

- Existing authentication
- Student login
- Student dashboard
- Mentor/expert login
- Existing mentor profile
- Public mentor profile
- Mentor dashboard
- Existing mentorship records
- Existing mock sessions
- Playbooks
- Events
- Admin functionality

Run the existing test suite.

No Phase 1 implementation should unnecessarily break existing functionality.

========================================================
PART 39 — REQUIRED FINAL REPORT
========================================================

After implementation, produce:

# Phase 1 Implementation Report

## 1. What was implemented

## 2. Existing functionality reused

## 3. New entities

## 4. Modified entities

## 5. Migration performed

## 6. API endpoints

## 7. Frontend routes

## 8. Resume parsing architecture

## 9. Resume → profile mapping

## 10. Onboarding state machine

## 11. Profile completion algorithm

## 12. Verification lifecycle

## 13. RBAC rules

## 14. Tests added

## 15. Tests passed

## 16. Known limitations

## 17. Deferred features

## 18. Schema decisions for Phase 2

========================================================
PART 40 — SCHEMA CHANGE LOG
========================================================

Create:

docs/architecture/schema-change-log.md

Every future phase must update this file.

For every schema change record:

Date
Phase
Entity
Change
Reason
Migration
Backward compatibility
Future impact

Example:

| Phase | Entity | Change | Reason |
|---|---|---|---|
| P1 | Expert | Added onboardingStatus | Track onboarding |
| P1 | ExpertResume | Created | Resume parsing |
| P1 | ExpertExperience | Created | Structured experience |
| P1 | ExpertVerification | Created | Verification lifecycle |

This is important because future phases will depend on these entities.

========================================================
PART 41 — STOP CONDITION
========================================================

Before declaring Phase 1 complete, verify:

[ ] Expert can register
[ ] Expert onboarding starts
[ ] Expert can upload resume
[ ] Resume is stored correctly
[ ] Resume is parsed
[ ] Extracted data is shown
[ ] Expert can edit extracted data
[ ] Expert can confirm extracted data
[ ] Missing information can be entered manually
[ ] Experience can be managed
[ ] Education can be managed
[ ] Skills/expertise can be managed
[ ] Profile can be edited
[ ] Profile completion is calculated server-side
[ ] Completion state persists
[ ] Verification can be submitted
[ ] Verification state persists
[ ] Expert dashboard works
[ ] Expert can resume incomplete onboarding
[ ] Expert can refresh without losing state
[ ] RBAC is enforced
[ ] Resume/private data is protected
[ ] Existing mentor functionality still works
[ ] Existing tests pass
[ ] New Phase 1 tests pass
[ ] E2E Expert flow passes
[ ] Schema documentation exists
[ ] Migration documentation exists
[ ] No fake/mock production functionality was introduced

========================================================
FINAL QUESTION
========================================================

At the very end, answer:

"Can a brand-new Expert now register, upload their resume, have their professional information extracted, verify/edit that information, complete their profile, submit verification, and reach a functioning Expert Dashboard?"

Answer:

YES — VERIFIED

or

PARTIAL

or

NO

or

BLOCKED

Provide evidence.

Do not call it VERIFIED unless the flow has actually been tested.
One architectural decision I strongly recommend

For the resume system, make the distinction:

                 ┌─────────────────────┐
                 │     RESUME FILE      │
                 │   Original source    │
                 └──────────┬──────────┘
                            ↓
                    Resume Parser
                            ↓
                 ┌─────────────────────┐
                 │   Parsed Resume     │
                 │   Machine output    │
                 └──────────┬──────────┘
                            ↓
                     Review / Edit
                            ↓
                 ┌─────────────────────┐
                 │  Expert Profile     │
                 │ USER-CONFIRMED DATA │
                 └─────────────────────┘

That distinction is very important for the rest of the product.

If an Expert uploads a new resume six months later, you don't want:

Upload resume
   ↓
Parser
   ↓
OVERWRITE ENTIRE PROFILE

You want:

Upload resume
   ↓
Parse
   ↓
Compare
   ↓
"These 7 things changed"
   ↓
Expert chooses
   ↓
Update profile

This also gives you a clean foundation for future AI-assisted profile building.