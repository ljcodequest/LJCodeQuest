# 🔌 API Reference

> Complete RESTful API endpoint documentation for LJ CodeQuest — organized by resource. All endpoints use the Next.js App Router API route convention (`src/app/api/`).

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

## Authentication

Most endpoints require a valid Firebase ID token passed as a Bearer token:

```
Authorization: Bearer <firebase-id-token>
```

**Role-based access:**
- 🔓 **Public** — No authentication required
- 🔐 **Auth** — Requires valid Firebase token
- 🛡️ **Admin** — Requires admin role

---

## Response Format

All responses follow a consistent JSON structure:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 1. Authentication

### `POST /api/auth/register`

Register a new user after Firebase authentication.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `POST` |

**Request Body:**
```json
{
  "firebaseUid": "abc123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "avatarUrl": "https://..."
}
```

**Response:** `201 Created` — User object

---

### `GET /api/auth/me`

Get current authenticated user's profile.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — User object

---

### `PUT /api/auth/me`

Update current user's profile.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `PUT` |

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "bio": "Full-stack developer",
  "github": "https://github.com/username",
  "isPublicProfile": true
}
```

**Response:** `200 OK` — Updated user object

---

## 2. Courses

### `GET /api/courses`

List all published courses.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `language` | string | — | Filter by programming language |
| `difficulty` | string | — | `beginner`, `intermediate`, `advanced` |
| `search` | string | — | Search by title/description |
| `sort` | string | `enrollmentCount` | Sort field |

**Response:** `200 OK` — Paginated array of courses

---

### `GET /api/courses/[slug]`

Get a single course by slug with its tracks.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Response:** `200 OK` — Course object with populated tracks

---

### `POST /api/courses`

Create a new course.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `POST` |

**Request Body:**
```json
{
  "title": "Java Fundamentals",
  "description": "Learn the basics of Java...",
  "shortDescription": "Master Java from scratch",
  "difficulty": "beginner",
  "language": "Java",
  "tags": ["java", "fundamentals", "oop"]
}
```

**Response:** `201 Created` — Course object

---

### `PUT /api/courses/[id]`

Update an existing course.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `PUT` |

**Response:** `200 OK` — Updated course object

---

### `DELETE /api/courses/[id]`

Delete a course and all associated data.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `DELETE` |

**Response:** `200 OK` — Confirmation message

---

## 3. Tracks

### `GET /api/tracks?courseId=<id>`

List tracks for a specific course.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `courseId` | string | ✅ | Filter by course ID |

**Response:** `200 OK` — Array of tracks (ordered)

---

### `GET /api/tracks/[id]`

Get a track with its questions.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Track with populated questions

---

### `POST /api/tracks`

Create a new track within a course.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `POST` |

**Request Body:**
```json
{
  "courseId": "64a...",
  "title": "Variables & Data Types",
  "description": "Learn about Java variables...",
  "theory": "# Variables in Java\n...",
  "order": 1,
  "passingScore": 80,
  "xpReward": 100
}
```

**Response:** `201 Created` — Track object

---

### `PUT /api/tracks/[id]`

Update an existing track.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `PUT` |

**Response:** `200 OK` — Updated track object

---

### `DELETE /api/tracks/[id]`

Delete a track.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `DELETE` |

**Response:** `200 OK` — Confirmation message

---

## 4. Questions

### `GET /api/questions?trackId=<id>`

List questions for a specific track.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `trackId` | string | ✅ | Filter by track ID |
| `type` | string | — | `mcq`, `multi-select`, `descriptive`, `coding` |

**Response:** `200 OK` — Array of questions (answers hidden for students)

---

### `GET /api/questions/[id]`

Get a single question with full details.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Question object (correct answers hidden for students, visible for admins)

---

### `POST /api/questions`

Create a new question.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `POST` |

**Request Body (MCQ example):**
```json
{
  "trackId": "64a...",
  "type": "mcq",
  "title": "Which keyword declares a variable in Java?",
  "description": "Select the correct keyword...",
  "difficulty": "easy",
  "xpReward": 10,
  "options": [
    { "id": "a", "text": "var", "isCorrect": false },
    { "id": "b", "text": "int", "isCorrect": true },
    { "id": "c", "text": "variable", "isCorrect": false },
    { "id": "d", "text": "define", "isCorrect": false }
  ],
  "explanation": "In Java, primitive types like int, double... are used."
}
```

**Request Body (Coding example):**
```json
{
  "trackId": "64a...",
  "type": "coding",
  "title": "Two Sum",
  "description": "Given an array of integers...",
  "difficulty": "medium",
  "xpReward": 50,
  "starterCode": "public class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // your code here\n  }\n}",
  "language": "java",
  "testCases": [
    {
      "id": "tc1",
      "input": "2 7 11 15\n9",
      "expectedOutput": "0 1",
      "isHidden": false,
      "weight": 1
    }
  ],
  "timeLimit": 10,
  "memoryLimit": 256,
  "hints": ["Think about using a HashMap", "Store each number's index"]
}
```

**Response:** `201 Created` — Question object

---

### `PUT /api/questions/[id]`

Update a question.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `PUT` |

**Response:** `200 OK` — Updated question object

---

### `DELETE /api/questions/[id]`

Delete a question.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `DELETE` |

**Response:** `200 OK` — Confirmation message

---

## 5. Submissions

### `POST /api/submissions`

Submit an answer to a question.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `POST` |

**Request Body (MCQ):**
```json
{
  "questionId": "64a...",
  "type": "mcq",
  "selectedOptions": ["b"]
}
```

**Request Body (Coding):**
```json
{
  "questionId": "64a...",
  "type": "coding",
  "code": "public class Solution { ... }",
  "language": "java"
}
```

**Response:** `200 OK` — Submission result with correctness, score, XP earned, and test results (for coding)

---

### `GET /api/submissions?questionId=<id>`

Get user's submissions for a question.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Array of submissions

---

### `GET /api/submissions/[id]`

Get a single submission with full details.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Submission object

---

### `PUT /api/submissions/[id]/review`

Review a descriptive submission (instructor/admin).

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `PUT` |

**Request Body:**
```json
{
  "score": 85,
  "reviewFeedback": "Good explanation, but could include edge cases.",
  "reviewStatus": "reviewed"
}
```

**Response:** `200 OK` — Updated submission

---

## 6. Progress & Enrollment

### `POST /api/progress/enroll`

Enroll in a course.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `POST` |

**Request Body:**
```json
{
  "courseId": "64a..."
}
```

**Response:** `201 Created` — Progress object

---

### `GET /api/progress?courseId=<id>`

Get user's progress for a course.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Progress object with track-level details

---

### `GET /api/progress/dashboard`

Get user's overall dashboard data (all enrolled courses, stats, streak).

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Dashboard data object

---

## 7. Certificates

### `GET /api/certificates`

Get user's earned certificates.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `GET` |

**Response:** `200 OK` — Array of certificates

---

### `GET /api/certificates/verify/[certificateId]`

Public certificate verification.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Response:** `200 OK` — Certificate details (name, course, date, validity)

---

### `POST /api/certificates/generate`

Generate a certificate after course completion (triggered automatically or manually).

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `POST` |

**Request Body:**
```json
{
  "courseId": "64a..."
}
```

**Response:** `201 Created` — Certificate object with PDF URL

---

## 8. Leaderboard

### `GET /api/leaderboard`

Get global leaderboard data.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `50` | Items per page |
| `period` | string | `all-time` | `weekly`, `monthly`, `all-time` |

**Response:** `200 OK` — Paginated leaderboard entries

---

## 9. Users (Admin)

### `GET /api/users`

List all users (admin panel).

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `GET` |

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `role` | string | — | Filter by role |
| `search` | string | — | Search by name/email |

**Response:** `200 OK` — Paginated array of users

---

### `PUT /api/users/[id]/role`

Update a user's role.

| Detail | Value |
|--------|-------|
| **Access** | 🛡️ Admin |
| **Method** | `PUT` |

**Request Body:**
```json
{
  "role": "instructor"
}
```

**Response:** `200 OK` — Updated user

---

### `GET /api/users/[username]/profile`

Get a user's public profile.

| Detail | Value |
|--------|-------|
| **Access** | 🔓 Public |
| **Method** | `GET` |

**Response:** `200 OK` — Public profile data (courses completed, badges, XP, certificates)

---

## 10. Code Execution

### `POST /api/execute`

Execute code in a sandboxed environment via Piston API.

| Detail | Value |
|--------|-------|
| **Access** | 🔐 Auth |
| **Method** | `POST` |

**Request Body:**
```json
{
  "language": "java",
  "version": "15.0.2",
  "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello\"); } }",
  "stdin": "input data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stdout": "Hello\n",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 125,
    "memoryUsed": 32768
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `TRACK_LOCKED` | 403 | Previous track not completed |
| `ALREADY_ENROLLED` | 409 | User already enrolled in course |
| `COURSE_NOT_COMPLETED` | 400 | Certificate requires course completion |
| `EXECUTION_TIMEOUT` | 408 | Code exceeded time limit |
| `EXECUTION_ERROR` | 500 | Code execution failed |
| `INTERNAL_ERROR` | 500 | Server error |
