# Progression System — Core Business Logic

> **This is the most important guide in the project.** Every feature, API route, and UI component must conform to the rules defined here. If you are an AI agent reading this, do NOT deviate from these rules under any circumstances.

---

## 1. Conceptual Overview

LJ CodeQuest uses a **strict mastery-based progression system** inspired by HackerRank. The philosophy is:

> **A student must prove mastery of the current material before being allowed to see or attempt anything ahead.**

There is no skipping, no peeking, no partial advancement. The system is intentionally rigid.

---

## 2. Content Hierarchy

The platform content is organized in a strict 4-level hierarchy:

```
Course
  └── Difficulty Level (beginner → intermediate → advanced)
        └── Track (ordered 1, 2, 3, …)
              └── Question (ordered 1, 2, 3, …)
```

### 2.1 Course

A **Course** is a top-level container (e.g., "Java Programming", "Python Fundamentals"). A course groups all its content by difficulty.

- Defined by `Course` model (`src/models/Course.ts`)
- Has a `difficulty` field — BUT this is currently a flat per-course value.

> **⚠️ CRITICAL DESIGN ISSUE:** The current `Course` model has a single `difficulty` field (one of `beginner | intermediate | advanced`). This means each course document represents a single difficulty level, NOT a multi-level course. The progression system requires courses to contain MULTIPLE difficulty levels. See the "Required Schema Changes" section below for the fix.

### 2.2 Difficulty Level

A **Difficulty Level** is a grouping within a course that segments tracks by difficulty.

- The canonical difficulty levels are: `beginner`, `intermediate`, `advanced` (in that strict order).
- Defined in `src/types/index.ts` as `CourseDifficulty`.
- The unlock order is always: `beginner → intermediate → advanced`. No exceptions.

### 2.3 Track

A **Track** is an individual topic/module within a difficulty level (e.g., "Variables & Data Types", "Control Flow").

- Defined by `Track` model (`src/models/Track.ts`)
- Has an `order` field (integer, 1-indexed) that defines its sequence within its parent.
- Has a `courseId` to link it to a Course.
- Has `isLocked` (boolean) and `passingScore` (number, percentage).
- **Unlock rule:** Track N+1 unlocks ONLY when Track N in the same difficulty level is completed.

### 2.4 Question

A **Question** is a single assessment item within a track.

- Defined by `Question` model (`src/models/Question.ts`)
- Has an `order` field (integer, 1-indexed) that defines its sequence within a track.
- Has a `trackId` to link it to a Track.
- Types: `mcq`, `multi-select`, `descriptive`, `coding`
- **Unlock rule:** Question N+1 is visible/accessible ONLY when Question N is successfully passed (submitted with `isCorrect: true`).

---

## 3. The Five Iron Rules of Progression

These rules are non-negotiable. Every API endpoint, every frontend component, and every database query must enforce these:

### Rule 1: Questions appear one at a time

Within a track, the user sees **only one question at a time** — the first unsolved question. All subsequent questions are completely hidden (not just disabled — they should not even be sent to the client).

**Implementation requirement:**
- The API must calculate which question is "current" by checking the user's `completedQuestions` in the `Progress` document.
- Only return questions where `order <= (highestCompletedOrder + 1)`.
- On first attempt (no completed questions), only question with `order: 1` is returned.

### Rule 2: A question must be passed to unlock the next

The user must submit a correct answer (one where `isCorrect === true` in the `Submission` document) to the current question before the next question becomes accessible.

**What counts as "passed":**
- `mcq` / `multi-select`: All correct options selected, no wrong options selected → `isCorrect: true`.
- `coding`: All test cases passed → `isCorrect: true`.
- `descriptive`: Manually reviewed and marked as `reviewStatus: "reviewed"` with a passing score ≥ `passingScore` of the track.

**What does NOT count as passed:**
- A submission with `isCorrect: false`.
- A descriptive submission still in `reviewStatus: "pending"`.
- A descriptive submission with `reviewStatus: "rejected"`.

### Rule 3: All questions in a track must be passed to complete the track

A track is considered "completed" when:
1. Every published question (`isPublished: true`) in that track has at least one submission where `isCorrect === true`.
2. The track's `_id` is added to `Progress.completedTracks[]`.

**Implementation requirement:**
- After each successful question submission, the server must check: "Has this user now passed ALL questions in this track?"
- If yes, add the `trackId` to `Progress.completedTracks[]`, log a `track_complete` activity, and award the track's `xpReward`.

### Rule 4: All tracks in the current difficulty level must be completed to unlock the next level

The difficulty levels unlock in strict order: `beginner → intermediate → advanced`.

**Unlock condition for the next difficulty level:**
1. Every track belonging to the current difficulty level has its `_id` in `Progress.completedTracks[]`.
2. Only then are tracks from the next difficulty level set to `isLocked: false` (or computed as unlocked on read).

**Implementation requirement:**
- The system must know which tracks belong to which difficulty level. This requires either:
  - (a) A `difficulty` field on the `Track` model, OR
  - (b) A restructured `Course` model that groups tracks by difficulty level.
- After completing a track, check if ALL tracks in the current difficulty are complete.
- If yes, surface the first track of the next difficulty level as "unlocked".

### Rule 5: The first item at every level is always unlocked

To prevent the user from being permanently locked out:
- The **first track** (order: 1) of the **first difficulty level** (beginner) is always unlocked upon enrollment.
- The **first question** (order: 1) of any unlocked track is always accessible.

This is the entry point into the progression chain.

---

## 4. State Machine

Every entity in the progression system has one of three states:

```
┌──────────┐      ┌─────────────┐      ┌───────────┐
│  LOCKED  │ ───► │ IN-PROGRESS │ ───► │ COMPLETED │
└──────────┘      └─────────────┘      └───────────┘
```

### Question States

| State | Condition |
|-------|-----------|
| `locked` | `question.order > currentQuestionOrder` — The user hasn't reached this question yet. It MUST NOT be sent to the client. |
| `in-progress` | `question.order === currentQuestionOrder` — This is the active question the user can attempt. |
| `completed` | A `Submission` with `isCorrect: true` exists for this question + user. |

### Track States

| State | Condition |
|-------|-----------|
| `locked` | The previous track (by `order`) in the same difficulty level has NOT been completed. OR the difficulty level itself is locked. |
| `in-progress` | The track is unlocked and the user has started but not completed all questions. |
| `completed` | All questions in the track are passed AND `trackId ∈ Progress.completedTracks[]`. |

### Difficulty Level States

| State | Condition |
|-------|-----------|
| `locked` | Not all tracks in the previous difficulty level are completed. |
| `in-progress` | At least one track is in-progress and not all are completed. |
| `completed` | All tracks in this difficulty level are completed. |

---

## 5. Required Schema Changes (Current → Target)

The current schema does not fully support the progression system. The following changes are required:

### 5.1 Track Model — Add `difficulty` field

**Current:** `Track` has `courseId` and `order`, but no `difficulty` field. There's no way to know which difficulty level a track belongs to.

**Required change:**
```typescript
// Add to Track model
difficulty: {
  type: String,
  enum: ["beginner", "intermediate", "advanced"],
  required: true,
  index: true
}
```

**Updated compound index:**
```typescript
trackSchema.index({ courseId: 1, difficulty: 1, order: 1 }, { unique: true });
```

This ensures that `order` is scoped per-difficulty-level within a course, not globally within a course.

### 5.2 Progress Model — Add `currentQuestionOrder` field

**Current:** `Progress` has `completedQuestions[]` (an array of ObjectIds). To find the current question, you must count completed questions per track — this is expensive.

**Recommended addition:**
```typescript
// Add to Progress model
currentTrackProgress: {
  trackId: { type: Schema.Types.ObjectId, ref: "Track" },
  currentQuestionOrder: { type: Number, default: 1 },
  totalQuestionsInTrack: { type: Number }
}
```

This cache avoids re-querying all questions + submissions on every request.

### 5.3 Progress Model — Add `completedLevels` field

**Recommended addition:**
```typescript
// Add to Progress model
completedLevels: [{ type: String, enum: ["beginner", "intermediate", "advanced"] }]
```

This provides a quick lookup for which difficulty levels the user has cleared без querying all tracks.

### 5.4 Course Model — Remove single `difficulty` field

**Current:** `Course.difficulty` is a single value. This contradicts the multi-level progression design.

**Required change:** Remove the `difficulty` field from `Course`. Difficulty is now a property of individual `Track` documents within the course.

---

## 6. Progression Flow — Step by Step

Here is the complete user journey through the progression system:

```
1. User enrolls in a Course
   → Progress document created with:
     - completedTracks: []
     - completedQuestions: []
     - completedLevels: []
     - currentTrackId: first Track (beginner, order: 1)
     - percentComplete: 0

2. User enters the first Track (beginner, order 1)
   → Track theory content is shown.
   → User clicks "Start Assessment".
   → API returns ONLY Question 1 (order: 1).

3. User answers Question 1
   → If WRONG: Show feedback, allow retry. Question 1 remains the active question.
   → If CORRECT:
     a. Create Submission (isCorrect: true)
     b. Add questionId to Progress.completedQuestions[]
     c. Check: "Is this the last question in the track?"
        → If NO: Advance to Question 2 (return it on next API call)
        → If YES: Mark track as completed (step 4)

4. Track is completed
   a. Add trackId to Progress.completedTracks[]
   b. Award track.xpReward to User.xp
   c. Log "track_complete" activity
   d. Check: "Are all tracks in this difficulty level completed?"
      → If NO: Unlock the next track in this difficulty level
      → If YES: Mark difficulty level as completed (step 5)

5. Difficulty level is completed
   a. Add difficulty string to Progress.completedLevels[]
   b. Unlock the first track (order: 1) of the NEXT difficulty level
   c. If this was the LAST difficulty level ("advanced"):
      → Mark course as completed (step 6)

6. Course is completed
   a. Set Progress.isCompleted = true
   b. Set Progress.completedAt = Date.now()
   c. Generate Certificate
   d. Set Progress.certificateId = certificate._id
   e. Award any "course completion" badges
   f. Log "course_complete" activity
```

---

## 7. Edge Cases and Rules

### 7.1 Re-attempts

- A user CAN re-attempt a question they've already passed (for practice), but it does NOT award additional XP.
- The `attemptNumber` field on `Submission` tracks how many times the user has attempted a question.
- Only the first correct submission matters for progression purposes.

### 7.2 Descriptive Questions and the Progression Gate

- Descriptive questions are a special case because they require manual review.
- A descriptive question in `reviewStatus: "pending"` blocks progression. The user cannot proceed to the next question until the review is complete and the status is `"reviewed"`.
- If the review results in `reviewStatus: "rejected"`, the student must resubmit.
- **UI implication:** When a descriptive question is pending review, show a "Waiting for Review" state and disable the "Next" button.

### 7.3 Empty Tracks / Unpublished Questions

- If a track has zero published questions (`isPublished: true`), it is automatically considered "completed" upon entry (there's nothing to answer).
- Unpublished questions (`isPublished: false`) are invisible to students and do NOT count toward track completion.

### 7.4 Admin/Instructor Override

- Users with `role: "admin"` or `role: "instructor"` bypass ALL progression locks. They can access any track and any question at any time.
- This allows content creators to preview and test their courses.
- The `canViewQuestionAnswers()` function in `src/lib/question-visibility.ts` already checks for this.

### 7.5 Enrollment Prerequisite

- A user MUST be enrolled in a course (i.e., a `Progress` document must exist for that user + course) before they can access any tracks or questions.
- Attempting to access the `/learn/[courseSlug]` route without enrollment should redirect to the course detail page with an "Enroll" button.

---

## 8. Percentage Calculation

The `Progress.percentComplete` field must be computed as:

```
percentComplete = (completedQuestions.length / totalPublishedQuestionsInCourse) × 100
```

Where `totalPublishedQuestionsInCourse` is the count of all questions across all tracks in the course where `isPublished: true`.

This gives a single 0–100 percentage for the entire course, not per-track.

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Course** | Top-level content container (e.g., "Java Programming"). |
| **Difficulty Level** | A tier within a course: beginner, intermediate, or advanced. |
| **Track** | An individual module/topic within a difficulty level. Has theory content and questions. |
| **Question** | A single assessment item (MCQ, multi-select, descriptive, or coding challenge). |
| **Submission** | A user's answer to a question. Contains the answer data and result (correct/incorrect). |
| **Progress** | A per-user, per-course document tracking enrollment, completed items, and percentage. |
| **Mastery** | The state achieved when a question is answered correctly (or a track/level is fully cleared). |
| **Gate** | An invisible barrier that prevents access to the next item until the current item is mastered. |
