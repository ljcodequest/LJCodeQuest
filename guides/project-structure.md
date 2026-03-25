# 📁 Project Structure

> Complete breakdown of the LJ CodeQuest folder structure and the purpose of every directory and key file.

---

## Root Directory

```
LJ CodeQuest/
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore rules
├── AGENTS.md                 # AI agent configuration rules
├── README.md                 # Project README (default Next.js)
├── components.json           # Shadcn UI configuration
├── eslint.config.mjs         # ESLint configuration (flat config)
├── implementation_plan.md    # Project implementation plan
├── next.config.ts            # Next.js configuration
├── next-env.d.ts             # Next.js TypeScript declarations
├── package.json              # Dependencies & scripts
├── package-lock.json         # Dependency lock file
├── postcss.config.mjs        # PostCSS configuration (Tailwind)
├── tsconfig.json             # TypeScript configuration
│
├── guides/                   # 📚 Project documentation
├── public/                   # Static assets
└── src/                      # Application source code
```

---

## `src/` — Application Source Code

The core application code lives here, following Next.js 15 App Router conventions.

```
src/
├── app/                      # Next.js App Router pages & layouts
│   ├── globals.css           # Global styles, CSS variables, animations
│   ├── layout.tsx            # Root layout (fonts, theme, navbar, footer)
│   ├── page.tsx              # Landing page (hero, features, stats, CTA)
│   └── favicon.ico           # App favicon
│
├── components/               # Reusable React components
│   ├── layout/               # Layout components
│   │   ├── navbar.tsx        # Top navigation bar with glassmorphism
│   │   └── footer.tsx        # Site footer with links & branding
│   │
│   ├── ui/                   # Shadcn UI primitives
│   │   ├── avatar.tsx        # Avatar component
│   │   ├── badge.tsx         # Badge component
│   │   ├── button.tsx        # Button component (multiple variants)
│   │   ├── card.tsx          # Card component
│   │   ├── dialog.tsx        # Dialog/modal component
│   │   ├── dropdown-menu.tsx # Dropdown menu component
│   │   ├── progress.tsx      # Progress bar component
│   │   ├── separator.tsx     # Separator/divider component
│   │   ├── sheet.tsx         # Slide-over sheet component
│   │   ├── tabs.tsx          # Tabs component
│   │   └── tooltip.tsx       # Tooltip component
│   │
│   ├── theme-provider.tsx    # next-themes provider wrapper
│   └── theme-toggle.tsx      # Dark/light mode toggle button
│
└── lib/                      # Utility libraries & configurations
    ├── db.ts                 # MongoDB/Mongoose connection with caching
    ├── firebase.ts           # Firebase app initialization & auth export
    └── utils.ts              # Helper utilities (cn function for classnames)
```

---

## Future Directories (Phases 2–7)

As the project evolves, the following directories will be added:

```
src/
├── app/
│   ├── (auth)/               # Authentication routes (login, signup)
│   ├── (dashboard)/          # User dashboard routes
│   ├── (admin)/              # Admin panel routes
│   ├── api/                  # API route handlers
│   │   ├── auth/             # Auth API endpoints
│   │   ├── courses/          # Course CRUD endpoints
│   │   ├── tracks/           # Track CRUD endpoints
│   │   ├── questions/        # Question bank endpoints
│   │   ├── submissions/      # Code submission endpoints
│   │   ├── certificates/     # Certificate generation
│   │   ├── users/            # User management
│   │   └── leaderboard/      # Leaderboard data
│   └── verify/[id]/          # Public certificate verification
│
├── components/
│   ├── admin/                # Admin dashboard components
│   ├── assessment/           # Quiz & coding challenge components
│   ├── certificates/         # Certificate display components
│   ├── dashboard/            # User dashboard widgets
│   ├── editor/               # Monaco code editor wrapper
│   └── gamification/         # XP, badges, streak components
│
├── lib/
│   ├── firebase-admin.ts     # Firebase Admin SDK (server-side)
│   ├── piston.ts             # Piston API client for code execution
│   └── certificate.ts        # PDF certificate generation
│
├── models/                   # Mongoose schema definitions
│   ├── User.ts               # User model
│   ├── Course.ts             # Course model
│   ├── Track.ts              # Track model
│   ├── Question.ts           # Question model
│   ├── Submission.ts         # Submission model
│   ├── Certificate.ts        # Certificate model
│   └── Progress.ts           # User progress model
│
├── middleware.ts              # Auth middleware for protected routes
│
├── hooks/                    # Custom React hooks
│   ├── useAuth.ts            # Authentication state hook
│   └── useProgress.ts        # Progress tracking hook
│
├── types/                    # TypeScript type definitions
│   └── index.ts              # Shared types & interfaces
│
└── constants/                # App-wide constants
    └── index.ts              # Routes, roles, config values
```

---

## `public/` — Static Assets

```
public/
├── file.svg                  # File icon
├── globe.svg                 # Globe icon
├── next.svg                  # Next.js logo
├── vercel.svg                # Vercel logo
└── window.svg                # Window icon
```

Future additions will include:
- `images/` — Track logos, landing page graphics
- `certificates/` — Certificate template backgrounds

---

## `guides/` — Project Documentation

```
guides/
├── README.md                 # Documentation index & quick start
├── project-structure.md      # This file — folder structure guide
├── tech-stack.md             # Technology stack details
├── database-schema.md        # MongoDB schema documentation
├── api-reference.md          # API endpoint reference
└── features-roadmap.md       # Full feature roadmap
```

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js configuration (experimental features, env) |
| `tsconfig.json` | TypeScript paths (`@/*` alias), strict mode |
| `components.json` | Shadcn UI — style (base-nova), aliases, icon library (lucide) |
| `postcss.config.mjs` | PostCSS pipeline (Tailwind CSS v4) |
| `eslint.config.mjs` | ESLint flat config with Next.js rules |
| `.env.example` | Template for required environment variables |
