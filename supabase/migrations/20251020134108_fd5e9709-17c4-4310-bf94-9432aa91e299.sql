-- Clean up inconsistent current_team_id data
-- Clear current_team_id for users who are no longer in their teams
UPDATE profiles
SET current_team_id = NULL
WHERE current_team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = profiles.id
      AND tm.team_id = profiles.current_team_id
  );