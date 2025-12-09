# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Rules

1. **Всегда отвечай на русском языке**, даже если вопрос на английском
2. Приоритет: чистый, эффективный, безопасный и поддерживаемый код
3. Удаляй мёртвый код, закомментированные блоки и неиспользуемые переменные
4. Следуй best practices для React, Supabase, TypeScript и Tailwind
5. При неясности задачи — задавай уточняющие вопросы
6. Пиши понятные и осмысленные commit-сообщения
7. Используй MCP серверы (настроены в `.mcp.json`):
   - **supabase-mcp-server** — для работы с Supabase (миграции, схема БД, запросы)
   - **context7** — для получения актуальной документации библиотек
8. **Перед коммитом** запускай `npm run typecheck` и `npm run lint` для проверки ошибок

## Project Overview

ValoHub is a Valorant tournament platform for CIS region amateur/semi-professional esports. Built with React + TypeScript + Vite frontend with Supabase backend (PostgreSQL, Auth, Storage, Real-time).

## Development Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript 5.8, Vite 7, TailwindCSS 3.4
- **UI**: Shadcn UI (Radix UI primitives) in `src/components/ui/`
- **State**: TanStack Query for server state, React Context for auth
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Backend**: Supabase (auth, RLS-protected PostgreSQL, Storage, Real-time subscriptions)

### Project Structure
```
src/
├── components/
│   ├── ui/           # Shadcn UI components (Button, Dialog, Card, etc.)
│   ├── profile/      # Profile-related components
│   ├── teams/        # Team management components
│   ├── admin/        # Admin panel components
│   └── *.tsx         # Shared components (Header, Footer, TournamentCard)
├── pages/            # Route components
│   └── admin/        # Admin panel pages
├── contexts/         # React contexts (AuthContext.tsx)
├── hooks/            # Custom hooks (useCurrentUserProfile, useRealtime*)
├── lib/              # Utilities
│   ├── supabase.ts   # Supabase client
│   └── utils.ts      # cn() utility for class merging
├── types/            # TypeScript types (database.types.ts from Supabase)
└── constants/        # App constants
```

### Database Schema (Supabase)
Key tables: `profiles`, `teams`, `team_members`, `team_invitations`, `team_applications`, `tournaments`, `tournament_registrations`, `matches`, `scrims`, `notifications`

Migrations in `supabase/migrations/`. Database types auto-generated in `src/types/database.types.ts`.

### Key Enums
- `app_role`: admin, publisher, organizer, player
- `team_role`: captain, coach, member
- `tournament_format`: single_elimination, double_elimination
- `tournament_status`: draft, registration, active, completed, cancelled
- `valorant_rank`: Iron 1 through Radiant

## Coding Conventions

### Styling
- Use TailwindCSS utility classes exclusively
- Use `cn()` from `src/lib/utils.ts` for conditional classes
- Use Shadcn UI components for all UI elements

### Supabase Queries
- Always check both `data` and `error` from queries
- Use typed queries with Database types
- RLS is enabled on all tables - respect access patterns:
  - profiles: self-editable, readable by authenticated users
  - teams: editable by captain/coach, readable by all
  - tournaments: editable by organizer/admin, readable by all

### Naming
- Event handlers: `handleSubmit`, `handleCreateTeam`, etc.
- Use const arrow functions for handlers

### Forms
- Always use react-hook-form + zod + zodResolver

### User Feedback
- Use Sonner (toast) for all user action feedback
- Show loading states with Skeleton components
- Handle error states with user-friendly messages

## Path Aliases
`@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)

## Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

## Domain Context

### User Roles
- **Player**: Basic rights, join teams, participate in tournaments
- **Captain**: Manage team, invite/remove players, register for tournaments, transfer captaincy, delete team
- **Coach**: Same as captain except delete team and transfer captaincy
- **Organizer**: Manage created tournaments, input match results
- **Admin**: Full platform access
- **Publisher**: Create/edit news posts

### Key Business Rules
- A player can be in only one team at a time
- Only captain/coach can register team for tournament
- Riot ID is required for tournament participation
- Team: max 10 players, min 1 player
- Tournament formats: Single/Double Elimination with bracket auto-generation
