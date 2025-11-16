-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Team captains and coaches can insert members" ON team_members;

-- Create new policy that allows team owners to insert members
CREATE POLICY "Team owners and captains can insert members"
ON team_members FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the team owner
  EXISTS (
    SELECT 1 FROM teams 
    WHERE teams.id = team_members.team_id 
    AND teams.owner_id = auth.uid()
  )
  OR
  -- OR if user is already a captain/coach
  public.is_team_captain_or_coach(team_id)
);

-- Delete the test team without members
DELETE FROM teams WHERE id = '0838757c-fae0-407c-bf12-23f4ffc9da42';