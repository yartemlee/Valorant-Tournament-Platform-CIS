---
name: supabase-migrations
description: Supabase database migrations and RLS policies guide for ValoHub. Use when creating tables, modifying schema, writing migrations, or implementing Row Level Security policies.
metadata:
  author: valohub-team
  version: "1.0"
---

# Supabase Migrations Guide

Guide for managing database schema, migrations, and RLS policies in ValoHub.

## Critical Rules

1. **Migrations are IRREVERSIBLE in production** — Test locally first
2. **Every table MUST have RLS enabled** — No exceptions
3. **Every table MUST have policies defined** — Even if permissive
4. **Always generate types after migrations** — Keep TypeScript in sync

## Workflow

### 1. Create Migration

```bash
# Create new migration file
supabase migration new <migration_name>

# Example
supabase migration new add_tournament_prizes
```

This creates: `supabase/migrations/YYYYMMDDHHMMSS_add_tournament_prizes.sql`

### 2. Write Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_tournament_prizes.sql

-- Create table
CREATE TABLE IF NOT EXISTS tournament_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  place INTEGER NOT NULL CHECK (place > 0),
  prize_amount DECIMAL(10,2) NOT NULL CHECK (prize_amount >= 0),
  prize_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tournament_prizes_tournament ON tournament_prizes(tournament_id);

-- Enable RLS (MANDATORY!)
ALTER TABLE tournament_prizes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view prizes"
ON tournament_prizes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizers can manage prizes"
ON tournament_prizes FOR ALL
TO authenticated
USING (
  tournament_id IN (
    SELECT id FROM tournaments WHERE organizer_id = auth.uid()
  )
)
WITH CHECK (
  tournament_id IN (
    SELECT id FROM tournaments WHERE organizer_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_tournament_prizes_updated_at
  BEFORE UPDATE ON tournament_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Apply Migration

```bash
# Apply to local database
supabase db push

# Or reset and reapply all migrations
supabase db reset
```

### 4. Generate Types

```bash
# Generate TypeScript types
npm run db:types

# Or directly
supabase gen types typescript --local > packages/shared/src/types/database.types.ts
```

## RLS Policy Patterns

### Public Read, Owner Write

```sql
-- Anyone can read
CREATE POLICY "Public read access"
ON table_name FOR SELECT
TO authenticated
USING (true);

-- Only owner can modify
CREATE POLICY "Owner can modify"
ON table_name FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

### Team-Based Access

```sql
-- Team members can read
CREATE POLICY "Team members can view"
ON team_data FOR SELECT
TO authenticated
USING (
  team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Only captain/coach can modify
CREATE POLICY "Team leaders can modify"
ON team_data FOR ALL
TO authenticated
USING (
  team_id IN (
    SELECT tm.team_id FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role IN ('captain', 'coach')
  )
);
```

### Role-Based Access

```sql
-- Admin full access
CREATE POLICY "Admin full access"
ON any_table FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

## Common Patterns

### Soft Delete

```sql
ALTER TABLE table_name ADD COLUMN deleted_at TIMESTAMPTZ;

-- Update RLS to exclude deleted
CREATE POLICY "Hide deleted records"
ON table_name FOR SELECT
TO authenticated
USING (deleted_at IS NULL);
```

### Audit Columns

```sql
-- Add to every table
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
created_by UUID REFERENCES auth.users(id),
updated_by UUID REFERENCES auth.users(id)
```

### Updated At Trigger

```sql
-- Create function once
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each table
CREATE TRIGGER update_tablename_updated_at
  BEFORE UPDATE ON tablename
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Validation Checklist

Before committing migration:

- [ ] RLS enabled on new tables
- [ ] Policies defined for SELECT, INSERT, UPDATE, DELETE as needed
- [ ] Indexes created for foreign keys and frequently queried columns
- [ ] Constraints added (NOT NULL, CHECK, UNIQUE)
- [ ] Types regenerated after migration
- [ ] Tested locally with `supabase db reset`

## Rollback Strategy

Since migrations are irreversible, plan rollbacks as NEW migrations:

```sql
-- If you need to undo add_column
-- Create new migration: remove_column
ALTER TABLE table_name DROP COLUMN column_name;
```
