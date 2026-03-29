# Data Model Reference

> **Purpose:** Complete reference of every MongoDB/Mongoose model in the project. Details every field, type, default, index, and relationship. This is the schema contract that all application code must respect.

---

## Entity Relationship Diagram

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────────┐
│  User   │      │ Course  │─────►│  Track   │─────►│   Question   │
└────┬────┘      └────┬────┘      └────┬─────┘      └──────┬───────┘
     │                │                │                    │
     │  ┌─────────────┘                │                    │
     │  │                              │                    │
     ▼  ▼                              ▼                    ▼
┌──────────┐                    ┌──────────────┐    ┌──────────────┐
│ Progress │◄───────────────────│  (completed  │    │  Submission  │
│          │                    │   tracks)    │    │              │
└────┬─────┘                    └──────────────┘    └──────────────┘
     │
     ▼
┌──────────────┐     ┌──────────────┐
│ Certificate  │     │ ActivityLog  │
└──────────────┘     └──────────────┘
```

---

## 1. User (`src/models/User.ts`)

**Collection name:** `users`
**Purpose:** Stores every registered user's profile, XP, level, streak, and badges.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `firebaseUid` | `String` | ✅ | — | unique, sparse | Firebase Auth UID — primary auth identifier |
| `email` | `String` | ✅ | — | unique | User's email |
| `displayName` | `String` | ✅ | — | — | Display name |
| `username` | `String` | ✅ | — | unique | Used in URLs and leaderboard |
| `avatarUrl` | `String` | ❌ | — | — | Profile picture URL |
| `bio` | `String` | ❌ | — | — | Max 300 chars |
| `role` | `String` (enum) | ❌ | `"student"` | — | `"student"`, `"admin"`, `"instructor"` |
| `xp` | `Number` | ❌ | `0` | descending | Total experience points |
| `level` | `Number` | ❌ | `1` | — | Computed from XP via `calculateLevel()` |
| `badges` | `Array<Badge>` | ❌ | `[]` | — | `{ id, name, description, earnedAt }` |
| `streak.current` | `Number` | ❌ | `0` | — | Current consecutive active days |
| `streak.longest` | `Number` | ❌ | `0` | — | All-time longest streak |
| `streak.lastActiveDate` | `Date` | ❌ | — | — | Last date the user was active |
| `social.github` | `String` | ❌ | — | — | GitHub profile URL |
| `social.linkedin` | `String` | ❌ | — | — | LinkedIn profile URL |
| `social.website` | `String` | ❌ | — | — | Personal website URL |
| `isPublicProfile` | `Boolean` | ❌ | `true` | — | Whether profile is publicly visible |
| `createdAt` | `Date` | auto | — | — | Mongoose `timestamps` |
| `updatedAt` | `Date` | auto | — | — | Mongoose `timestamps` |

---

## 2. Course (`src/models/Course.ts`)

**Collection name:** `courses`
**Purpose:** Top-level content container. A course groups tracks under difficulty levels.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `title` | `String` | ✅ | — | — | Course title |
| `slug` | `String` | ✅ | — | unique | URL-safe identifier |
| `description` | `String` | ✅ | — | — | Full description (markdown) |
| `shortDescription` | `String` | ✅ | — | — | Max 160 chars, used for cards/SEO |
| `thumbnail` | `String` | ✅ | — | — | Image URL |
| `difficulty` | `String` (enum) | ✅ | — | — | ⚠️ **TO BE REMOVED** — see progression-system.md §5.4 |
| `language` | `String` | ✅ | — | ✅ | Programming language (e.g., "java", "python") |
| `tracks` | `ObjectId[]` | ❌ | `[]` | — | Refs to `Track` documents |
| `totalTracks` | `Number` | ❌ | `0` | — | Denormalized count |
| `totalQuestions` | `Number` | ❌ | `0` | — | Denormalized count |
| `tags` | `String[]` | ❌ | `[]` | — | Searchable tags |
| `isPublished` | `Boolean` | ❌ | `false` | ✅ | Only published courses are visible to students |
| `enrollmentCount` | `Number` | ❌ | `0` | descending | For sorting by popularity |
| `averageRating` | `Number` | ❌ | `0` | — | Average user rating |
| `createdBy` | `ObjectId` | ✅ | — | — | Ref to `User` (admin/instructor) |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

> **⚠️ Required change:** The `difficulty` field must be removed from `Course`. Difficulty is a property of each `Track`, not the course as a whole. A course spans all 3 difficulty levels.

---

## 3. Track (`src/models/Track.ts`)

**Collection name:** `tracks`
**Purpose:** An individual topic/module. Contains theory content and questions. Ordered within its difficulty level.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `courseId` | `ObjectId` | ✅ | — | compound | Ref to `Course` |
| `title` | `String` | ✅ | — | — | Track title |
| `slug` | `String` | ✅ | — | ✅ | URL-safe identifier |
| `description` | `String` | ✅ | — | — | Short description |
| `order` | `Number` | ✅ | — | compound | 1-indexed position within its difficulty level |
| `theory` | `String` | ✅ | — | — | Markdown content — the lesson material |
| `questions` | `ObjectId[]` | ❌ | `[]` | — | Refs to `Question` documents |
| `totalQuestions` | `Number` | ❌ | `0` | — | Denormalized count |
| `passingScore` | `Number` | ❌ | `80` | — | Percentage required to pass |
| `isLocked` | `Boolean` | ❌ | `true` | — | ⚠️ Static lock flag — should be COMPUTED at runtime |
| `xpReward` | `Number` | ❌ | `100` | — | XP awarded upon track completion |
| `isPublished` | `Boolean` | ❌ | `false` | — | Only published tracks are visible to students |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

**Current index:** `{ courseId: 1, order: 1 }` (unique)

> **⚠️ Required addition:** A `difficulty` field (`"beginner" | "intermediate" | "advanced"`) must be added to `Track`. The compound index must become `{ courseId: 1, difficulty: 1, order: 1 }` to ensure ordering is scoped per difficulty level.

> **⚠️ Design note on `isLocked`:** The static `isLocked` field is a design smell. Lock status should be COMPUTED at runtime based on the user's `Progress.completedTracks[]`, not stored as a static boolean on the track. The static field can be kept as a "default lock state" but the API must override it with the computed value for each user.

---

## 4. Question (`src/models/Question.ts`)

**Collection name:** `questions`
**Purpose:** A single assessment item within a track.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `trackId` | `ObjectId` | ✅ | — | compound | Ref to `Track` |
| `type` | `String` (enum) | ✅ | — | ✅ | `"mcq"`, `"multi-select"`, `"descriptive"`, `"coding"` |
| `order` | `Number` | ✅ | — | compound | 1-indexed position within the track |
| `title` | `String` | ✅ | — | — | Question title |
| `description` | `String` | ✅ | — | — | Full question text (markdown) |
| `difficulty` | `String` (enum) | ✅ | — | ✅ | `"easy"`, `"medium"`, `"hard"` — this is per-question difficulty, NOT the progression level |
| `xpReward` | `Number` | ❌ | `10` | — | XP awarded for correct answer |
| `explanation` | `String` | ❌ | — | — | Shown after submission (correct or incorrect) |
| `options` | `Array<Option>` | ❌ | — | — | For MCQ/multi-select: `{ id, text, isCorrect }` |
| `sampleAnswer` | `String` | ❌ | — | — | For descriptive questions |
| `maxWords` | `Number` | ❌ | — | — | Word limit for descriptive |
| `rubric` | `String` | ❌ | — | — | Grading rubric for descriptive |
| `starterCode` | `String` | ❌ | — | — | Initial code for coding questions |
| `language` | `String` | ❌ | — | — | Programming language for coding questions |
| `testCases` | `Array<TestCase>` | ❌ | — | — | `{ id, input, expectedOutput, isHidden, weight }` |
| `timeLimit` | `Number` | ❌ | `10` | — | Seconds for code execution |
| `memoryLimit` | `Number` | ❌ | `256` | — | MB for code execution |
| `hints` | `String[]` | ❌ | — | — | Hints for the question |
| `tags` | `String[]` | ❌ | `[]` | — | Searchable tags |
| `isPublished` | `Boolean` | ❌ | `false` | — | Only published questions count for progression |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

**Current index:** `{ trackId: 1, order: 1 }`

> **Important:** `Question.difficulty` ("easy"/"medium"/"hard") is NOT the same as the progression difficulty level ("beginner"/"intermediate"/"advanced"). A beginner-level track could contain easy, medium, and hard questions. These are orthogonal concepts.

---

## 5. Submission (`src/models/Submission.ts`)

**Collection name:** `submissions`
**Purpose:** Records every answer a user submits to a question.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `userId` | `ObjectId` | ✅ | — | compound | Ref to `User` |
| `questionId` | `ObjectId` | ✅ | — | compound | Ref to `Question` |
| `trackId` | `ObjectId` | ✅ | — | compound | Ref to `Track` |
| `courseId` | `ObjectId` | ❌ | — | — | ⚠️ Not currently required — should be |
| `type` | `String` | ✅ | — | — | The question type at time of submission |
| `selectedOptions` | `String[]` | ❌ | — | — | For MCQ/multi-select |
| `descriptiveAnswer` | `String` | ❌ | — | — | For descriptive questions |
| `code` | `String` | ❌ | — | — | For coding questions |
| `language` | `String` | ❌ | — | — | Code language |
| `isCorrect` | `Boolean` | ❌ | `false` | — | **THE KEY FIELD FOR PROGRESSION** |
| `score` | `Number` | ❌ | `0` | — | Score 0–100 |
| `xpEarned` | `Number` | ❌ | `0` | — | XP earned from this submission |
| `testResults` | `Array<TestResult>` | ❌ | — | — | Per-test-case results for coding |
| `compilationError` | `String` | ❌ | — | — | Compilation error message |
| `executionTime` | `Number` | ❌ | — | — | Total execution time |
| `reviewStatus` | `String` (enum) | ❌ | — | ✅ | `"pending"`, `"reviewed"`, `"rejected"` — for descriptive only |
| `reviewedBy` | `ObjectId` | ❌ | — | — | Ref to `User` (reviewer) |
| `reviewFeedback` | `String` | ❌ | — | — | Reviewer's feedback |
| `reviewedAt` | `Date` | ❌ | — | — | When review was completed |
| `attemptNumber` | `Number` | ❌ | `1` | — | Which attempt this is |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

**Indexes:**
- `{ userId: 1, questionId: 1 }` — Find all submissions by a user for a specific question
- `{ userId: 1, trackId: 1 }` — Find all submissions by a user for a track
- `{ createdAt: -1 }` — Recent submissions

> **⚠️ Required change:** `courseId` should be made required. It's needed to query "all submissions in a course" for progress calculation.

---

## 6. Progress (`src/models/Progress.ts`)

**Collection name:** `progresses`
**Purpose:** Per-user, per-course enrollment and progression tracking. This is the most critical document for the progression system.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `userId` | `ObjectId` | ✅ | — | compound (unique) | Ref to `User` |
| `courseId` | `ObjectId` | ✅ | — | compound (unique) | Ref to `Course` |
| `enrolledAt` | `Date` | ❌ | `Date.now` | — | |
| `lastActiveAt` | `Date` | ❌ | `Date.now` | descending | For "recently active" queries |
| `completedTracks` | `ObjectId[]` | ❌ | `[]` | — | Track IDs that are fully completed |
| `currentTrackId` | `ObjectId` | ❌ | — | — | The track the user is currently working on |
| `completedQuestions` | `ObjectId[]` | ❌ | `[]` | — | Question IDs with `isCorrect: true` submissions |
| `percentComplete` | `Number` | ❌ | `0` | — | 0–100 overall course progress |
| `isCompleted` | `Boolean` | ❌ | `false` | — | `true` when ALL tracks in ALL levels are done |
| `completedAt` | `Date` | ❌ | — | — | When course was completed |
| `certificateId` | `ObjectId` | ❌ | — | — | Ref to `Certificate` |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

**Indexes:**
- `{ userId: 1, courseId: 1 }` — unique compound (one progress per user per course)
- `{ userId: 1, lastActiveAt: -1 }` — For dashboard "continue learning" queries

> **⚠️ Required additions (see progression-system.md §5):**
> - `completedLevels: String[]` — Array of completed difficulty levels
> - `currentTrackProgress: { trackId, currentQuestionOrder, totalQuestionsInTrack }` — Cache for current position

---

## 7. Certificate (`src/models/Certificate.ts`)

**Collection name:** `certificates`
**Purpose:** Issued when a user completes an entire course.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `certificateId` | `String` | ✅ | — | unique | Public-facing ID (e.g., "LJQ-CERT-xxxx") |
| `userId` | `ObjectId` | ✅ | — | compound (unique) | Ref to `User` |
| `courseId` | `ObjectId` | ✅ | — | compound (unique) | Ref to `Course` |
| `issuedAt` | `Date` | ❌ | `Date.now` | — | |
| `metadata` | `Mixed` | ❌ | — | — | Flexible metadata (score, duration, etc.) |
| `createdAt` | `Date` | auto | — | — | |
| `updatedAt` | `Date` | auto | — | — | |

**Indexes:**
- `{ userId: 1, courseId: 1 }` — unique compound (one certificate per user per course)

---

## 8. ActivityLog (`src/models/ActivityLog.ts`)

**Collection name:** `activitylogs`
**Purpose:** Stores discrete user activity events for the contribution heatmap and analytics.

| Field | Type | Required | Default | Index | Notes |
|-------|------|----------|---------|-------|-------|
| `userId` | `ObjectId` | ✅ | — | ✅ | Ref to `User` |
| `action` | `String` (enum) | ✅ | — | — | `"course_view"`, `"question_attempt"`, `"track_complete"`, `"course_complete"` |
| `details` | `String` | ❌ | — | — | Optional context string |
| `timestamp` | `Date` | ❌ | `Date.now` | ✅ | When the activity occurred |

> **Note:** `timestamps: false` — this model uses its own `timestamp` field, not Mongoose's auto timestamps.

---

## Relationship Map

```
User (1) ──────── (N) Progress ──────── (1) Course
User (1) ──────── (N) Submission ─────── (1) Question
User (1) ──────── (N) Certificate ────── (1) Course
User (1) ──────── (N) ActivityLog

Course (1) ─────── (N) Track
Track (1) ──────── (N) Question
Track (1) ──────── (N) Submission (via trackId)

Progress.completedTracks  →  Track[]
Progress.completedQuestions → Question[]
Progress.currentTrackId    →  Track
Progress.certificateId     →  Certificate
```
