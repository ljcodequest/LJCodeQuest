# LJ CodeQuest — System Guides

> **Purpose:** These guide files are the single source of truth for all AI agents and developers working on this codebase. Read them before writing or modifying any application code.

---

## Guide Index

| # | File | Description |
|---|------|-------------|
| 1 | [progression-system.md](./progression-system.md) | **Core business logic.** The HackerRank-style mastery progression — how courses, difficulty levels, tracks, and questions interact. The sequential unlock rules. The gating conditions. Read this first. |
| 2 | [data-model-reference.md](./data-model-reference.md) | Complete reference of every MongoDB/Mongoose model, their fields, relationships, indexes, and the schema contract that progression logic depends on. |
| 3 | [progression-api-contract.md](./progression-api-contract.md) | The exact API endpoints, request/response shapes, and server-side validation rules that enforce the progression system. Covers both existing and required-but-missing endpoints. |
| 4 | [frontend-progression-rules.md](./frontend-progression-rules.md) | How the frontend must render locked/unlocked/completed states, prevent unauthorized navigation, and present the one-question-at-a-time UX. |
| 5 | [known-bugs-and-gaps.md](./known-bugs-and-gaps.md) | An honest audit of every bug, bad practice, missing feature, and incomplete implementation in the current codebase that must be fixed to make the progression system work correctly. |
| 6 | [coding-standards.md](./coding-standards.md) | Project conventions — file naming, import patterns, error handling, TypeScript strictness, API response shapes, and code style rules that all future code must follow. |

---

## How to Use These Guides

1. **Before any code change:** Read `progression-system.md` to understand the core rules.
2. **Before touching a model:** Read `data-model-reference.md` to understand the schema contract.
3. **Before writing an API route:** Read `progression-api-contract.md` for the expected signatures.
4. **Before building UI:** Read `frontend-progression-rules.md` for rendering rules.
5. **Before fixing a bug:** Read `known-bugs-and-gaps.md` to see if it's already documented.
6. **Always:** Follow `coding-standards.md` for all code you write.

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript | ^5 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS v4 + Shadcn UI | ^4 / ^4.1.0 |
| Database | MongoDB via Mongoose | ^9.3.2 |
| Auth | Firebase Auth (client) + Firebase Admin (server) | ^12.11.0 / ^13.7.0 |
| Code Editor | Monaco Editor | ^4.7.0 |
| AI | Google Generative AI (Gemini) | ^0.24.1 |
| Forms | React Hook Form + Zod | ^7.72.0 / ^4.3.6 |
