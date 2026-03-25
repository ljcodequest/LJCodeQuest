# 🗄️ Database Schema

> Complete MongoDB schema design for all LJ CodeQuest collections — with field definitions, relationships, and index strategies.

---

## Schema Overview

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Users   │────▶│ Progress │◀────│   Courses    │
└──────────┘     └──────────┘     └──────────────┘
     │                                    │
     │           ┌──────────┐             │
     │──────────▶│Submissions│            │
     │           └──────────┘             │
     │                ▲             ┌──────────┐
     │                │             │  Tracks  │
     │           ┌──────────┐      └──────────┘
     │           │Questions │            │
     │           └──────────┘            │
     │                                   │
     │           ┌──────────────┐        │
     └──────────▶│ Certificates │◀───────┘
                 └──────────────┘
```

---

## Collections

### 1. Users

Stores registered user accounts, roles, and gamification data.

```typescript
{
  _id:              ObjectId,        // Auto-generated
  firebaseUid:      String,          // Firebase Auth UID (unique, indexed)
  email:            String,          // User email (unique, indexed)
  displayName:      String,          // Full name
  username:         String,          // Unique username (indexed)
  avatarUrl:        String,          // Profile picture URL
  bio:              String,          // Short bio (max 300 chars)

  // Role & Access
  role:             String,          // "student" | "admin" | "instructor"
                                     // Default: "student"

  // Gamification
  xp:               Number,          // Total experience points (default: 0)
  level:            Number,          // Calculated from XP (default: 1)
  badges:           [                // Earned badges
    {
      id:           String,          // Badge identifier
      name:         String,          // Display name
      description:  String,          // How it was earned
      earnedAt:     Date             // Date earned
    }
  ],
  streak: {
    current:        Number,          // Current daily streak (default: 0)
    longest:        Number,          // Longest streak ever (default: 0)
    lastActiveDate: Date             // Last day user was active
  },

  // Social
  github:           String,          // GitHub profile URL
  linkedin:         String,          // LinkedIn profile URL
  website:          String,          // Personal website URL
  isPublicProfile:  Boolean,         // Profile visibility (default: true)

  // Timestamps
  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `firebaseUid` — unique, sparse
- `email` — unique
- `username` — unique
- `xp` — descending (for leaderboard queries)

---

### 2. Courses

Top-level learning containers (e.g., "Java Fundamentals", "Python Mastery").

```typescript
{
  _id:              ObjectId,
  title:            String,          // Course name (required)
  slug:             String,          // URL-friendly slug (unique, indexed)
  description:      String,          // Rich text description
  shortDescription: String,          // One-liner for cards (max 160 chars)
  thumbnail:        String,          // Thumbnail image URL
  difficulty:       String,          // "beginner" | "intermediate" | "advanced"
  language:         String,          // Programming language (e.g., "Java")

  // Structure
  tracks:           [ObjectId],      // Ordered array of Track IDs (ref: Tracks)
  totalTracks:      Number,          // Cached count of tracks
  totalQuestions:   Number,          // Cached total questions across tracks

  // Metadata
  tags:             [String],        // Searchable tags
  isPublished:      Boolean,         // Visibility flag (default: false)
  enrollmentCount:  Number,          // Cached enrollment count (default: 0)
  averageRating:    Number,          // Cached avg rating (default: 0)

  // Author
  createdBy:        ObjectId,        // ref: Users (admin/instructor who created)

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `slug` — unique
- `language` — for filtering
- `isPublished` — for public queries
- `enrollmentCount` — descending (popular courses)

---

### 3. Tracks

Ordered learning modules within a course (e.g., "Variables & Data Types", "Control Flow").

```typescript
{
  _id:              ObjectId,
  courseId:          ObjectId,        // ref: Courses (indexed)
  title:            String,          // Track name (required)
  slug:             String,          // URL-friendly slug
  description:      String,          // Track overview
  order:            Number,          // Position within course (indexed)

  // Content
  theory:           String,          // Markdown/HTML lesson content
  questions:        [ObjectId],      // Ordered array of Question IDs (ref: Questions)
  totalQuestions:   Number,          // Cached count

  // Progression Rules
  passingScore:     Number,          // Minimum % to pass (default: 80)
  isLocked:         Boolean,         // Requires previous track completion (default: true)
  xpReward:         Number,          // XP earned on completion (default: 100)

  isPublished:      Boolean,         // Visibility flag (default: false)

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `courseId` + `order` — compound (unique within course)
- `slug` — for URL routing

---

### 4. Questions

Assessment items — supports 4 types: MCQ, multi-select, descriptive, and coding challenges.

```typescript
{
  _id:              ObjectId,
  trackId:          ObjectId,        // ref: Tracks (indexed)
  type:             String,          // "mcq" | "multi-select" | "descriptive" | "coding"
  order:            Number,          // Position within track

  // Common Fields
  title:            String,          // Question title/label
  description:      String,          // Full question text (Markdown)
  difficulty:       String,          // "easy" | "medium" | "hard"
  xpReward:         Number,          // XP for correct answer (default: 10)
  explanation:      String,          // Post-answer explanation

  // ── MCQ / Multi-select Fields ──
  options:          [                // Only for type: "mcq" | "multi-select"
    {
      id:           String,          // Option identifier (a, b, c, d...)
      text:         String,          // Option text
      isCorrect:    Boolean          // Whether this is a correct answer
    }
  ],

  // ── Descriptive Fields ──
  sampleAnswer:     String,          // Model answer for instructor review
  maxWords:         Number,          // Word limit (optional)
  rubric:           String,          // Grading rubric for review

  // ── Coding Challenge Fields ──
  starterCode:      String,          // Initial code template
  language:         String,          // Target language ("java", "python", etc.)
  testCases:        [                // Automated test cases
    {
      id:           String,          // Test case ID
      input:        String,          // stdin input
      expectedOutput: String,        // Expected stdout
      isHidden:     Boolean,         // Hidden from students (default: false)
      weight:       Number           // Score weight (default: 1)
    }
  ],
  timeLimit:        Number,          // Execution timeout in seconds (default: 10)
  memoryLimit:      Number,          // Memory limit in MB (default: 256)
  hints:            [String],        // Progressive hints array

  // Metadata
  tags:             [String],        // Searchable tags
  isPublished:      Boolean,         // Visibility flag (default: false)

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `trackId` + `order` — compound
- `type` — for filtering by question type
- `difficulty` — for filtering

---

### 5. Submissions

Records every answer attempt a user makes.

```typescript
{
  _id:              ObjectId,
  userId:           ObjectId,        // ref: Users (indexed)
  questionId:       ObjectId,        // ref: Questions (indexed)
  trackId:          ObjectId,        // ref: Tracks (indexed)
  courseId:          ObjectId,        // ref: Courses

  // Answer Data
  type:             String,          // "mcq" | "multi-select" | "descriptive" | "coding"
  selectedOptions:  [String],        // For MCQ/multi-select — selected option IDs
  descriptiveAnswer: String,         // For descriptive — user's text answer
  code:             String,          // For coding — submitted source code
  language:         String,          // For coding — programming language used

  // Results
  isCorrect:        Boolean,         // Overall correctness
  score:            Number,          // Score percentage (0-100)
  xpEarned:         Number,          // XP awarded for this submission

  // Coding-Specific Results
  testResults:      [
    {
      testCaseId:   String,          // ref: Question.testCases.id
      passed:       Boolean,         // Whether test passed
      actualOutput: String,          // Actual program output
      executionTime: Number,         // Time in ms
      memoryUsed:   Number,          // Memory in KB
      error:        String           // Runtime error (if any)
    }
  ],
  compilationError: String,          // Compilation error (if any)
  executionTime:    Number,          // Total execution time in ms

  // Descriptive-Specific
  reviewStatus:     String,          // "pending" | "reviewed" | "rejected"
  reviewedBy:       ObjectId,        // ref: Users (instructor/admin)
  reviewFeedback:   String,          // Reviewer's comments
  reviewedAt:       Date,

  // Metadata
  attemptNumber:    Number,          // Which attempt (1, 2, 3...)

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `userId` + `questionId` — compound (lookup user attempts)
- `userId` + `trackId` — compound (track progress)
- `reviewStatus` — for pending reviews queue
- `createdAt` — descending (recent submissions)

---

### 6. Progress

Tracks user progress through courses and tracks (denormalized for fast reads).

```typescript
{
  _id:              ObjectId,
  userId:           ObjectId,        // ref: Users (indexed)
  courseId:          ObjectId,        // ref: Courses (indexed)

  // Course-Level Progress
  enrolledAt:       Date,            // Enrollment timestamp
  status:           String,          // "enrolled" | "in-progress" | "completed"
  completionPercent: Number,         // 0-100 (cached)
  completedAt:      Date,            // Course completion timestamp

  // Track-Level Progress
  trackProgress:    [
    {
      trackId:      ObjectId,        // ref: Tracks
      status:       String,          // "locked" | "in-progress" | "completed"
      score:        Number,          // Overall track score (0-100)
      questionsCompleted: Number,    // Count of completed questions
      totalQuestions: Number,        // Total questions in track (cached)
      completedAt:  Date,            // Track completion timestamp
      attempts:     Number           // Total attempts on this track
    }
  ],

  // Rewards Earned
  totalXpEarned:    Number,          // Total XP from this course (default: 0)
  certificateId:    ObjectId,        // ref: Certificates (null if not earned)

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `userId` + `courseId` — compound unique
- `userId` — for user dashboard queries
- `status` — for filtering active enrollments

---

### 7. Certificates

Auto-generated certificates for course completion.

```typescript
{
  _id:              ObjectId,
  certificateId:    String,          // Unique public ID (e.g., "LJCQ-2024-XXXX") (indexed)
  userId:           ObjectId,        // ref: Users (indexed)
  courseId:          ObjectId,        // ref: Courses (indexed)

  // Certificate Info
  userName:         String,          // Name displayed on certificate (snapshot)
  courseName:       String,          // Course title (snapshot)
  issueDate:        Date,            // Date of issuance
  completionScore:  Number,          // Final course score (0-100)

  // Verification
  isValid:          Boolean,         // Can be revoked (default: true)
  verificationUrl:  String,          // Public verification page URL
  pdfUrl:           String,          // Generated PDF URL

  // Metadata
  templateVersion:  String,          // Certificate template version used

  createdAt:        Date,
  updatedAt:        Date
}
```

**Indexes:**
- `certificateId` — unique (for public verification)
- `userId` — for user profile
- `courseId` + `userId` — compound unique

---

## Relationship Summary

| From | To | Type | Field |
|------|----|------|-------|
| Course | Track | One-to-Many | `Course.tracks` → `Track._id` |
| Track | Question | One-to-Many | `Track.questions` → `Question._id` |
| Track | Course | Many-to-One | `Track.courseId` → `Course._id` |
| Question | Track | Many-to-One | `Question.trackId` → `Track._id` |
| Submission | User | Many-to-One | `Submission.userId` → `User._id` |
| Submission | Question | Many-to-One | `Submission.questionId` → `Question._id` |
| Progress | User | Many-to-One | `Progress.userId` → `User._id` |
| Progress | Course | Many-to-One | `Progress.courseId` → `Course._id` |
| Certificate | User | Many-to-One | `Certificate.userId` → `User._id` |
| Certificate | Course | Many-to-One | `Certificate.courseId` → `Course._id` |

---

## Design Principles

1. **Denormalization for Speed** — Progress and enrollment counts are cached to avoid expensive aggregation queries
2. **Snapshot Data** — Certificates store user/course names at issuance time (data doesn't change if names are edited later)
3. **Flexible Question Schema** — Single collection with `type` discriminator supports all assessment formats
4. **Ordered Content** — Tracks and questions use `order` fields for strict mastery progression
5. **Audit Trail** — Submissions are never deleted, maintaining a complete attempt history
6. **Soft References** — ObjectId references used for joins when detailed data is needed
