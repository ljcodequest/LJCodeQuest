# Progression API Contract

> **Purpose:** Defines every API endpoint needed for the progression system — both the ones that already exist and the ones that must be created. For each endpoint, this guide specifies the HTTP method, URL, request body, response shape, server-side validation rules, and how it interacts with the progression system.

---

## API Response Envelope

All API responses must use the standard envelope defined in `src/lib/api.ts`:

### Success response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated success response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  },
  "message": "Operation successful"
}
```

### Error response
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

**Error codes used throughout:**
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | User lacks permission (e.g., student trying admin route) |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `LOCKED` | 403 | Progression gate — content is locked |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Authentication

All progression-related endpoints require authentication via Firebase JWT token.

- **Header:** `Authorization: Bearer <firebase_id_token>`
- **Cookie fallback:** `session=<firebase_id_token>` (for server-rendered pages)
- **Dev mode:** `x-dev-firebase-uid`, `x-dev-role`, `x-dev-email` headers (non-production only)

Server-side auth is handled by helper functions in `src/lib/auth.ts`:
- `authenticateRequest(request)` → returns `AuthSession`
- `getAuthContext(request)` → returns `AuthContext` (includes DB user lookup)
- `requireRegisteredUser(request)` → returns `AuthContext` with guaranteed non-null `user`
- `requireAdmin(request)` → returns `AuthContext` + asserts `role === "admin"`

---

## Endpoints

---

### 1. Enroll in a Course

**Status:** 🔴 MUST BE CREATED

**`POST /api/courses/[slug]/enroll`**

Creates a `Progress` document for the authenticated user in the specified course. This is the gateway to the progression system.

#### Request
```json
// No body required — the courseSlug comes from the URL
```

#### Server-side logic
1. Call `requireRegisteredUser(request)`.
2. Find the course by `slug`. If not found or not published → `404 NOT_FOUND`.
3. Check if a `Progress` document already exists for this user + course.
   - If yes → return `409 CONFLICT` with `"Already enrolled"`.
4. Find the first track: `Track.findOne({ courseId, difficulty: "beginner", order: 1 })`.
5. Create `Progress`:
   ```
   {
     userId: user._id,
     courseId: course._id,
     currentTrackId: firstTrack._id,
     completedTracks: [],
     completedQuestions: [],
     completedLevels: [],
     percentComplete: 0,
     isCompleted: false
   }
   ```
6. Increment `Course.enrollmentCount` by 1.
7. Log `ActivityLog` with `action: "course_view"`.

#### Response (201)
```json
{
  "success": true,
  "data": {
    "progressId": "...",
    "courseId": "...",
    "currentTrackSlug": "variables-and-data-types"
  },
  "message": "Successfully enrolled in course"
}
```

---

### 2. Get Course Progress (with track listing and lock states)

**Status:** 🟡 EXISTS BUT NEEDS MODIFICATION

**`GET /api/learn/[courseSlug]/tracks`**

Returns all tracks for a course, with each track's lock/unlock/completed state calculated for the authenticated user.

#### Server-side logic
1. Call `requireRegisteredUser(request)`.
2. Find course by `slug`.
3. Find the user's `Progress` for this course. If not found → `403 NOT_ENROLLED`.
4. Find ALL tracks for this course, sorted by `difficulty` then `order`.
5. For EACH track, compute the progression state:
   ```
   if (track._id ∈ progress.completedTracks) → status: "completed"
   else if (track is the first track in its difficulty level AND all tracks in previous difficulty are completed) → status: "unlocked"
   else if (previous track in same difficulty ∈ progress.completedTracks) → status: "unlocked"
   else → status: "locked"
   ```
6. For admin/instructor → all tracks are "unlocked" (override).

#### Response (200)
```json
{
  "success": true,
  "data": {
    "course": {
      "_id": "...",
      "title": "Java Programming",
      "slug": "java-programming"
    },
    "levels": [
      {
        "difficulty": "beginner",
        "status": "in-progress",
        "tracks": [
          {
            "_id": "...",
            "title": "Variables & Data Types",
            "slug": "variables-and-data-types",
            "order": 1,
            "status": "completed",
            "totalQuestions": 5,
            "completedQuestions": 5
          },
          {
            "_id": "...",
            "title": "Control Flow",
            "slug": "control-flow",
            "order": 2,
            "status": "in-progress",
            "totalQuestions": 4,
            "completedQuestions": 2
          },
          {
            "_id": "...",
            "title": "Arrays",
            "slug": "arrays",
            "order": 3,
            "status": "locked",
            "totalQuestions": 6,
            "completedQuestions": 0
          }
        ]
      },
      {
        "difficulty": "intermediate",
        "status": "locked",
        "tracks": [ ... ]
      }
    ],
    "percentComplete": 23.3,
    "completedLevels": []
  }
}
```

---

### 3. Get Track Content (Theory + Current Question)

**Status:** 🟡 EXISTS BUT NEEDS MODIFICATION

**`GET /api/learn/[courseSlug]/tracks/[trackSlug]`**

Returns the track's theory content and the user's current position in the question sequence.

#### Server-side logic
1. Call `requireRegisteredUser(request)`.
2. Find course by `courseSlug`, track by `trackSlug`.
3. Find user's `Progress`.
4. **PROGRESSION CHECK:** Verify the track is unlocked for this user.
   - If the track is not in `completedTracks` AND is not the currently accessible track → return `403 LOCKED`.
   - Admin/instructor bypass.
5. Find all published questions for this track, sorted by `order`.
6. Determine the "current question order":
   - Find which questions in `progress.completedQuestions` belong to this track.
   - The current question order = `(count of completed questions in this track) + 1`.
7. Return:
   - Track metadata (title, description, theory, passingScore, xpReward)
   - The current question (ONLY ONE — not the full list)
   - Count of completed vs total questions
   - Whether the track is already completed

#### Response (200)
```json
{
  "success": true,
  "data": {
    "course": { "title": "...", "slug": "..." },
    "track": {
      "_id": "...",
      "title": "Control Flow",
      "slug": "control-flow",
      "description": "...",
      "theory": "# Control Flow in Java\n\n...",
      "passingScore": 80,
      "xpReward": 100,
      "totalQuestions": 4
    },
    "isCompleted": false,
    "currentQuestionOrder": 3,
    "completedQuestionsCount": 2,
    "percentComplete": 50,
    "nextTrackSlug": "arrays"
  }
}
```

---

### 4. Get Current Question

**Status:** 🔴 MUST BE CREATED (or merged into endpoint #3)

**`GET /api/learn/[courseSlug]/tracks/[trackSlug]/questions/current`**

Returns ONLY the current (next unsolved) question for the user in the given track.

#### Server-side logic
1. Call `requireRegisteredUser(request)`.
2. Verify enrollment and track unlock (same as endpoint #3).
3. Find all published questions for the track, sorted by `order`.
4. Find which questions the user has completed (correct submissions).
5. Return the FIRST question that is NOT in `completedQuestions[]`.
6. If ALL questions are completed → return `{ allCompleted: true }`.

#### Response (200) — Question available
```json
{
  "success": true,
  "data": {
    "question": {
      "_id": "...",
      "type": "mcq",
      "order": 3,
      "title": "What does a for-loop do?",
      "description": "...",
      "difficulty": "easy",
      "options": [
        { "id": "a", "text": "Iterates over a block" },
        { "id": "b", "text": "Declares a variable" },
        { "id": "c", "text": "Imports a module" }
      ],
      "hints": ["Think about repetition..."]
    },
    "questionNumber": 3,
    "totalQuestions": 4,
    "allCompleted": false,
    "previouslyAttempted": false,
    "previousAttempts": 0
  }
}
```

**Sanitization rules (for students):**
- `options[].isCorrect` → REMOVED
- `sampleAnswer` → REMOVED
- `rubric` → REMOVED
- `testCases` where `isHidden: true` → Only `{ id, isHidden: true, weight }` returned

#### Response (200) — All completed
```json
{
  "success": true,
  "data": {
    "question": null,
    "questionNumber": 4,
    "totalQuestions": 4,
    "allCompleted": true
  }
}
```

---

### 5. Submit Answer

**Status:** 🟡 EXISTS BUT NEEDS MAJOR CHANGES

**`POST /api/submissions`**

Submits a user's answer, evaluates it, and triggers all progression side effects.

**File:** `src/app/api/submissions/route.ts`

#### Request body
```json
{
  "questionId": "ObjectId string",
  "trackId": "ObjectId string",
  "courseId": "ObjectId string",
  "type": "mcq | multi-select | descriptive | coding",
  "selectedOptions": ["a", "c"],
  "descriptiveAnswer": "...",
  "code": "...",
  "language": "java"
}
```

#### Server-side logic (THE CRITICAL PATH)
1. Call `requireRegisteredUser(request)`.
2. Validate required fields (`questionId`, `trackId`, `courseId`, `type`).
3. Find the question. If not found → `404`.
4. **PROGRESSION GATE CHECK:**
   a. Find user's `Progress` for this `courseId`.
   b. Verify the track is unlocked for this user.
   c. Verify the question is the current question (its `order` equals the expected current order).
   d. If any check fails → `403 LOCKED` with descriptive message.
   e. Admin/instructor bypass.
5. Evaluate the answer:
   - **MCQ / Multi-select:** Compare `selectedOptions` with `options.filter(o => o.isCorrect).map(o => o.id)`. Order-independent comparison.
   - **Coding:** The `codingPassed` flag is currently trusted from the client. ⚠️ This should be validated server-side via test case execution.
   - **Descriptive:** Set `reviewStatus: "pending"`, `isCorrect: false`, `score: 0`, `xpEarned: 0`. Progression is blocked until manual review.
6. Prevent duplicate XP awards:
   - Check if the user ALREADY has a correct submission for this question.
   - If yes, `xpEarned = 0` for this submission (they already got XP).
7. Create `Submission` document.
8. **If `isCorrect === true` and this is the FIRST correct submission for this question:**
   a. Add `questionId` to `Progress.completedQuestions[]` (if not already there).
   b. Award `xpEarned` to `User.xp`.
   c. Update `User.level` via `calculateLevel(newXp)`.
   d. Evaluate and update streak via `evaluateStreak()`.
   e. Check: "Has the user now completed ALL published questions in this track?"
      - If YES → **Complete the track** (see step 9).
   f. Recalculate `Progress.percentComplete`.
9. **Track completion (if all questions done):**
   a. Add `trackId` to `Progress.completedTracks[]`.
   b. Award `track.xpReward` to `User.xp`.
   c. Log `ActivityLog` with `action: "track_complete"`.
   d. Check: "Has the user now completed ALL tracks in the current difficulty level?"
      - If YES → **Complete the difficulty level** (see step 10).
   e. Otherwise, set `Progress.currentTrackId` to the next track in the same difficulty.
10. **Difficulty level completion (if all tracks done):**
    a. Add the difficulty string to `Progress.completedLevels[]`.
    b. Determine the next difficulty level.
    c. If a next level exists → set `Progress.currentTrackId` to the first track of the next level.
    d. If this was the last difficulty level → **Complete the course** (see step 11).
11. **Course completion:**
    a. Set `Progress.isCompleted = true`, `Progress.completedAt = Date.now()`.
    b. Generate `Certificate` document.
    c. Set `Progress.certificateId`.
    d. Log `ActivityLog` with `action: "course_complete"`.
12. Update `Progress.lastActiveAt = Date.now()`.
13. Log `ActivityLog` with `action: "question_attempt"`.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "score": 100,
    "xpEarned": 10,
    "explanation": "A for-loop iterates over a block of code...",
    "submissionId": "...",
    "progressUpdate": {
      "trackCompleted": false,
      "levelCompleted": false,
      "courseCompleted": false,
      "nextQuestionOrder": 4,
      "percentComplete": 62.5
    }
  }
}
```

---

### 6. Get Dashboard Progress (Continue Learning)

**Status:** 🟡 EXISTS BUT NEEDS ENHANCEMENT

**`GET /api/dashboard`**

Returns the user's active course progress for the dashboard "Continue Where You Left Off" section.

#### Response (200)
```json
{
  "success": true,
  "data": {
    "activeCourses": [
      {
        "courseId": "...",
        "courseTitle": "Java Programming",
        "courseSlug": "java-programming",
        "percentComplete": 37.5,
        "currentLevel": "beginner",
        "currentTrack": {
          "title": "Control Flow",
          "slug": "control-flow"
        },
        "currentQuestionOrder": 3,
        "lastActiveAt": "2026-03-28T12:00:00Z"
      }
    ],
    "completedCourses": [
      {
        "courseId": "...",
        "courseTitle": "Python Basics",
        "certificateId": "LJQ-CERT-xxxx",
        "completedAt": "2026-03-15T10:00:00Z"
      }
    ]
  }
}
```

---

### 7. Review Descriptive Submission (Instructor/Admin)

**Status:** 🔴 MUST BE CREATED

**`PATCH /api/submissions/[submissionId]/review`**

Allows an instructor or admin to review a descriptive submission and pass/reject it.

#### Request body
```json
{
  "reviewStatus": "reviewed | rejected",
  "score": 85,
  "reviewFeedback": "Good explanation but could be more detailed."
}
```

#### Server-side logic
1. Call `requireAdmin(request)` or check `role === "instructor"`.
2. Find the submission. If not found → `404`.
3. If `submission.type !== "descriptive"` → `400 VALIDATION_ERROR`.
4. Update the submission:
   ```
   reviewStatus: body.reviewStatus
   reviewedBy: admin._id
   reviewFeedback: body.reviewFeedback
   reviewedAt: Date.now()
   score: body.score
   ```
5. If `reviewStatus === "reviewed"` and `score >= track.passingScore`:
   - Set `submission.isCorrect = true`.
   - Set `submission.xpEarned = question.xpReward`.
   - **Trigger all progression side effects** (steps 8–11 from endpoint #5).
6. If `reviewStatus === "rejected"`:
   - Set `submission.isCorrect = false`. User must resubmit.

---

## Endpoints That Already Exist (No Changes Needed)

| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /api/courses` | `src/app/api/courses/route.ts` | List all published courses |
| `GET /api/courses/[slug]` | `src/app/api/courses/[slug]/route.ts` | Get single course detail |
| `GET /api/questions?trackId=...` | `src/app/api/questions/route.ts` | Get questions for a track (⚠️ but needs progression gating) |
| `GET /api/leaderboard` | `src/app/api/leaderboard/route.ts` | Global leaderboard |
| `GET /api/users/[id]` | `src/app/api/users/route.ts` | User profile |
| `POST /api/auth/register` | `src/app/api/auth/route.ts` | User registration |
| `GET /api/certificates/[id]` | `src/app/api/certificates/route.ts` | Certificate verification |

---

## Security Invariants

These are the server-side security rules that must NEVER be violated:

1. **Never trust the client for correctness evaluation.** The `codingPassed` flag in the current submission endpoint is a security hole. Code execution results must be verified server-side.

2. **Never send locked question data to the client.** Locked questions should not even appear in API responses for students.

3. **Always validate progression state on submission.** A malicious client could try to submit answers to questions they haven't unlocked. The server must verify the question order matches the expected current order.

4. **Always validate enrollment.** Before any learn/ route, verify the user has a `Progress` document for the course.

5. **Always sanitize question data.** Use `sanitizeQuestionForRole()` from `src/lib/question-visibility.ts` before returning question data to students. Never expose `isCorrect` on options or hidden test case details.

6. **Never award XP twice.** Check for existing correct submissions before awarding XP.
