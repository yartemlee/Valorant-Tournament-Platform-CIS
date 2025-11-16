-- Ensure RLS is enabled on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting SELECT policies
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "teams_public_select" ON teams;
DROP POLICY IF EXISTS "teams_select_anon_only" ON teams;
DROP POLICY IF EXISTS "teams_select_authenticated_only" ON teams;

-- Create unified public SELECT policy for both anon and authenticated
CREATE POLICY "teams_public_select" ON teams
FOR SELECT
USING (true);