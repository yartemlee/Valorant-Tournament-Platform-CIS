-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Team captains and coaches can manage members" ON team_members;

-- Create security definer function to check if user is captain or coach
CREATE OR REPLACE FUNCTION public.is_team_captain_or_coach(team_id_input uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members
    WHERE team_id = team_id_input
      AND user_id = auth.uid()
      AND team_role IN ('captain', 'coach')
  )
$$;

-- Create separate policies without recursion
CREATE POLICY "Team captains and coaches can insert members"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (public.is_team_captain_or_coach(team_id));

CREATE POLICY "Team captains and coaches can update members"
ON team_members FOR UPDATE
TO authenticated
USING (public.is_team_captain_or_coach(team_id));

CREATE POLICY "Team captains and coaches can delete members"
ON team_members FOR DELETE
TO authenticated
USING (public.is_team_captain_or_coach(team_id));