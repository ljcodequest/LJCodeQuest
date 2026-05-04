# LJ CodeQuest User and Admin Guide

This guide explains how to run LJ CodeQuest and how to use the platform as both an Admin and a User.

LJ CodeQuest is a programming learning and certification platform. Admins create and manage courses, tracks, questions, users, reviews, and publishing. Users enroll in courses, learn track theory, complete timed assessments, earn XP, unlock the next tracks, and claim verifiable certificates.

## 1. Quick Start

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create `.env.local` or `.env` in the project root.

Required for the app:

```bash
MONGODB_URI="mongodb+srv://..."

NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Optional services:

```bash
JDOODLE_CLIENT_ID="..."
JDOODLE_CLIENT_SECRET="..."

GEMINI_API_KEY="..."

CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

CERTIFICATE_SECRET="replace-with-a-long-random-secret"
```

Use JDoodle credentials if you want coding challenges to execute against test cases. Use Gemini if you want AI hints and AI review features. Use Cloudinary if you want admin course image uploads.

### Seed Demo Data

```bash
npm run seed
```

To reset seeded courses, users, progress, submissions, and certificates:

```bash
npm run seed:reset
```

The seed creates:

- Admin: `admin@ljcodequest.dev`
- Users: `student1@ljcodequest.dev`, `student2@ljcodequest.dev`, `student3@ljcodequest.dev`
- Courses: JavaScript Fundamentals, Python Problem Solving

Important: Firebase handles real login. To make your Firebase account an admin, set these before seeding:

```bash
SEED_ADMIN_EMAIL="your-admin-email@example.com"
SEED_ADMIN_FIREBASE_UID="your-firebase-uid"
npm run seed:reset
```

### Run the App

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

### Verify Production Build

```bash
npm run build
```

## 2. Roles

LJ CodeQuest has two roles:

- `admin`
- `user`

Admins can manage platform content and operations. Users can only learn, enroll, submit assessments, view progress, and manage their own public profile/certificates.

Users cannot create courses, edit questions, change scores, access hidden test cases, manually issue certificates, or enter `/admin`.

## 3. Main URLs

Public and user pages:

- `/` - Landing page
- `/register` - Create an account
- `/login` - Sign in
- `/courses` - Published course catalog
- `/courses/[slug]` - Course detail and enrollment
- `/dashboard` - User dashboard
- `/learn/[courseSlug]` - Course learning path
- `/learn/[courseSlug]/tracks/[trackSlug]` - Track theory page
- `/learn/[courseSlug]/tracks/[trackSlug]/quiz` - Timed assessment
- `/courses/[slug]/certificate` - Claim/view course certificate
- `/verify/[certificateId]` - Public certificate verification
- `/profile/[username]` - Public profile
- `/leaderboard` - XP leaderboard

Admin pages:

- `/admin` - Admin dashboard
- `/admin/users` - User and role management
- `/admin/courses` - Course management
- `/admin/courses/new` - Create course
- `/admin/courses/[id]` - Edit course
- `/admin/courses/[id]/tracks` - Manage course tracks
- `/admin/courses/[id]/tracks/new` - Create track
- `/admin/tracks` - All tracks
- `/admin/tracks/[id]/edit` - Edit track
- `/admin/tracks/[id]/questions` - Manage track questions
- `/admin/tracks/[id]/questions/new` - Create question
- `/admin/questions` - Question bank
- `/admin/questions/[id]/edit` - Edit question
- `/admin/reviews` - Review pending descriptive submissions

## 4. Admin Guide

### 4.1 Access Admin

1. Sign in with a Firebase account that has a matching MongoDB user role of `admin`.
2. Open `/admin`.
3. If redirected away, your user record is missing or your role is not `admin`.

To promote an account:

1. Seed with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_FIREBASE_UID`, or
2. Use an existing admin account to open `/admin/users` and change the role to Admin.

### 4.2 Manage Users

Go to `/admin/users`.

You can:

- Search users by name, email, or username.
- Filter by role.
- Change a user between `user` and `admin`.

Safety rule: an admin cannot demote their own account.

### 4.3 Create a Course

Go to `/admin/courses/new`.

Fill:

- Course title
- Short description
- Full description
- Difficulty
- Language
- Estimated hours
- Tags
- Thumbnail image or URL
- Prerequisite courses, if any
- Publish immediately checkbox

Click `Save Course`.

Notes:

- The course slug is generated from the title.
- Only published courses appear in the public catalog.
- Prerequisite courses are enforced by the enrollment API, not just by the frontend.

### 4.4 Edit or Publish a Course

Go to `/admin/courses`.

Use the course actions to:

- Edit course details.
- Publish or unpublish.
- Manage tracks.
- Delete the course.

Unpublished courses are hidden from users.

### 4.5 Create Tracks

Open a course from `/admin/courses`, then go to its tracks page.

Track fields:

- Title
- Description
- Difficulty: beginner, intermediate, advanced
- Order
- Theory content
- Passing score
- XP reward
- Published status

Tracks are the main learning units. A course can have many tracks. Users progress through tracks in order.

### 4.6 Track Order and Unlocking

Users can access:

- The current track.
- Completed tracks.

Users cannot access a later track unless previous required tracks are completed. The server checks this in learning and submission APIs.

Recommended structure:

```text
Course
  Beginner Track 1
  Beginner Track 2
  Intermediate Track 1
  Advanced Track 1
```

### 4.7 Create Questions

Go to:

`/admin/tracks/[id]/questions/new`

Supported question types:

- MCQ
- Multi-select
- Descriptive/fill-in-the-blanks
- Coding challenge

Common fields:

- Title
- Description
- Type
- Difficulty
- XP reward
- Explanation
- Tags
- Time limit
- Publish status

Users only receive sanitized question data. Correct answers, sample answers, rubrics, and hidden coding test case details are not exposed to normal users.

### 4.8 MCQ Questions

Use MCQ when exactly one option is correct.

Set:

- Options
- One correct option
- Explanation
- XP reward
- Time limit

The backend grades MCQ submissions.

### 4.9 Multi-Select Questions

Use multi-select when multiple answers may be correct.

Set:

- Options
- Every correct option
- Explanation
- XP reward
- Time limit

The answer is correct only when the selected option set exactly matches the correct option set.

### 4.10 Descriptive / Fill-in-the-Blanks Questions

The current descriptive component is used as a fill-in-the-blanks style assessment.

Use `starterCode` or the prompt template with blanks like:

```text
A pure function returns the [[BLANK_1]] output and has no [[BLANK_2]] effects.
```

Set:

- Options for each draggable answer
- `sampleAnswer` as a comma-separated list of correct option IDs

Example:

```text
same,side
```

The backend compares the submitted option ID order to `sampleAnswer`.

### 4.11 Coding Challenge Questions

Coding challenge fields:

- Language
- Starter code
- Problem statement
- Public test cases
- Hidden test cases
- Time limit
- Memory limit
- XP reward

The user may run code from the UI. On final submit, the backend re-runs the source code against the database test cases, including hidden cases. The client cannot mark a coding question as passed by itself.

To enable coding execution, configure:

```bash
JDOODLE_CLIENT_ID="..."
JDOODLE_CLIENT_SECRET="..."
```

If JDoodle is not configured, coding submissions return a code runner unavailable error.

### 4.12 Review Descriptive Submissions

Go to `/admin/reviews`.

Admins can review pending descriptive submissions where manual review is used. The current learning flow mostly auto-grades fill-in-the-blank style descriptive questions.

### 4.13 Certificates

Certificates are issued when the backend marks a course completed.

Certificate records include:

- Certificate ID
- User
- Course
- Issue date
- Status
- Verification hash

Public verification is available at:

```text
/verify/[certificateId]
```

Only active certificates verify successfully.

## 5. User Guide

### 5.1 Register and Login

Users can create an account at `/register` and log in at `/login`.

After login, users are redirected to `/dashboard`.

### 5.2 Browse Courses

Open `/courses`.

Users can:

- Search courses.
- Filter by difficulty.
- Open a course detail page.

Only published courses are shown.

### 5.3 Enroll in a Course

Open a course detail page:

```text
/courses/[slug]
```

Click `Enroll Now`.

The server checks:

- The course exists.
- The course is published.
- The user is logged in.
- The user is not already enrolled.
- All prerequisite courses are completed.

If enrollment succeeds, a progress record is created and the first track is unlocked.

### 5.4 User Dashboard

Open `/dashboard`.

The dashboard shows:

- Welcome profile summary
- XP
- Streak
- Level progress
- Continue learning
- Enrolled courses

Use `Resume Track` or course cards to continue learning.

### 5.5 Learn a Course

Open:

```text
/learn/[courseSlug]
```

This page shows levels and tracks.

Track states:

- Locked
- In progress
- Completed

Users can only open tracks that are unlocked.

### 5.6 Read Track Theory

Open:

```text
/learn/[courseSlug]/tracks/[trackSlug]
```

Users can read the lesson/theory content, view passing criteria, XP reward, and start or continue the assessment.

### 5.7 Take a Timed Assessment

Open:

```text
/learn/[courseSlug]/tracks/[trackSlug]/quiz
```

When the current question loads, the server creates or resumes one active timed attempt.

Important timer rules:

- The server stores `startedAt` and `expiresAt`.
- Refreshing the browser does not reset the timer.
- Opening the same question again resumes the active attempt.
- Expired attempts are rejected by the backend.
- The countdown shown in the UI is only visual; the server is authoritative.

### 5.8 Answer MCQ or Multi-Select

Select the answer options and click `Submit Answer`.

If correct:

- XP may be awarded.
- Progress advances.
- The user can continue to the next question.

If incorrect:

- The user can try again.

### 5.9 Answer Fill-in-the-Blanks

Select an option from the bank and place it into a blank.

When all blanks are filled, click `Check Answer`.

Correct answers advance progress.

### 5.10 Solve Coding Challenges

In coding questions:

1. Write code in the editor.
2. Click `Run Code` to test.
3. Fix failures.
4. Click `Submit`.

The final submit is validated on the backend using stored test cases. Hidden test case inputs and expected outputs are never shown to users.

### 5.11 AI Hints

If `GEMINI_API_KEY` is configured, coding questions can request AI hints.

Hints are meant to guide the user without giving full code.

### 5.12 Progress and Unlocking

When a question is completed correctly:

- The question is added to completed questions.
- XP is awarded if this is the first correct completion.
- The current question order advances.

When all questions in a track are complete:

- The track is marked completed.
- Track XP is awarded.
- The next track unlocks.

When all required tracks/levels are complete:

- The course is marked completed.
- A certificate can be issued.

### 5.13 Claim a Certificate

After completing a course, open:

```text
/courses/[slug]/certificate
```

The app claims or loads the certificate.

Users can:

- View certificate details.
- Open the public verification link.
- Print/download through the browser print flow if available.

### 5.14 Verify a Certificate

Anyone can open:

```text
/verify/[certificateId]
```

The verification page shows:

- Certificate ID
- Validity
- Issue date
- User display name
- Course title
- Course level/difficulty

It does not expose:

- User email
- Private answers
- Hidden test cases
- Internal review data

### 5.15 Public Profile

Open:

```text
/profile/[username]
```

Public profiles show:

- Display name
- Bio
- XP/level
- Completed courses
- Certificates
- Recent activity

Profiles can be private if `isPublicProfile` is disabled on the user record.

## 6. Recommended Admin Content Workflow

For each new course:

1. Create the course as unpublished.
2. Add thumbnail, description, language, tags, and estimated hours.
3. Add prerequisite courses if the course should be locked.
4. Create tracks in the correct order.
5. Add theory content to each track.
6. Add questions to each track.
7. Publish questions.
8. Publish tracks.
9. Publish the course.
10. Test the course as a normal user.

Recommended minimum course structure:

```text
Course
  Track 1
    Theory
    Question 1
    Question 2
  Track 2
    Theory
    Question 1
  Certificate
```

## 7. Assessment Rules and Integrity

The platform currently supports these integrity controls:

- Role-based admin access.
- Backend course enrollment checks.
- Backend track lock checks.
- Backend question lock checks.
- Server-side timed attempts.
- One active attempt per user/question.
- Hidden test case sanitization.
- Coding challenge validation against database test cases.
- Duplicate XP prevention after a question was already solved.
- Duplicate certificate prevention per user/course.

Important: coding execution uses an external judge service. For production-grade certification, use a hardened isolated runner or trusted judge service with runtime, memory, network, and filesystem limits.

## 8. Troubleshooting

### I cannot access `/admin`

Check:

- You are logged in.
- Your MongoDB user role is `admin`.
- Your Firebase UID matches the user record `firebaseUid`.
- The `session` cookie exists.

### Courses are not visible

Check:

- Course `isPublished` is true.
- Tracks are published.
- Questions are published if you expect assessments to appear.

### Enrollment says course is locked

The course has prerequisites. Complete all prerequisite courses first or remove prerequisites in the admin course editor.

### Coding challenges fail before running

Check:

```bash
JDOODLE_CLIENT_ID
JDOODLE_CLIENT_SECRET
```

Also confirm the question has at least one test case.

### AI hints are offline

Set:

```bash
GEMINI_API_KEY
```

### Image upload fails

Set:

```bash
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Certificate verification fails

Check:

- The certificate ID is correct.
- Certificate status is `active`.
- The user/course still exist.

## 9. Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run seed
npm run seed:reset
```

Current note: `npm run build` should pass. `npm run lint` may report existing project-wide lint issues such as explicit `any`, unused imports, and unescaped text.

## 10. Production Checklist

Before real users use the platform:

- Configure real Firebase project and admin credentials.
- Use a secure `CERTIFICATE_SECRET`.
- Use production MongoDB with backups.
- Use a hardened code execution service.
- Add rate limiting for auth, submissions, AI, and code execution.
- Add audit logging for admin changes and role changes.
- Add certificate revocation/admin registry UI.
- Add monitoring for code runner failures.
- Review all unpublished/published content states.
- Test the full user path from registration to certificate verification.

