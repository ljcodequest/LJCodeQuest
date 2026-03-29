# Coding Standards

> **Purpose:** Project conventions that all code (human-written or AI-generated) must follow. These ensure consistency, type safety, and maintainability across the entire codebase.

---

## 1. File & Directory Naming

| Convention | Example |
|-----------|---------|
| Next.js route files | `page.tsx`, `layout.tsx`, `route.ts` (Next.js convention — lowercase) |
| React components | `PascalCase.tsx` — e.g., `McqQuestion.tsx` |
| Utility/lib files | `kebab-case.ts` — e.g., `question-visibility.ts` |
| Model files | `PascalCase.ts` — e.g., `Course.ts`, `Submission.ts` |
| Constants/types | `kebab-case.ts` or `index.ts` inside feature folder |
| CSS files | `kebab-case.css` or `globals.css` |

### Directory structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/            # Auth route group
│   ├── api/               # API routes
│   ├── courses/           # Course pages
│   ├── dashboard/         # Dashboard pages
│   ├── learn/             # Learning progression pages
│   ├── leaderboard/       # Leaderboard page
│   ├── profile/           # Profile pages
│   └── verify/            # Certificate verification
├── components/            # Reusable React components
│   ├── assessment/        # Question components (MCQ, coding, etc.)
│   ├── layout/            # Navbar, footer, sidebar
│   ├── profile/           # Profile-specific components
│   └── ui/                # Shadcn UI primitives
├── constants/             # Constants and enums
├── contexts/              # React context providers
├── lib/                   # Utility libraries and helpers
├── models/                # Mongoose model definitions
├── scripts/               # CLI scripts (seed, etc.)
└── types/                 # TypeScript type definitions
```

---

## 2. TypeScript Rules

### Strictness
- **Never use `any`** unless absolutely unavoidable. Use `unknown` and narrow types instead.
- Always define interfaces/types for:
  - API request bodies
  - API response data
  - Component props
  - Mongoose document interfaces

### Type patterns

```typescript
// ✅ GOOD — typed API body
interface SubmitAnswerBody {
  questionId: string;
  trackId: string;
  courseId: string;
  type: QuestionType;
  selectedOptions?: string[];
  descriptiveAnswer?: string;
  code?: string;
  language?: string;
}

const body = await readJsonBody<SubmitAnswerBody>(request);

// ❌ BAD — untyped
const body = await request.json();
```

### Model types
- Mongoose model interfaces extend `Document` and are prefixed with `I` — e.g., `IUser`, `ICourse`.
- These are defined in the model file itself, not in `types/index.ts`.
- `types/index.ts` is for shared type aliases and enums ONLY.

---

## 3. API Route Conventions

### Use the helpers from `src/lib/api.ts`

```typescript
// ✅ GOOD
import { apiSuccess, handleRouteError, requireObjectId } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    // ... business logic ...

    return apiSuccess(data, "Fetched successfully");
  } catch (error) {
    return handleRouteError(error);
  }
}

// ❌ BAD
export async function GET(request: Request) {
  const data = await something();
  return NextResponse.json({ success: true, data }); // ← inconsistent format
}
```

### API route structure

Every API route handler must follow this pattern:
1. Authenticate (`requireRegisteredUser` or `requireAdmin`)
2. Connect to DB (`await dbConnect()`)
3. Validate input (use helpers: `requireString`, `requireObjectId`, etc.)
4. Execute business logic
5. Return `apiSuccess(data)` or `apiPaginated(data, pagination)`
6. Catch errors with `handleRouteError(error)`

### Throwing errors

```typescript
// Use ApiRouteError for expected errors
throw new ApiRouteError(404, "NOT_FOUND", "Course not found");
throw new ApiRouteError(403, "LOCKED", "This track is locked. Complete the previous track first.");
throw new ApiRouteError(400, "VALIDATION_ERROR", "questionId is required");
```

---

## 4. Mongoose Conventions

### Connection
Always call `await dbConnect()` at the start of every API handler. The connection is cached in `src/lib/db.ts`.

### Queries
```typescript
// ✅ GOOD — use .lean() for read queries (returns plain objects, faster)
const courses = await CourseModel.find({ isPublished: true }).lean();

// ✅ GOOD — use explicit field selection when you don't need all fields
const track = await TrackModel.findOne({ slug: trackSlug })
  .select("title slug description order difficulty")
  .lean();

// ❌ BAD — loading full documents when you only need a few fields
const track = await TrackModel.findOne({ slug: trackSlug });
```

### Model exports
All models are barrel-exported from `src/models/index.ts`:
```typescript
import { CourseModel, TrackModel, QuestionModel, ProgressModel } from "@/models";
```

### Model naming convention
- The constant name in the model file can be the raw name (`Course`, `Track`, etc.)
- The index barrel export uses the `Model` suffix (`CourseModel`, `TrackModel`, etc.)
- Always import from the barrel export, NOT from individual model files:
  ```typescript
  // ✅ GOOD
  import { CourseModel } from "@/models";
  
  // ❌ BAD
  import { Course } from "@/models/Course";
  ```

---

## 5. React Component Conventions

### Component structure

```typescript
"use client"; // Only if the component uses hooks, event handlers, or browser APIs

import { useState, useEffect } from "react";

// External library imports
import { Loader2 } from "lucide-react";

// Internal imports (absolute paths)
import { Button } from "@/components/ui/button";

// Types
interface MyComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
}

export default function MyComponent({ title, onSubmit }: MyComponentProps) {
  // hooks
  // state
  // effects
  // handlers
  // render
}
```

### Import order
1. React imports
2. Next.js imports (`next/link`, `next/navigation`, `next/image`)
3. External library imports (lucide, react-markdown, etc.)
4. Internal `@/` imports — components, lib, models, types
5. Types (if separate)

### State management
- Use React `useState` for local component state.
- Use `AuthContext` for auth state.
- API data should be fetched in `useEffect` or via Next.js server components.
- No global state management library is used. Keep it simple.

---

## 6. Error Handling Patterns

### API Routes
```typescript
try {
  // ... logic
} catch (error) {
  return handleRouteError(error); // Always use this
}
```

### React Components
```typescript
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/...");
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Something went wrong");
        return;
      }
      setData(json.data);
    } catch (err) {
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

---

## 7. Constants and Enums

All enums are defined in `src/types/index.ts` as union types:
```typescript
export type CourseDifficulty = "beginner" | "intermediate" | "advanced";
```

All constant arrays (for validation and UI) are defined in `src/constants/index.ts`:
```typescript
export const COURSE_DIFFICULTIES = [
  "beginner", "intermediate", "advanced"
] as const satisfies readonly CourseDifficulty[];
```

### Difficulty level ordering

The canonical ordering of difficulty levels is always:
```typescript
const DIFFICULTY_ORDER: CourseDifficulty[] = ["beginner", "intermediate", "advanced"];
```

This ordering must be used when:
- Sorting tracks by difficulty
- Determining the "next" difficulty level
- Rendering difficulty level tabs/sections

---

## 8. Authentication Patterns

### API Routes
```typescript
// For endpoints requiring any logged-in user
const context = await requireRegisteredUser(request);
const userId = context.user._id;
const userRole = context.role;

// For endpoints requiring admin access
const context = await requireAdmin(request);

// For endpoints where auth is optional (e.g., public course listing)
const context = await getAuthContext(request); // context.user may be null
```

### Frontend
```typescript
"use client";
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <Spinner />;
  if (!user) redirect("/login");
  
  // ... authenticated content
}
```

---

## 9. Git Commit Conventions

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructuring without behavior change |
| `docs:` | Documentation changes |
| `style:` | Formatting, whitespace, no code logic change |
| `chore:` | Tooling, dependencies, config |
| `test:` | Adding or modifying tests |

Example: `fix: prevent duplicate XP awards on re-submission`

---

## 10. Performance Guidelines

1. **Always use `.lean()`** for Mongoose read queries when you don't need Mongoose document methods.
2. **Use field projection** (`.select()`) to only return needed fields.
3. **Add compound indexes** for queries that filter on multiple fields.
4. **Avoid N+1 queries** — use `.populate()` or batch queries instead of looping.
5. **Cache computed values** in the Progress model (e.g., `percentComplete`, `currentTrackProgress`) to avoid recomputing on every request.
6. **On the frontend** — debounce inputs, use `React.memo` for expensive renders, lazy-load heavy components (Monaco Editor).
