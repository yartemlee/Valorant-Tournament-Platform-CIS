---
description: Workflow to check project rules compliance before completing a task
---

This workflow is designed to verify code compliance with the **`SKILLS` directory** (Project Source of Truth) and `spec.md`. Run this checklist before every commit or task completion.

## 1. Tech Stack & File Conventions (Monorepo)
- [ ] **Components**: New UI components are in `apps/web/src/components/ui/` (shared) or `apps/web/src/components/{feature}/`.
- [ ] **Data Types**: Database types are imported from `packages/shared/src/types/database.types.ts`.
- [ ] **Styling**: 
    - [ ] `TailwindCSS` only. No external CSS files.
    - [ ] **Fonts**: `Outfit` for Headings, `DM Sans` for Body text (see `SKILLS/design-system.md`).
    - [ ] **Icons**: Only `lucide-react`.
- [ ] **UI Library**: Shadcn UI components are used exclusively.

## 2. Supabase & Security
- [ ] **Typing**: No `any`. Queries are strongly typed using `Database` types.
- [ ] **Error Handling**: All Supabase requests check for `error` and show a user notification via `toast` (Sonner).
- [ ] **RLS**: Ensure RLS policies are respected (e.g., `auth.uid()`).
- [ ] **Keys**: No `service_role` keys on the client side.

## 3. Coding Principles (Source: `SKILLS/coding_conventions.md`)
- [ ] **Zero Any Policy**: No `any` type usage. Use strict types or `unknown` with guards.
- [ ] **Handlers**: Handler functions start with `handle` (e.g., `handleSubmit`, `handleJoin`).
- [ ] **Utilities**: `cn()` is used for conditional classes.
- [ ] **Forms**: `react-hook-form` + `zod` + `zodResolver`.
- [ ] **Code Cleanliness**:
    - [ ] No `console.log`.
    - [ ] No commented-out code.
    - [ ] No unused variables.

## 4. Quality & UX
- [ ] **Loading**: Loading states (Skeleton) are shown for all async operations.
- [ ] **Errors**: Users see clear error messages via `toast`.
- [ ] **Accessibility**: Interactive elements are keyboard accessible.
- [ ] **Premium Feel**: Design checks from `SKILLS/design-system.md` (Gradients, Glows, Glassmorphism).

## 5. Git & Commits
- [ ] **Format**: Semantic commits (feat, fix, refactor, style, docs).
- [ ] **Language**: Commit messages in Russian or English.
- [ ] **Pre-commit**: Check that `husky` hooks pass.

## 6. Self-Check Commands (Required)
// turbo
Run strict linting verification:
```bash
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 .
```

Run type check:
```bash
npm run typecheck
```
