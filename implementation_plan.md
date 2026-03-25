# LJ CodeQuest — E-Learning & Coding Assessment Platform

An advanced e-learning and coding assessment platform (inspired by HackerRank) with strict mastery progression, multiple assessment types (MCQ, multi-select, descriptive, coding challenges), automated certificates, gamification, and code execution sandbox.

## User Review Required

> [!IMPORTANT]
> **This is a large-scale project.** Due to the scope, I'll implement it in **Phase 1 (Foundation)** first — initializing the project, setting up the full tech stack, theme system, landing page, and base navigation. Subsequent phases (Auth, Admin, Assessments, etc.) will follow in future conversations. This plan covers **Phase 1 only**.

> [!WARNING]
> **Firebase Configuration Required:** You will need to create a Firebase project and provide the configuration keys (API Key, Auth Domain, Project ID, etc.) as environment variables. I'll set up placeholder `.env.local` entries for you to fill in.

> [!WARNING]
> **MongoDB Required:** You need a MongoDB Atlas cluster (or local MongoDB instance). The connection string goes into `.env.local`.

---

## Proposed Changes

### Phase 1 Scope — Foundation & Project Setup

---

### 1. Next.js Project Initialization

#### [NEW] [Project Root](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest)

- Initialize Next.js 15 with TypeScript via `npx -y create-next-app@latest ./`
- App Router, TypeScript, ESLint, Tailwind CSS v4, `src/` directory, import alias `@/*`

---

### 2. Shadcn UI Setup

#### [NEW] [components.json](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/components.json)

- Initialize Shadcn UI with `npx -y shadcn@latest init`
- Install core components: `button`, `card`, `badge`, `avatar`, `dropdown-menu`, `sheet`, `separator`, `tooltip`, `progress`, `tabs`, `dialog`

---

### 3. Theme System (Dark/Light Mode)

#### [NEW] [theme-provider.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/components/theme-provider.tsx)

- `next-themes` integration for dark/light mode toggling
- Dark mode as default theme (developer-centric)

#### [NEW] [theme-toggle.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/components/theme-toggle.tsx)

- Toggle button component using Shadcn + Lucide icons

---

### 4. Design System & Global Styles

#### [MODIFY] [globals.css](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/app/globals.css)

- Custom CSS variables for the LJ CodeQuest brand palette
- Futuristic, premium color scheme (deep navy/dark backgrounds, electric blue/cyan accents, vibrant gradients)
- Custom typography with Google Fonts (Inter, JetBrains Mono for code)
- Base animation utilities (fade-in, slide-up, glow effects)

---

### 5. Base Layout & Navigation

#### [MODIFY] [layout.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/app/layout.tsx)

- Root layout with ThemeProvider, Google Fonts, SEO meta tags
- Brand name: **LJ CodeQuest**

#### [NEW] [navbar.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/components/layout/navbar.tsx)

- Responsive top navigation with glassmorphism effect
- Logo + brand name, nav links (Explore, Leaderboard, Challenges)
- Auth buttons (Sign In / Sign Up) — placeholder for Phase 2
- Mobile hamburger menu with Shadcn Sheet
- Theme toggle

#### [NEW] [footer.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/components/layout/footer.tsx)

- Minimal footer with links and branding

---

### 6. Landing Page (Hero + Features)

#### [MODIFY] [page.tsx](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/app/page.tsx)

- **Hero Section**: Bold headline, tagline, animated gradient background, CTA buttons ("Get Started", "Explore Tracks")
- **Features Section**: Cards showcasing key features (Coding Challenges, Certificates, Leaderboard, AI Hints) with icons and micro-animations
- **Stats Section**: Animated counters (e.g., "500+ Challenges", "50+ Tracks", "10K+ Users")
- **Tracks Preview**: Cards showing sample coding tracks (Java, Python, JavaScript, etc.)
- **CTA Section**: Final call-to-action with gradient background

---

### 7. MongoDB & Firebase Configuration Files

#### [NEW] [lib/db.ts](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/lib/db.ts)

- MongoDB/Mongoose connection utility with connection caching

#### [NEW] [lib/firebase.ts](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/src/lib/firebase.ts)

- Firebase app initialization & auth export (client-side)

#### [NEW] [.env.local](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/.env.local)

- Placeholder environment variables for MongoDB URI, Firebase config keys

---

### 8. Project Documentation

#### [NEW] [guides/README.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/README.md)

- Project overview, architecture, and guide index

#### [NEW] [guides/project-structure.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/project-structure.md)

- Detailed folder structure explanation

#### [NEW] [guides/tech-stack.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/tech-stack.md)

- Technology stack documentation & rationale

#### [NEW] [guides/database-schema.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/database-schema.md)

- Full MongoDB schema design for all collections (Users, Courses, Tracks, Questions, Submissions, Certificates, Progress)

#### [NEW] [guides/api-reference.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/api-reference.md)

- API endpoint documentation (placeholder for future routes)

#### [NEW] [guides/features-roadmap.md](file:///Users/lahiruharshana/Document/MY/LJ%20CodeQuest/guides/features-roadmap.md)

- Full feature roadmap across all phases

---

## Verification Plan

### Automated Tests

1. **Dev Server Boot**: Run `npm run dev` and verify the server starts without errors at `http://localhost:3000`
2. **Build Check**: Run `npm run build` to ensure no TypeScript or build errors
3. **Lint Check**: Run `npm run lint` to verify code quality

### Browser Verification

1. **Landing Page**: Open `http://localhost:3000` and verify:
   - Hero section renders with gradient background and CTA buttons
   - Features section displays cards with icons
   - Stats section shows animated counters
   - Theme toggle switches between dark and light mode
   - Navigation is responsive (test mobile hamburger menu)
   - All animations are smooth
2. **Page Performance**: Verify fast page load, no layout shifts

### Manual Verification

1. **After Phase 1 completes**: You (the user) should:
   - Open the dev server in your browser
   - Verify the landing page design meets your aesthetic expectations
   - Toggle between dark/light mode
   - Test the responsive layout on different screen widths
   - Fill in your Firebase & MongoDB credentials in `.env.local`
   - Let me know if the design direction needs any adjustments before Phase 2
