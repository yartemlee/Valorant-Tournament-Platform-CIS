# Supabase Migrations Review (MVP Refactor)

## Overview

This directory has been cleaned up to support the **Valorant Tournament Platform MVP** with a single, reliable source of truth. All legacy "Lovable" migrations have been removed and replaced with a consolidated schema definition.

**Current Migration File:**
- `20251122000000_mvp_schema.sql`: Contains the full database definition (Types, Tables, Indexes, RLS Policies, Triggers).

## Schema Changes

### 1. Entities Aligned with Spec
The following tables are now strictly typed and aligned with `spec.md`:
- **`profiles`**: Includes `riot_id`, `region`, `rank`, `main_agents`.
- **`teams`**: Includes `captain_id`, `is_recruiting`, `min_rank`.
- **`team_members`**: Includes `role` enum ('captain', 'coach', 'member').
- **`tournaments`**: Includes `format`, `status`, `prize_pool` (text).
- **`matches`**: Includes bracket logic (`round_number`, `bracket_position`).

### 2. New MVP Features Added
- **`scrims`**: Support for creating and finding practice matches.
- **`posts`**: Support for news/announcements (Publisher role).
- **`notifications`**: Centralized notification system.
- **`user_roles`**: System-level roles (Admin, Publisher) separate from Team roles.

### 3. Security (RLS)
Row Level Security is enabled on ALL tables.
- **Profiles**: Self-editable, public read.
- **Teams**: Editable by Captain/Coach.
- **Tournaments**: Editable by Organizer/Admin.
- **Matches**: Results editable by Organizer/Admin.

### 4. Legacy Cleanup
- Removed generic/unused tables (e.g., `lovable_feedback`, old todo lists).
- Renamed inconsistent tables (`team_invites` -> `team_invitations`, `tournament_participants` -> `tournament_registrations`).

## How to Apply

Since the previous migrations were removed, the cleanest way to apply this is to reset the database.

**Local Development:**
```bash
supabase db reset
```

**Production (Warning):**
If applying to a production database with existing data, this migration might fail if tables already exist. You may need to:
1. Backup your data.
2. Drop existing tables manually or via a separate script.
3. Run `supabase db push`.

## Verification

After running the migration, verify the schema:
1. Check that `profiles` has `riot_id`.
2. Check that `teams` has `captain_id`.
3. Ensure `user_roles` table exists.


