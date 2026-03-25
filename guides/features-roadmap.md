# 🗺️ Features Roadmap

> Full feature roadmap for LJ CodeQuest, organized by development phase — from foundation to advanced features.

---

## Phase Overview

| Phase | Title | Status | Scope |
|-------|-------|--------|-------|
| **Phase 1** | Foundation & Project Setup | ✅ Complete | Project init, UI, landing page |
| **Phase 2** | Database Schema & Auth | 🔲 Planned | MongoDB models, Firebase Auth |
| **Phase 3** | Admin Dashboard | 🔲 Planned | Course/question management |
| **Phase 4** | User Dashboard & Learning | 🔲 Planned | Progress tracking, enrollment |
| **Phase 5** | Assessment Engine | 🔲 Planned | Quizzes, coding challenges |
| **Phase 6** | Certificates & Profiles | 🔲 Planned | PDF certs, public profiles |
| **Phase 7** | Advanced Features | 🔲 Planned | AI, streaks, optimizations |

---

## Phase 1: Foundation & Project Setup ✅

> **Goal:** Establish the project foundation, design system, and a premium landing page.

### Completed Features

- [x] **Next.js 15 + TypeScript** — App Router project initialization
- [x] **Tailwind CSS v4** — Utility-first styling with CSS-first configuration
- [x] **Shadcn UI** — 11 accessible components installed (button, card, badge, avatar, dialog, dropdown-menu, progress, separator, sheet, tabs, tooltip)
- [x] **Dark/Light Theme** — `next-themes` integration with dark mode as default
- [x] **Premium Landing Page**
  - Hero section with animated gradient background and CTAs
  - Features showcase with icons and micro-animations
  - Animated stats counters (500+ Challenges, 50+ Tracks, 10K+ Users)
  - Track preview cards (Java, Python, JavaScript, etc.)
  - Final call-to-action section
- [x] **Responsive Navigation** — Glassmorphism navbar with mobile hamburger menu (Shadcn Sheet)
- [x] **Footer** — Minimal footer with navigation links and branding
- [x] **MongoDB Stub** — Connection utility with caching (`src/lib/db.ts`)
- [x] **Firebase Stub** — Client SDK initialization (`src/lib/firebase.ts`)
- [x] **Environment Configuration** — `.env.example` with all required variables
- [x] **Project Documentation** — `guides/` folder with comprehensive documentation
- [x] **Typography** — Inter (body) + JetBrains Mono (code) via `next/font`
- [x] **SEO** — Meta tags, Open Graph, keywords, semantic HTML

---

## Phase 2: Database Schema & Auth 🔲

> **Goal:** Implement the data layer and user authentication system.

### Planned Features

- [ ] **MongoDB Schemas** — Mongoose models for all 7 collections
  - [ ] User model with gamification fields (XP, badges, streak)
  - [ ] Course model with tracks reference array
  - [ ] Track model with ordering and progression rules
  - [ ] Question model (MCQ, multi-select, descriptive, coding)
  - [ ] Submission model with test results
  - [ ] Progress model with track-level tracking
  - [ ] Certificate model with unique verification IDs
- [ ] **Firebase Authentication**
  - [ ] Google Sign-In provider
  - [ ] GitHub Sign-In provider
  - [ ] Email/Password sign-in
  - [ ] Firebase Admin SDK setup (server-side token verification)
- [ ] **Auth Middleware** — Protect API routes and pages based on authentication/role
- [ ] **Protected Routes** — Redirect unauthenticated users to login
- [ ] **User Profile API** — CRUD endpoints for user profile management
- [ ] **Auth UI Components**
  - [ ] Login page with provider buttons
  - [ ] Registration page
  - [ ] Auth context/hook (`useAuth`)

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth Provider | Firebase Auth | Battle-tested, multiple providers, free tier |
| Session Strategy | Firebase ID tokens | Stateless, easy server-side verification |
| User Storage | MongoDB (mirror Firebase) | Rich user profiles beyond what Firebase stores |
| Role Management | MongoDB `role` field | Flexible, queryable, supports future roles |

---

## Phase 3: Admin Dashboard 🔲

> **Goal:** Build a full admin panel for content and user management.

### Planned Features

- [ ] **Admin Layout**
  - [ ] Sidebar navigation with collapsible sections
  - [ ] Admin header with user avatar and quick actions
  - [ ] Dashboard home with KPI stat cards
- [ ] **Course Management**
  - [ ] List all courses with search, filter, sort
  - [ ] Create/edit course form (title, description, difficulty, language, tags)
  - [ ] Publish/unpublish toggle
  - [ ] Delete course with cascade (tracks, questions)
  - [ ] Thumbnail upload
- [ ] **Track Management**
  - [ ] List tracks within a course (drag-to-reorder)
  - [ ] Create/edit track form (title, theory, passing score, XP)
  - [ ] Rich text editor for theory content (Markdown)
  - [ ] Publish/unpublish toggle
- [ ] **Question Bank Management**
  - [ ] List questions with type/difficulty filters
  - [ ] MCQ creator (options, correct answer, explanation)
  - [ ] Multi-select creator (multiple correct answers)
  - [ ] Descriptive question creator (sample answer, rubric, word limit)
  - [ ] Coding challenge creator (starter code, test cases, limits)
  - [ ] Question preview mode
  - [ ] Batch import/export (JSON/CSV)
- [ ] **User Management**
  - [ ] List all users with role filters
  - [ ] View user details and activity
  - [ ] Change user roles (student → instructor → admin)
  - [ ] Ban/suspend users
- [ ] **Submission Review**
  - [ ] Queue for pending descriptive submissions
  - [ ] Review form with scoring and feedback
  - [ ] Bulk review actions

---

## Phase 4: User Dashboard & Learning 🔲

> **Goal:** Create the student-facing learning experience with strict mastery progression.

### Planned Features

- [ ] **User Dashboard**
  - [ ] Welcome banner with streak and XP summary
  - [ ] Enrolled courses with progress bars
  - [ ] Recent activity feed
  - [ ] Quick stats (courses completed, certificates earned, global rank)
  - [ ] Continue learning CTA (resume where you left off)
- [ ] **Course Browsing**
  - [ ] Course catalog with advanced filtering (language, difficulty, tags)
  - [ ] Course detail page (description, tracks list, enrollment CTA)
  - [ ] Search with fuzzy matching
- [ ] **Course Enrollment**
  - [ ] One-click enrollment
  - [ ] Enrollment confirmation with first track unlocked
- [ ] **Track Learning View**
  - [ ] Theory/lesson content display (Markdown rendered)
  - [ ] Progress indicator (questions completed / total)
  - [ ] Navigation between questions
- [ ] **Strict Mastery Progression**
  - [ ] Track locking — must complete previous track to access next
  - [ ] Minimum passing score required (configurable per track)
  - [ ] Retry mechanism with attempt tracking
  - [ ] Visual lock/unlock indicators
- [ ] **Gamification System**
  - [ ] XP earning on question completion and track completion
  - [ ] Level calculation based on total XP
  - [ ] Badge system
    - [ ] First Course Completed
    - [ ] Perfect Score
    - [ ] 7-Day Streak
    - [ ] 30-Day Streak
    - [ ] Speed Demon (complete track under time)
    - [ ] Polyglot (complete courses in 3+ languages)
  - [ ] XP/Badge notification popups
  - [ ] Achievement showcase on profile

### Gamification Formula

```
Level = floor(sqrt(XP / 100)) + 1

XP Sources:
  - MCQ correct answer:           10 XP
  - Multi-select correct:         15 XP
  - Descriptive (reviewed):       20-50 XP (based on score)
  - Coding challenge solved:      25-100 XP (based on difficulty)
  - Track completion:             100 XP (bonus)
  - Course completion:            500 XP (bonus)
  - Daily streak bonus:           5 XP × streak_day
```

---

## Phase 5: Assessment Engine 🔲

> **Goal:** Build the quiz engine and code execution sandbox for all assessment types.

### Planned Features

- [ ] **MCQ Quiz Engine**
  - [ ] Single-select question rendering
  - [ ] Instant feedback with correct/incorrect indication
  - [ ] Explanation reveal after answering
  - [ ] Attempt tracking and scoring
- [ ] **Multi-Select Engine**
  - [ ] Checkbox-based multi-answer questions
  - [ ] Partial scoring (proportional to correct selections)
  - [ ] Visual feedback for each option
- [ ] **Descriptive Answer Submission**
  - [ ] Rich text input area with word counter
  - [ ] Submission with "pending review" status
  - [ ] Review status tracking (pending → reviewed)
  - [ ] View reviewer feedback
- [ ] **Coding Challenge Interface**
  - [ ] Monaco Editor integration
    - [ ] Syntax highlighting per language
    - [ ] Code autocompletion
    - [ ] Theme matching (dark/light)
    - [ ] Customizable font size
  - [ ] Language selector dropdown
  - [ ] Code execution via Piston API
  - [ ] Test case panel
    - [ ] Visible test cases with input/expected output
    - [ ] Hidden test cases (shown as "Hidden Test #1")
    - [ ] Run individual test cases
    - [ ] Run all tests
  - [ ] Execution results panel
    - [ ] stdout/stderr display
    - [ ] Pass/fail per test case
    - [ ] Execution time and memory usage
    - [ ] Compilation error display
  - [ ] Submit solution (final submission with all tests)
- [ ] **Test Case Validation System**
  - [ ] Input/output comparison (exact match)
  - [ ] Whitespace-tolerant comparison option
  - [ ] Timeout handling (per-question configurable)
  - [ ] Memory limit enforcement
  - [ ] Runtime error capture

### Supported Languages (via Piston)

| Language | Version | File Extension |
|----------|---------|----------------|
| Java | 15.0.2 | `.java` |
| Python | 3.10.0 | `.py` |
| JavaScript | Node 18.15.0 | `.js` |
| TypeScript | 5.0.3 | `.ts` |
| C | GCC 10.2.0 | `.c` |
| C++ | GCC 10.2.0 | `.cpp` |
| Go | 1.16.2 | `.go` |
| Rust | 1.68.2 | `.rs` |
| Ruby | 3.0.1 | `.rb` |
| PHP | 8.2.3 | `.php` |

---

## Phase 6: Certificates & Profiles 🔲

> **Goal:** Auto-generate verifiable certificates and build public user profiles.

### Planned Features

- [ ] **Certificate Generation**
  - [ ] Auto-trigger on course completion (all tracks passed)
  - [ ] Unique certificate ID format: `LJCQ-YYYY-XXXX`
  - [ ] PDF generation with premium template
    - [ ] User name, course name, completion date
    - [ ] QR code linking to verification page
    - [ ] Digital signature / brand watermark
  - [ ] Download as PDF
  - [ ] Share on LinkedIn / social media
- [ ] **Certificate Verification Page**
  - [ ] Public URL: `/verify/[certificateId]`
  - [ ] Display certificate details (name, course, date)
  - [ ] Visual "Verified ✅" / "Invalid ❌" indicator
  - [ ] No authentication required
- [ ] **Public User Profiles**
  - [ ] Public URL: `/profile/[username]`
  - [ ] Profile header (avatar, name, bio, social links)
  - [ ] Stats showcase (XP, level, courses completed, rank)
  - [ ] Badges gallery
  - [ ] Completed courses with certificates
  - [ ] Activity heatmap (GitHub-style)
  - [ ] Privacy toggle (public/private profile)
- [ ] **Global Leaderboard**
  - [ ] Leaderboard page: `/leaderboard`
  - [ ] Ranking by XP (all-time, monthly, weekly)
  - [ ] Search for specific users
  - [ ] Top 3 highlight with special styling
  - [ ] User's own rank shown prominently

---

## Phase 7: Advanced Features 🔲

> **Goal:** Polish the platform with AI capabilities, engagement tools, and performance optimization.

### Planned Features

- [ ] **AI Code Review & Hints**
  - [ ] Integration with OpenAI/Google Gemini API
  - [ ] "Get AI Hint" button on coding challenges
  - [ ] Progressive hints (Hint 1 → Hint 2 → Hint 3)
  - [ ] AI-powered code review after submission
    - [ ] Code quality feedback
    - [ ] Optimization suggestions
    - [ ] Best practices recommendations
  - [ ] Rate-limited to prevent abuse (e.g., 5 hints/day for free users)
- [ ] **Daily Streak Tracking**
  - [ ] Visual streak counter on dashboard
  - [ ] Streak calendar (GitHub-style heatmap)
  - [ ] Streak milestones (7-day, 30-day, 100-day)
  - [ ] Streak recovery (1 free "freeze" per week)
  - [ ] Push notification reminders (optional)
- [ ] **Responsive Design Polish**
  - [ ] Mobile-first assessment experience
  - [ ] Tablet-optimized code editor layout
  - [ ] Touch-friendly question navigation
  - [ ] PWA support (offline theory access)
- [ ] **Performance Optimization**
  - [ ] Image optimization (next/image, WebP, lazy loading)
  - [ ] Server Component maximization (reduce client JS)
  - [ ] MongoDB query optimization (indexes, aggregation pipelines)
  - [ ] Edge caching for public pages
  - [ ] Code splitting and dynamic imports
  - [ ] Lighthouse score target: 90+ across all categories

---

## Future Considerations (Beyond Phase 7)

> Potential features for long-term development:

| Feature | Description |
|---------|-------------|
| **Team/Classroom Mode** | Instructors create private classrooms with custom courses |
| **Discussion Forums** | Per-course/track discussion threads |
| **Live Contests** | Timed coding competitions with live leaderboard |
| **Multi-language UI** | i18n support (Sinhala, Tamil, English) |
| **Mobile App** | React Native companion app |
| **API Marketplace** | Third-party integrations and webhooks |
| **Course Marketplace** | Community-created courses with review system |
| **Video Lessons** | Video content alongside text theory |
| **Pair Programming** | Real-time collaborative coding sessions |
| **Company Assessments** | Custom assessments for hiring (B2B feature) |

---

## Development Timeline (Estimated)

| Phase | Estimated Duration | Key Deliverables |
|-------|--------------------|------------------|
| Phase 1 ✅ | Complete | Landing page, design system, config stubs |
| Phase 2 | 1–2 weeks | Database models, Firebase Auth, protected routes |
| Phase 3 | 2–3 weeks | Full admin CRUD for courses, tracks, questions |
| Phase 4 | 2–3 weeks | User dashboard, enrollment, mastery progression |
| Phase 5 | 3–4 weeks | Quiz engine, Monaco Editor, Piston integration |
| Phase 6 | 1–2 weeks | PDF certificates, public profiles, leaderboard |
| Phase 7 | 2–3 weeks | AI hints, streaks, performance, responsive polish |

**Total Estimated Development Time:** 12–18 weeks
