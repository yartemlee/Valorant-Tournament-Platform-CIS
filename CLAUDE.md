# ValoHub — Claude Code Guidelines

## Project Overview

ValoHub is a Valorant tournament platform for CIS region amateur/semi-professional esports. Built with React + TypeScript + Vite frontend with Supabase backend (PostgreSQL, Auth, Storage, Real-time).

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **UI**: Shadcn UI (Radix UI primitives) in `src/components/ui/`
- **State**: TanStack Query for server state, React Context for auth
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Backend**: Supabase (auth, RLS-protected PostgreSQL, Storage, Real-time)

## Development Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

**Before committing**: Run `npm run typecheck && npm run lint` to check for errors.

## Project Structure

```
apps/web/src/
├── components/
│   ├── ui/           # Shadcn UI components
│   ├── profile/      # Profile-related components
│   ├── teams/        # Team management
│   └── admin/        # Admin panel
├── pages/            # Route components
├── contexts/         # React contexts (AuthContext)
├── hooks/            # Custom hooks
├── services/         # Service layer (query keys, API functions)
├── lib/              # Utilities (supabase.ts, utils.ts)
├── types/            # TypeScript types (database.types.ts)
└── constants/        # App constants
```

## Key Conventions

### Zero Any Policy

**Never use `any` type.** See skill `typescript-standards` for detailed patterns and alternatives.

### Styling

- Use TailwindCSS utility classes exclusively
- Use `cn()` from `@/lib/utils` for conditional classes
- Use Shadcn UI components for all UI elements

### Service Layer (MANDATORY)

When writing new code or modifying existing components:

- **Query keys**: Always use `queryKeys` from `@/services/queryKeys` — never hardcode strings like `["profile", id]`
- **Profile queries**: Use `fetchProfileById`, `fetchProfileByUsername` etc. from `@/services/profiles`
- **Team queries**: Use `fetchTeams`, `fetchTeamById`, `fetchTeamMemberRole` etc. from `@/services/teams`
- **Current user profile**: Use the `useCurrentUserProfile()` hook — never write inline `supabase.from("profiles")` queries for the current user
- **Cache invalidation**: Use `queryKeys.*` for `invalidateQueries` calls

```ts
// GOOD
import { queryKeys } from "@/services/queryKeys";
import { fetchProfileById } from "@/services/profiles";

const { data } = useQuery({
  queryKey: queryKeys.profiles.detail(userId),
  queryFn: () => fetchProfileById(userId),
});

// BAD — never do this in new code
const { data } = useQuery({
  queryKey: ["profile", userId],
  queryFn: async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return data;
  },
});
```

### Supabase

- Always check both `data` and `error` from queries
- Use typed queries with `Database` types from `@/types/database.types.ts`
- RLS is enabled on all tables

### Path Aliases

`@/*` maps to `./src/*`

## Database Schema

Key tables: `profiles`, `teams`, `team_members`, `team_invitations`, `tournaments`, `tournament_registrations`, `matches`, `scrims`, `notifications`

Key enums:
- `app_role`: admin, publisher, organizer, player
- `team_role`: captain, coach, member
- `tournament_status`: draft, registration, active, completed, cancelled
- `valorant_rank`: Iron 1 through Radiant

## Agent Skills

### Global (`~/.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| `frontend-design` | Avoid "AI slop", create distinctive UIs |
| `typescript-standards` | Zero Any Policy, TypeScript best practices |
| `shadcn-ui` | UI components with Radix primitives |
| `web-artifacts-builder` | Build standalone HTML artifacts |

### Project (`.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| `design-system` | ValoHub "Digital Couture" theme |
| `eslint-validation` | ESLint rules and workflow |
| `scrollbar-style` | Custom scrollbar styling |
| `supabase-realtime` | Real-time features, presence |
| `supabase-migrations` | Database migrations, RLS policies |
| `supabase-storage` | File uploads, avatars |

## Domain Rules

- A player can be in only one team at a time
- Only captain/coach can register team for tournament
- Riot ID is required for tournament participation
- Team: max 10 players, min 1 player
- Tournament formats: Single/Double Elimination with bracket auto-generation
