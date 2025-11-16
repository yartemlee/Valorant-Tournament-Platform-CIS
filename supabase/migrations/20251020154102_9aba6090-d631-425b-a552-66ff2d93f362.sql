-- Обновить RLS политики для team_applications
DROP POLICY IF EXISTS "Users can view applications to their teams" ON team_applications;

CREATE POLICY "Users can view applications to their teams"
ON team_applications FOR SELECT
USING (
  auth.uid() = from_user_id
  OR 
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_applications.team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
  OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_applications.team_id
      AND t.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own applications" ON team_applications;

CREATE POLICY "Users can update their own applications"
ON team_applications FOR UPDATE
USING (
  auth.uid() = from_user_id
  OR 
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_applications.team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
  OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_applications.team_id
      AND t.owner_id = auth.uid()
  )
);

-- Обновить RLS политики для team_invites
DROP POLICY IF EXISTS "Users can view their own invites" ON team_invites;

CREATE POLICY "Users can view their own invites"
ON team_invites FOR SELECT
USING (
  auth.uid() = to_user_id
  OR 
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
  OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_invites.team_id
      AND t.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own invites" ON team_invites;

CREATE POLICY "Users can update their own invites"
ON team_invites FOR UPDATE
USING (
  auth.uid() = to_user_id
  OR 
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
  OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_invites.team_id
      AND t.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Team captains and coaches can create invites" ON team_invites;

CREATE POLICY "Team captains and coaches can create invites"
ON team_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_invites.team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
  OR
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_invites.team_id
      AND t.owner_id = auth.uid()
  )
);