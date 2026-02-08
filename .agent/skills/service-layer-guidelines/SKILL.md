---
name: service-layer-guidelines
description: Standards for using the centralized service layer, query keys, and reusable hooks in the ValoHub project.
---

# Service Layer Guidelines

This skill defines the mandatory patterns for data fetching and state management in the ValoHub application. Adhering to these guidelines ensures consistency, reduces duplication, and simplifies maintenance.

## 1. queryKeys

**Rule:** NEVER hardcode query key strings in components or hooks. ALWAYS use the centralized `queryKeys` object.

- **Source:** `apps/web/src/services/queryKeys.ts`
- **Usage:** Import `queryKeys` and use the factory functions or static arrays defined there.

### ❌ Bad
```tsx
useQuery({
  queryKey: ["profile", userId], // HARDCODED STRING
  queryFn: ...
})
```

### ✅ Good
```tsx
import { queryKeys } from "@/services/queryKeys";

useQuery({
  queryKey: queryKeys.profiles.detail(userId),
  queryFn: ...
})
```

## 2. Service Functions

**Rule:** Do NOT make direct `supabase.from(...).select(...)` calls inside UI components for standard entities (Profiles, Teams, etc.). Use the encapsulated functions in the `services/` directory.

- **Source:** `apps/web/src/services/*.ts` (e.g., `profiles.ts`, `teams.ts`)
- **Usage:** Import the specific `fetch...`, `update...`, or `check...` function.

### ❌ Bad
```tsx
// Inside a component
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId)
  .single();
```

### ✅ Good
```tsx
import { fetchProfileById } from "@/services/profiles";

// Inside a queryFn or effect
const data = await fetchProfileById(userId);
```

## 3. Current User Context

**Rule:** Use the `useCurrentUserProfile` hook to access the current user's profile and team status. Do NOT manually query for the current user's profile or role in every component.

- **Source:** `apps/web/src/hooks/useCurrentUserProfile.ts`
- **Usage:**
  ```tsx
  const { profile, isCaptainOfThisTeam, isManager } = useCurrentUserProfile(teamId);
  ```

### Benefits
- **Consistency:** Ensures all components use the same logic to determine roles (e.g., who counts as a "manager").
- **Caching:** Leverages React Query caching efficiently via `queryKeys`.
- **Simplicity:** Reduces boilerplate in components.

## New Services

When creating new features that require data fetching:
1.  **Add Keys:** Add a new section to `apps/web/src/services/queryKeys.ts`.
2.  **Create Service:** Create a new file in `apps/web/src/services/` (e.g., `tournaments.ts`) and export typed async functions for Supabase calls.
3.  **Use Hooks:** Create custom hooks in `apps/web/src/hooks/` if complex logic or state combination is needed, utilizing the service functions and query keys.

## Refactoring Strategy

**Rule:** Apply these patterns gradually.

- **Do NOT** mass-refactor existing working components (e.g., `TeamCard.tsx`) solely to apply these rules.
- **DO** refactor a component if you are already modifying it for a bug fix or new feature.
- **Rationale:** Existing code is stable. Refactoring carries risk without immediate user value. Migration should happen organically.
