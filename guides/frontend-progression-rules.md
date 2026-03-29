# Frontend Progression Rules

> **Purpose:** Defines exactly how the frontend must render locked/unlocked/completed states, enforce the one-question-at-a-time UX, handle edge cases, and prevent unauthorized navigation within the progression system.

---

## 1. Core Rendering Principle

> **The frontend is a REFLECTION of the server's progression state, not the source of truth.**

The client must never independently decide what content to show. Every piece of progression data (lock states, current question, completed tracks) comes from the API. The frontend's job is to render what the API tells it and prevent user actions that would violate the progression rules.

---

## 2. Course Overview Page (`/courses/[slug]`)

This page is **publicly accessible** (no auth required for viewing).

### What to display

| Element | Behavior |
|---------|----------|
| Course title, description, thumbnail | Always visible |
| Difficulty levels section | Show all 3 levels (beginner, intermediate, advanced) as a visual roadmap |
| Track listing per level | Show track titles, but with lock/unlock indicators based on auth state |
| "Enroll" button | Shown when user is NOT enrolled |
| "Continue Learning" button | Shown when user IS enrolled (links to their current track) |
| Enrollment count, rating | Always visible |

### Lock state rendering (when NOT enrolled)
- All tracks show a lock icon
- A tooltip or message says: "Enroll to start learning"

### Lock state rendering (when enrolled)
- Depends on the API response from `GET /api/learn/[courseSlug]/tracks`
- Each track should display one of three visual states (see §4 below)

---

## 3. Learning Dashboard Page (`/dashboard`)

### "Continue Learning" Card

When the user has active (non-completed) courses, show a card per course:

```
┌──────────────────────────────────────────────────┐
│  📚 Java Programming                             │
│  ──────────────────────────────────────────────── │
│  [████████████░░░░░░░░░] 62.5% Complete          │
│                                                   │
│  Current: Control Flow (Question 3 of 4)         │
│  Level: Beginner                                  │
│                                                   │
│  [Continue Learning →]                            │
└──────────────────────────────────────────────────┘
```

The "Continue Learning" button must link directly to:
`/learn/[courseSlug]/tracks/[currentTrackSlug]/quiz`

NOT to the tracks listing — take them straight to where they left off.

---

## 4. Track Listing Page (`/learn/[courseSlug]`)

Displays all tracks organized by difficulty level. The API returns data structured as `levels → tracks`.

### Visual States for Difficulty Levels

| State | Visual Treatment |
|-------|-----------------|
| `locked` | Grayed out section. Title visible but all tracks show lock icons. A pill badge says "Complete [previous level] to unlock". |
| `in-progress` | Full color. Active tracks are interactive. A progress indicator shows "X of Y tracks completed". |
| `completed` | Full color with a green checkmark badge. All tracks show green check. A pill badge says "Completed ✓". |

### Visual States for Individual Tracks

| State | Visual Treatment |
|-------|-----------------|
| `locked` | Card has `opacity: 0.5`. Lock icon overlay. NOT clickable. `cursor: not-allowed`. Title visible but description truncated. |
| `in-progress` | Full color card. Pulsing dot or "In Progress" badge. Clickable → navigates to track theory page. Shows "X/Y questions completed". |
| `completed` | Full color card. Green checkmark badge. Clickable (for review). Shows "Completed ✓". |

### Important: No Client-Side Lock Bypass

- Locked tracks must use both visual indicators AND actual navigation prevention.
- Do NOT render a `<Link>` for locked tracks. Use a `<div>` or `<button disabled>` instead.
- Even if a user manually navigates to `/learn/[courseSlug]/tracks/[lockedTrackSlug]`, the API will return a `403 LOCKED` error, and the page should show the "Track Locked" interstitial (already implemented in the codebase).

---

## 5. Track Theory Page (`/learn/[courseSlug]/tracks/[trackSlug]`)

**File:** `src/app/learn/[courseSlug]/tracks/[trackSlug]/page.tsx`

This page shows the track's theory content (markdown lesson) and a button to start the assessment.

### Current behavior (already implemented)
- Fetches track data from API
- Shows theory content via `ReactMarkdown`
- Shows "Start Assessment" button
- Shows "Track Locked" interstitial if API returns locked
- Shows sidebar with passing criteria, XP reward, and completion status

### Required changes
- The "Start Assessment" button should show the question count: **"Start Assessment (4 questions)"**
- If the user has partially completed the track, the button should say: **"Continue Assessment (2 of 4 remaining)"**
- Add a progress indicator showing completed questions count

---

## 6. Quiz/Assessment Page (`/learn/[courseSlug]/tracks/[trackSlug]/quiz`)

This is the core progression UI — it must implement the one-question-at-a-time pattern.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [← Back]   Control Flow   [Question 3 of 4]   [63%]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Progress: [██████████████░░░░░░░░]  3/4 completed     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │                                                   │  │
│  │  Question Component (MCQ / Multi-Select /         │  │
│  │  Descriptive / Coding)                            │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [Submit Answer]                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Behavior rules

1. **Fetch only the current question.** Call `GET /api/learn/.../questions/current` on mount.
2. **Never show all questions at once.** The user sees only one question at a time.
3. **After submission:**
   - Call `POST /api/submissions` with the answer.
   - If `isCorrect: true`:
     - Show a success animation and the explanation.
     - Show a "Next Question →" button.
     - Clicking "Next Question" fetches the next current question from the API.
   - If `isCorrect: false`:
     - Show a failure message with the explanation.
     - Show a "Try Again" button that resets the form but keeps the same question.
     - Do NOT advance to the next question.
4. **When all questions are completed (`allCompleted: true`):**
   - Show a "Track Complete! 🎉" celebration screen.
   - Display XP earned, track badge, etc.
   - Show a "Continue to Next Track →" button (if next track exists and is unlocked).
   - Show a "Level Complete! 🎉" celebration if the level was completed.
   - Show a "Course Complete! 🎓" celebration if the course was completed.
5. **Descriptive question pending review:**
   - After submitting a descriptive answer, show:
     ```
     ┌──────────────────────────────────────┐
     │  ⏳ Submitted for Review             │
     │                                      │
     │  Your answer has been submitted and  │
     │  is awaiting instructor review.      │
     │                                      │
     │  You'll be notified when the review  │
     │  is complete.                        │
     │                                      │
     │  [Return to Track Overview]          │
     └──────────────────────────────────────┘
     ```
   - The "Next Question" button is disabled/hidden until the review is complete.

### Question Components

The existing question components are in `src/components/assessment/`:

| Component | File | Status |
|-----------|------|--------|
| MCQ | `mcq-question.tsx` | 🟡 Exists, needs integration |
| Multi-select | Handled by `mcq-question.tsx` | 🟡 Same component |
| Descriptive | `descriptive-question.tsx` | 🟡 Exists, needs integration |
| Coding | `coding-question.tsx` | 🟡 Exists, needs integration |

Each component should:
- Accept the question data as props
- Manage its own local form state (selected options, typed code, etc.)
- Expose an `onSubmit(answer)` callback
- Be disabled after a correct submission (prevent re-submission for XP)
- Show a loading state during submission

---

## 7. Completion Celebrations

### Track Completion
```
┌─────────────────────────────────────────┐
│          🎉 Track Complete!             │
│                                         │
│    ✅ Control Flow                      │
│    You answered all 4 questions!        │
│                                         │
│    +100 XP earned                       │
│                                         │
│    [Continue to "Arrays" →]             │
└─────────────────────────────────────────┘
```

### Level Completion
```
┌─────────────────────────────────────────┐
│       🏆 Beginner Level Complete!       │
│                                         │
│    You've mastered all beginner tracks. │
│    Intermediate level is now unlocked!  │
│                                         │
│    ┌─── Completed ──────────────────┐   │
│    │ ✅ Variables & Data Types      │   │
│    │ ✅ Control Flow                │   │
│    │ ✅ Arrays                      │   │
│    └────────────────────────────────┘   │
│                                         │
│    [Start Intermediate →]               │
└─────────────────────────────────────────┘
```

### Course Completion
```
┌─────────────────────────────────────────┐
│      🎓 Course Complete!                │
│                                         │
│    Congratulations! You've mastered     │
│    Java Programming.                    │
│                                         │
│    Certificate ID: LJQ-CERT-xxxx        │
│    [View Certificate]  [Share]          │
│                                         │
│    [Return to Dashboard]                │
└─────────────────────────────────────────┘
```

---

## 8. Navigation Guards

### Client-side route protection

These routes require authentication:
- `/learn/*` — All learning content
- `/dashboard` — User dashboard
- `/profile/*` — User profile

If the user is not authenticated, redirect to `/login`.

### Progression route protection

These routes require enrollment:
- `/learn/[courseSlug]/tracks/*` — Track content and quiz

If the user is not enrolled, redirect to `/courses/[slug]` (the course overview page).

### Current implementation note

The current `AuthContext.tsx` at `src/contexts/AuthContext.tsx` handles Firebase auth state. Route protection should use this context plus a middleware or wrapper component that checks `Progress` existence for learn routes.

---

## 9. Loading and Error States

### Loading states
- Use `Loader2` spinner from Lucide (already in use)
- Show skeleton loaders for track listings and question content
- Never flash a "Track Locked" screen while data is loading

### Error states

| Error | UI Response |
|-------|-------------|
| `401 UNAUTHORIZED` | Redirect to `/login` |
| `403 LOCKED` | Show "Track Locked" interstitial with back button |
| `403 NOT_ENROLLED` | Redirect to `/courses/[slug]` with "Enroll" CTA |
| `404 NOT_FOUND` | Show "Content Not Found" page |
| `500 INTERNAL_ERROR` | Show "Something went wrong" with retry button |

---

## 10. Real-time Progress Updates

After each successful submission, the UI should update these elements WITHOUT a full page refresh:

1. **Progress bar** at the top of the quiz page (e.g., 2/4 → 3/4)
2. **Question counter** (Question 3 of 4 → Question 4 of 4)
3. **XP counter** (if visible in the navbar)
4. **Track status** in the sidebar (if visible)

Use optimistic updates where safe (increment counter locally), but always reconcile with the API response.
