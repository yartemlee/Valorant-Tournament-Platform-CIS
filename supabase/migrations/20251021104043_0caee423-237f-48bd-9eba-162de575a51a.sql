-- Migration: Align team_applications and team_invites FKs to profiles
-- This allows PostgREST to join profiles natively

-- Step 1: Drop existing FK constraints to auth.users (if they exist)
-- Note: We're checking if constraints exist before dropping to avoid errors

DO $$ 
BEGIN
  -- Drop FK on team_applications.from_user_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_applications_from_user_id_fkey' 
    AND table_name = 'team_applications'
  ) THEN
    ALTER TABLE public.team_applications 
    DROP CONSTRAINT team_applications_from_user_id_fkey;
  END IF;

  -- Drop FK on team_invites.to_user_id if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invites_to_user_id_fkey' 
    AND table_name = 'team_invites'
  ) THEN
    ALTER TABLE public.team_invites 
    DROP CONSTRAINT team_invites_to_user_id_fkey;
  END IF;
END $$;

-- Step 2: Add new FK constraints pointing to profiles.id
ALTER TABLE public.team_applications
ADD CONSTRAINT team_applications_from_user_id_fkey 
FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.team_invites
ADD CONSTRAINT team_invites_to_user_id_fkey 
FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 3: Verify RLS policies are still valid (they reference user IDs, not FKs, so should be fine)
-- RLS policies on team_applications and team_invites check auth.uid() and team membership
-- These don't need changes as they work with user IDs, not FK relationships

-- Step 4: Add indexes for performance on FK columns
CREATE INDEX IF NOT EXISTS idx_team_applications_from_user_id 
ON public.team_applications(from_user_id);

CREATE INDEX IF NOT EXISTS idx_team_invites_to_user_id 
ON public.team_invites(to_user_id);

-- Migration complete: PostgREST can now join profiles directly via these FKs