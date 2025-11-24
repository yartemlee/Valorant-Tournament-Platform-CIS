---
description: Workflow to check project rules compliance before completing a task
---

This workflow is designed to verify code compliance with `.cursor/rules/project-rules.mdc` and the specification `spec.md`. Run this checklist before every commit or task completion.

## 1. Tech Stack & File Conventions
- [ ] **Components**: All new components are in `src/components/ui/` (shared) or `src/components/{feature}/` (feature-specific).
- [ ] **Styling**: Only TailwindCSS is used. No external CSS files or `<style>` tags (except `index.css`).
- [ ] **UI Library**: Shadcn UI components are used.
- [ ] **Icons**: Only `lucide-react` icons are used.

## 2. Supabase & Security
- [ ] **Typing**: Types from `src/types/supabase.ts` are used. Queries are typed: `supabase.from<TableName>()`.
- [ ] **Error Handling**: All Supabase requests check for `error` and show a user notification (toast).
- [ ] **RLS**: Ensure RLS policies are respected (e.g., `auth.uid()` for profiles).
- [ ] **Keys**: No `service_role` keys on the client side.

## 3. Coding Principles
- [ ] **Handlers**: Handler functions start with `handle` (e.g., `handleSubmit`, `handleJoin`).
- [ ] **Utilities**: `cn()` is used for conditional classes.
- [ ] **Forms**: `react-hook-form` + `zod` + `zodResolver` are used.
- [ ] **Code Cleanliness**:
    - [ ] No `console.log` (use proper logging or remove).
    - [ ] No `any` or `@ts-ignore`.
    - [ ] No commented-out code or TODOs in the commit.
- [ ] **Navigation**: React Router hooks (`useNavigate`, etc.) are used.

## 4. Quality & UX
- [ ] **Loading**: Loading states (Skeleton) are shown for all async operations.
- [ ] **Errors**: Users see clear error messages via `toast`.
- [ ] **Accessibility**: Interactive elements are keyboard accessible (`tabIndex`, `Enter`/`Space`). `aria-label` for icon-only buttons.

## 5. Git & Commits
- [ ] **Format**: Semantic commits are used (feat, fix, refactor, style, docs).
- [ ] **Language**: Commit messages are clear (Russian or English).
- [ ] **Atomicity**: 1 feature = 1 commit.

## 6. Functionality Check (MVP)
- [ ] Verify compliance with `spec.md` requirements for the current feature.
- [ ] Ensure MVP logic is not violated (e.g., no extra features like a store unless requested).

## Self-Check Commands (if applicable)
// turbo
Run type check:
```bash
npm run build
```
(The build command runs tsc and vite build, which checks types)
