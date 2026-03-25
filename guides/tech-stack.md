# 🛠️ Technology Stack

> Detailed overview of every technology, library, and tool used in LJ CodeQuest — with versions and rationale.

---

## Core Framework

### Next.js 16 (App Router)

| Detail | Value |
|--------|-------|
| **Version** | `16.2.1` |
| **Router** | App Router (`src/app/`) |
| **Rendering** | Server Components by default, Client Components as needed |
| **TypeScript** | Enabled with strict mode |
| **Import Alias** | `@/*` → `src/*` |

**Why Next.js?**
- Full-stack React framework with built-in API routes
- Server-side rendering (SSR) and static generation (SSG) for performance
- File-based routing simplifies navigation
- React Server Components reduce client-side JavaScript bundle
- Excellent TypeScript integration

### React 19

| Detail | Value |
|--------|-------|
| **Version** | `19.2.4` |
| **React DOM** | `19.2.4` |

**Why React 19?**
- Server Components and Server Actions
- Improved streaming and Suspense
- Concurrent features for better UX

---

## Styling & UI

### Tailwind CSS v4

| Detail | Value |
|--------|-------|
| **Version** | `^4` |
| **PostCSS Plugin** | `@tailwindcss/postcss ^4` |
| **Animation** | `tw-animate-css ^1.4.0` |

**Why Tailwind CSS v4?**
- Utility-first CSS for rapid, consistent styling
- v4 brings CSS-first configuration, faster compilation
- No `tailwind.config.js` needed — styles configured in CSS
- Native cascade layers for specificity control

### Shadcn UI (v4)

| Detail | Value |
|--------|-------|
| **Version** | `^4.1.0` (CLI) |
| **Style** | `base-nova` |
| **Icon Library** | Lucide React |
| **CSS Variables** | Enabled |

**Installed Components:**

| Component | Purpose |
|-----------|---------|
| `avatar` | User profile images |
| `badge` | Status indicators, tags |
| `button` | Primary interaction element (multiple variants) |
| `card` | Content containers |
| `dialog` | Modal dialogs |
| `dropdown-menu` | Navigation & action menus |
| `progress` | Progress bars (course/track completion) |
| `separator` | Visual dividers |
| `sheet` | Mobile navigation slide-over |
| `tabs` | Tabbed content switching |
| `tooltip` | Hover information tooltips |

**Why Shadcn UI?**
- High-quality, accessible, unstyled components
- Full source ownership — components live in your codebase (`src/components/ui/`)
- Seamlessly integrates with Tailwind CSS
- Fully customizable, no rigid design constraints

### Supporting CSS Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `class-variance-authority` | `^0.7.1` | Component variant management |
| `clsx` | `^2.1.1` | Conditional className joining |
| `tailwind-merge` | `^3.5.0` | Intelligent Tailwind class merging |

---

## Theme System

### next-themes

| Detail | Value |
|--------|-------|
| **Version** | `^0.4.6` |
| **Default Theme** | `dark` |
| **System Preference** | Enabled |
| **Storage** | `localStorage` + `class` attribute |

**Implementation:**
- `ThemeProvider` wraps the app in `layout.tsx`
- `ThemeToggle` component (Sun/Moon icons) in the navbar
- CSS variables switch between dark and light palettes
- Dark-mode-first design (developer-centric aesthetic)

---

## Database

### MongoDB with Mongoose

| Detail | Value |
|--------|-------|
| **Mongoose Version** | `^9.3.2` |
| **Hosting** | MongoDB Atlas (recommended) |
| **Connection** | Cached singleton via `src/lib/db.ts` |

**Why MongoDB?**
- Flexible document structure — ideal for diverse content types (courses, questions, submissions)
- Rich querying capabilities for leaderboards and progress tracking
- Mongoose provides schema validation and TypeScript types
- Horizontal scaling for growing user bases

**Connection Caching Pattern:**
```typescript
// Prevents multiple connections in serverless environments
const cached = global.mongooseCache ?? { conn: null, promise: null };
```

---

## Authentication

### Firebase Authentication

| Detail | Value |
|--------|-------|
| **Firebase SDK** | `^12.11.0` |
| **Client Init** | `src/lib/firebase.ts` |
| **Admin SDK** | Server-side (planned for Phase 2) |

**Planned Auth Providers:**
- 🔐 Google Sign-In
- 🐙 GitHub Sign-In
- 📧 Email/Password

**Why Firebase Auth?**
- Battle-tested authentication infrastructure
- Multiple sign-in providers with minimal setup
- Server-side token verification via Admin SDK
- Free tier supports substantial user volumes
- Handles session management, password resets, email verification

---

## Code Execution (Phase 5)

### Piston API

| Detail | Value |
|--------|-------|
| **API URL** | `https://emkc.org/api/v2/piston` |
| **Purpose** | Sandboxed code compilation & execution |

**Why Piston?**
- Open-source, self-hostable code execution engine
- Supports 60+ programming languages
- Sandboxed execution — safe for user-submitted code
- RESTful API — simple integration
- Configurable resource limits (timeout, memory)

**Supported Languages (planned):**
- Java, Python, JavaScript, TypeScript, C, C++, Go, Rust, Ruby, PHP, and more

---

## Code Editor (Phase 5)

### Monaco Editor (planned)

**Why Monaco?**
- Same editor that powers VS Code
- Syntax highlighting for 80+ languages
- IntelliSense/autocomplete
- Bracket matching, auto-indentation
- Customizable themes (dark mode integration)

---

## Certificate Generation (Phase 6)

### PDF Generation (planned)

Libraries under consideration:
- `@react-pdf/renderer` — React-based PDF generation
- `jspdf` + `html2canvas` — HTML-to-PDF conversion
- `puppeteer` — Server-side PDF rendering

---

## Icons

### Lucide React

| Detail | Value |
|--------|-------|
| **Version** | `^1.6.0` |
| **Usage** | Throughout UI — navbar, features cards, buttons, footer |

**Why Lucide?**
- Clean, consistent iconography
- Tree-shakeable — only import icons you use
- Default icon library for Shadcn UI
- 1,500+ icons available

---

## Typography

### Google Fonts

| Font | Variable | Purpose |
|------|----------|---------|
| **Inter** | `--font-sans` | Body text, UI elements |
| **JetBrains Mono** | `--font-mono` | Code blocks, terminal output |

Both fonts are loaded via `next/font/google` for:
- Zero layout shift (font-display: swap)
- Self-hosted — no external requests
- Automatic subsetting

---

## Development & Quality

### TypeScript

| Detail | Value |
|--------|-------|
| **Version** | `^5` |
| **Strict Mode** | Enabled |
| **Path Aliases** | `@/*` → `./src/*` |

### ESLint

| Detail | Value |
|--------|-------|
| **Version** | `^9` |
| **Config** | Flat config (`eslint.config.mjs`) |
| **Extends** | `eslint-config-next 16.2.1` |

### PostCSS

| Detail | Value |
|--------|-------|
| **Plugin** | `@tailwindcss/postcss` |
| **Purpose** | Process Tailwind CSS directives |

---

## Dependency Summary

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | `16.2.1` | React framework (App Router) |
| `react` / `react-dom` | `19.2.4` | UI library |
| `mongoose` | `^9.3.2` | MongoDB ODM |
| `firebase` | `^12.11.0` | Authentication |
| `next-themes` | `^0.4.6` | Dark/light mode |
| `shadcn` | `^4.1.0` | UI component CLI |
| `@base-ui/react` | `^1.3.0` | Base UI primitives |
| `lucide-react` | `^1.6.0` | Icons |
| `class-variance-authority` | `^0.7.1` | Component variants |
| `clsx` | `^2.1.1` | Classname utilities |
| `tailwind-merge` | `^3.5.0` | Tailwind class merging |
| `tw-animate-css` | `^1.4.0` | CSS animations |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | `^4` | Utility-first CSS |
| `@tailwindcss/postcss` | `^4` | PostCSS integration |
| `typescript` | `^5` | Type safety |
| `@types/node` | `^20` | Node.js types |
| `@types/react` | `^19` | React types |
| `@types/react-dom` | `^19` | React DOM types |
| `eslint` | `^9` | Code linting |
| `eslint-config-next` | `16.2.1` | Next.js lint rules |
