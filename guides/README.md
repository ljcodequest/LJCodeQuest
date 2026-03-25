# 📚 LJ CodeQuest — Project Documentation

> Your comprehensive guide to understanding, developing, and extending the LJ CodeQuest e-learning & coding assessment platform.

---

## 🏗️ Project Overview

**LJ CodeQuest** is an advanced e-learning and coding assessment platform (inspired by HackerRank) built with modern web technologies. It provides:

- **Strict Mastery Progression** — Students must master each topic before advancing
- **Multiple Assessment Types** — MCQ, multi-select, descriptive, and live coding challenges
- **Code Execution Sandbox** — Real-time code compilation using the Piston API
- **Automated Certificates** — PDF certificates with unique IDs and verification
- **Gamification** — XP points, badges, streaks, and a global leaderboard
- **AI-Powered Hints** — Intelligent code review and guidance

### Author

**Lahiru Harshana Jayasinghe** — Full-Stack Developer

---

## 📖 Documentation Index

| Guide | Description |
|-------|-------------|
| [Project Structure](./project-structure.md) | Complete folder structure breakdown and file responsibilities |
| [Tech Stack](./tech-stack.md) | Technology choices, versions, and rationale |
| [Database Schema](./database-schema.md) | Full MongoDB schema design for all collections |
| [API Reference](./api-reference.md) | RESTful API endpoint documentation |
| [Features Roadmap](./features-roadmap.md) | Full feature roadmap across all development phases |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.18.0
- **npm** ≥ 9.x
- **MongoDB** Atlas cluster or local MongoDB instance
- **Firebase** project with Authentication enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/lj-codequest.git
cd lj-codequest

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and Firebase credentials

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality checks |

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | ✅ |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Admin project ID | ✅ |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin client email | ✅ |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin private key | ✅ |
| `PISTON_API_URL` | Piston code execution API URL | ✅ |
| `NEXT_PUBLIC_APP_URL` | Application base URL | ✅ |
| `NEXT_PUBLIC_APP_NAME` | Application display name | ✅ |

---

## 📄 License

This project is proprietary software developed by **Lahiru Harshana Jayasinghe**.
