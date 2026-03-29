# Known Bugs, Bad Practices, and Missing Features

> **Purpose:** An honest, exhaustive audit of everything wrong or incomplete in the current codebase that must be addressed to make the progression system work correctly. Each item is categorized by severity.

---

## Severity Legend

| Severity | Meaning |
|----------|---------|
| 🔴 **CRITICAL** | Blocks the progression system from working at all. Must fix before anything else. |
| 🟠 **HIGH** | Major bug or bad practice that will cause incorrect behavior in production. |
| 🟡 **MEDIUM** | Functional but fragile, inconsistent, or hard to maintain. Should fix. |
| 🟢 **LOW** | Minor quality issue, code smell, or enhancement opportunity. |

---

## Schema & Data Model Issues

### BUG-001 — 🔴 Course model has single `difficulty` field

**File:** `src/models/Course.ts` (line 9, line 30)

**Problem:** `Course.difficulty` is a single enum value (`"beginner" | "intermediate" | "advanced"`). This means each Course document represents ONE difficulty level, not a multi-level progression course.

The progression system requires a course to span ALL difficulty levels. Users progress beginner → intermediate → advanced WITHIN the same course.

**Fix:** Remove the `difficulty` field from `Course`. Instead, add a `difficulty` field to `Track` so that each track is tagged with its difficulty level. See `progression-system.md` §5.4.

---

### BUG-002 — 🔴 Track model is missing `difficulty` field

**File:** `src/models/Track.ts`

**Problem:** There is no way to determine which difficulty level a track belongs to. The `Track` model only has `courseId` and `order`, making it impossible to group tracks by beginner/intermediate/advanced.

**Fix:** Add `difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], required: true, index: true }` to the Track schema. Update the compound index to `{ courseId: 1, difficulty: 1, order: 1 }`.

---

### BUG-003 — 🟠 Progress model missing `completedLevels` tracking

**File:** `src/models/Progress.ts`

**Problem:** There's no efficient way to know which difficulty levels a user has completed. You'd have to query all tracks for the course, group by difficulty, and compare against `completedTracks[]` — expensive for every API call.

**Fix:** Add `completedLevels: [{ type: String, enum: ["beginner", "intermediate", "advanced"] }]` to `Progress`.

---

### BUG-004 — 🟡 `Track.isLocked` is a static boolean

**File:** `src/models/Track.ts` (line 31)

**Problem:** `isLocked` is stored as a static boolean on the track document. This doesn't work for per-user progression — a track might be locked for User A but unlocked for User B. The lock state must be computed at runtime based on the user's `Progress`.

**Impact:** If the admin sets `isLocked: false` on a track, it's unlocked for ALL users regardless of their progress.

**Fix:** Keep `isLocked` as a DEFAULT value for new users, but always compute the actual lock state per-user in API responses. Never trust the static `isLocked` value for progression gating.

---

### BUG-005 — 🟡 `Submission.courseId` is optional

**File:** `src/models/Submission.ts` (line 7, line 49)

**Problem:** `courseId` is optional on Submission. Without it, you can't efficiently query "all submissions for a course" to calculate course-level progress.

**Fix:** Make `courseId` required. The submission endpoint already receives `trackId`, so it can look up the track's `courseId` if the client doesn't send it.

---

## API Issues

### BUG-006 — 🔴 Submission endpoint has NO progression side effects

**File:** `src/app/api/submissions/route.ts`

**Problem:** The current `POST /api/submissions` endpoint:
- ✅ Creates a submission
- ✅ Awards XP
- ✅ Logs activity
- ❌ Does NOT add the question to `Progress.completedQuestions[]`
- ❌ Does NOT check if the track is now complete
- ❌ Does NOT check if the difficulty level is now complete
- ❌ Does NOT check if the course is now complete
- ❌ Does NOT generate certificates
- ❌ Does NOT validate that the question is the current one (progression gate check)

**Impact:** This completely breaks the progression system. Users could submit answers to any question in any order. No tracks or levels would ever be marked as complete.

**Fix:** Implement the full submission flow described in `progression-api-contract.md` endpoint #5.

---

### BUG-007 — 🔴 No enrollment endpoint exists

**Problem:** There is no `POST /api/courses/[slug]/enroll` endpoint. Without enrollment, no `Progress` document is created, and the entire progression system has no starting point.

**Fix:** Create the endpoint as specified in `progression-api-contract.md` endpoint #1.

---

### BUG-008 — 🟠 Questions endpoint returns ALL questions to students

**File:** `src/app/api/questions/route.ts` (line 32)

**Problem:** `GET /api/questions?trackId=...` returns ALL published questions for a track in a single response, sorted by order. There is NO check for which question the user is currently on.

**Impact:** This violates Rule 1 of the progression system (questions appear one at a time). A student can see all questions by inspecting the network tab.

**Fix:** Either:
1. Modify this endpoint to only return completed + current questions, OR
2. Create a new dedicated endpoint (`GET /api/learn/.../questions/current`) and restrict this one to admin/instructor only.

---

### BUG-009 — 🟠 Submission endpoint trusts client-sent `codingPassed` flag

**File:** `src/app/api/submissions/route.ts` (line 14, lines 41-47)

**Problem:** The client sends a `codingPassed` boolean, and the server blindly trusts it:
```typescript
if (codingPassed) {
   isCorrect = true;
   score = 100;
   xpEarned = question.xpReward || 50;
}
```

A malicious user can send `"codingPassed": true` for any coding question and get full marks without running any code.

**Fix:** The server should execute the test cases against the submitted code using the code execution service (the `src/app/api/execute` endpoint exists). The `codingPassed` flag should be determined server-side based on test results.

---

### BUG-010 — 🟠 No duplicate XP prevention in submissions

**File:** `src/app/api/submissions/route.ts` (lines 73-77)

**Problem:** If a user submits a correct answer to the same question multiple times, XP is awarded every time:
```typescript
if (xpEarned > 0) {
   await UserModel.findByIdAndUpdate(context.user._id, {
      $inc: { xp: xpEarned }
   });
}
```

There's no check for whether the user already has a correct submission for this question.

**Fix:** Before awarding XP, check:
```typescript
const existingCorrectSubmission = await SubmissionModel.findOne({
  userId: user._id,
  questionId,
  isCorrect: true
});
if (existingCorrectSubmission) {
  xpEarned = 0; // Already got XP for this question
}
```

---

### BUG-011 — 🟠 No progression gate check on submission

**File:** `src/app/api/submissions/route.ts`

**Problem:** The submission endpoint does NOT verify that:
1. The user is enrolled in the course.
2. The track is unlocked for this user.
3. The question is the CURRENT question (matching expected order).

A user could submit answers to any question, in any track, in any order.

**Fix:** Add progression validation before processing the submission. See `progression-api-contract.md` endpoint #5, step 4.

---

### BUG-012 — 🟡 User level not recalculated after XP change

**File:** `src/app/api/submissions/route.ts` (lines 73-77)

**Problem:** After awarding XP, the `User.level` field is not recalculated. The `calculateLevel()` function exists in `src/lib/gamification.ts` but is never called in the submission flow.

**Fix:** After updating XP, recalculate and set the level:
```typescript
const updatedUser = await UserModel.findByIdAndUpdate(user._id, { $inc: { xp: xpEarned } }, { new: true });
const newLevel = calculateLevel(updatedUser.xp);
if (newLevel !== updatedUser.level) {
  await UserModel.findByIdAndUpdate(user._id, { level: newLevel });
}
```

---

### BUG-013 — 🟡 Streak not updated on submission

**File:** `src/app/api/submissions/route.ts`

**Problem:** The `evaluateStreak()` function exists in `src/lib/gamification.ts` but is never called in the submission flow. The user's streak is never updated.

**Fix:** Call `evaluateStreak(user.streak)` after each submission and update the user's streak fields if `shouldUpdate` is true.

---

## Frontend Issues

### BUG-014 — 🟠 Track theory page has a permanently "locked" assessment badge

**File:** `src/app/learn/[courseSlug]/tracks/[trackSlug]/page.tsx` (lines 193-199)

**Problem:** The sidebar always shows "Assessment Locked — Read the theory before attempting the questions" for non-completed tracks. But there's no actual mechanism to determine if the user has "read" the theory. The assessment link (`/quiz`) is always clickable regardless.

**Impact:** Confusing UX — it says "Locked" but the "Start Assessment" button is clickable and works.

**Fix:** Either:
1. Remove the "Assessment Locked" text (since the assessment is always available once the track is unlocked), OR
2. Implement a "mark theory as read" feature and actually gate the quiz behind it.

Recommended: Option 1. Keep it simple — if the track is unlocked, the assessment is available.

---

### BUG-015 — 🟡 Hardcoded redirect to `/dashboard` on API error

**File:** `src/app/learn/[courseSlug]/tracks/[trackSlug]/page.tsx` (line 37)

**Problem:** On any API error that isn't "Unauthorized" or "Locked", the page redirects to `/dashboard`. This is a bad UX — the user gets no error message and doesn't know what happened.

**Fix:** Show an error state with a descriptive message and a "Go Back" button instead of silently redirecting.

---

### BUG-016 — 🟡 No quiz page component exists

**Directory:** `src/app/learn/[courseSlug]/tracks/[trackSlug]/quiz/`

**Problem:** The quiz subdirectory exists but needs verification that a proper one-question-at-a-time quiz page is implemented. The theory page links to `/quiz` but the quiz page may be incomplete.

**Fix:** Implement the quiz page as specified in `frontend-progression-rules.md` §6.

---

### BUG-017 — 🟢 Assessment components exist but are not integrated

**Files:** 
- `src/components/assessment/mcq-question.tsx`
- `src/components/assessment/descriptive-question.tsx`
- `src/components/assessment/coding-question.tsx`

**Problem:** These components exist but their integration with the progression system needs to be verified. They should:
- Receive question data from the quiz page
- Submit answers via the submission endpoint
- Handle success/failure states
- Disable after a correct submission

---

## Code Quality Issues

### BUG-018 — 🟡 Error handling uses `error.message` directly

**File:** `src/app/api/submissions/route.ts` (line 96)

**Problem:** The catch block returns `error.message` directly:
```typescript
return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
```

This can leak internal error messages to the client. Also, if `error` is not an instance of Error, accessing `.message` could throw.

**Fix:** Use the `handleRouteError()` function from `src/lib/api.ts` which properly wraps errors:
```typescript
} catch (error) {
  return handleRouteError(error);
}
```

---

### BUG-019 — 🟡 Inconsistent API response format in submissions

**File:** `src/app/api/submissions/route.ts`

**Problem:** The submissions endpoint uses inline `NextResponse.json()` instead of the standard `apiSuccess()` / `apiError()` helpers from `src/lib/api.ts`. Every other endpoint uses the helpers.

**Fix:** Refactor to use `apiSuccess()` and `handleRouteError()` for consistency.

---

### BUG-020 — 🟡 `any` types used extensively

**Files:** Multiple

**Problem:** Several places use `any` type, defeating TypeScript's safety:
- `src/app/api/submissions/route.ts` — `body` is untyped after `request.json()`
- `src/app/learn/[courseSlug]/tracks/[trackSlug]/page.tsx` — `data` state is `any`
- `src/app/api/submissions/route.ts` line 29 — `(opt: any)`
- `src/models/Certificate.ts` line 8 — `metadata?: any`

**Fix:** Define proper TypeScript interfaces for all API request/response bodies. Use the `readJsonBody<T>()` helper with Zod validation.

---

### BUG-021 — 🟢 `models/index.ts` inconsistent naming

**File:** `src/models/index.ts`

**Problem:** Export names are inconsistent:
```typescript
export { CertificateModel } from "@/models/Certificate";  // "Model" suffix
export { Course as CourseModel } from "@/models/Course";   // aliased
export { ActivityLogModel } from "@/models/ActivityLog";    // not exported here
```

`ActivityLogModel` is imported directly from its file in `submissions/route.ts` instead of from the index.

**Fix:** Export all models from `index.ts` with consistent naming. Add `ActivityLogModel` to the barrel export.

---

## Missing Features (Required for Progression System)

| # | Feature | Priority | Guide Reference |
|---|---------|----------|-----------------|
| MF-001 | Enrollment endpoint (`POST /api/courses/[slug]/enroll`) | 🔴 Critical | `progression-api-contract.md` §1 |
| MF-002 | Progression-aware track listing endpoint | 🔴 Critical | `progression-api-contract.md` §2 |
| MF-003 | Current-question-only endpoint | 🔴 Critical | `progression-api-contract.md` §4 |
| MF-004 | Submission progression side effects (track/level/course completion) | 🔴 Critical | `progression-api-contract.md` §5 |
| MF-005 | Descriptive submission review endpoint | 🟠 High | `progression-api-contract.md` §7 |
| MF-006 | Quiz page (one-question-at-a-time UI) | 🔴 Critical | `frontend-progression-rules.md` §6 |
| MF-007 | Track/Level/Course completion celebrations | 🟡 Medium | `frontend-progression-rules.md` §7 |
| MF-008 | Certificate generation on course completion | 🟡 Medium | `progression-system.md` §6, step 6 |
| MF-009 | `difficulty` field on Track model | 🔴 Critical | `data-model-reference.md` §3 |
| MF-010 | `completedLevels` field on Progress model | 🟠 High | `data-model-reference.md` §6 |
| MF-011 | Server-side code execution validation for coding questions | 🟠 High | BUG-009 |
| MF-012 | Seed script for progression-compatible course structure | 🟡 Medium | — |

---

## Fix Priority Order

To get the progression system working end-to-end, address issues in this order:

### Phase A: Schema Fixes (Do First)
1. BUG-001 — Remove `Course.difficulty`
2. BUG-002 — Add `Track.difficulty`
3. BUG-003 — Add `Progress.completedLevels`
4. BUG-005 — Make `Submission.courseId` required
5. MF-012 — Update seed script for new schema

### Phase B: Core API (Do Second)
6. MF-001 — Create enrollment endpoint
7. BUG-006 + MF-004 — Rebuild submission endpoint with full progression logic
8. BUG-010 — Add duplicate XP prevention
9. BUG-011 — Add progression gate checks
10. BUG-012 — Recalculate user level
11. BUG-013 — Update streak
12. MF-003 — Create current-question endpoint
13. MF-002 — Create progression-aware track listing

### Phase C: Frontend (Do Third)
14. MF-006 — Build quiz page
15. BUG-008 — Restrict questions endpoint
16. BUG-014 — Fix assessment locked badge
17. MF-007 — Add celebrations

### Phase D: Polish (Do Last)
18. BUG-009 — Server-side code execution validation
19. MF-005 — Descriptive review endpoint
20. MF-008 — Certificate generation
21. BUG-018, BUG-019, BUG-020, BUG-021 — Code quality fixes
