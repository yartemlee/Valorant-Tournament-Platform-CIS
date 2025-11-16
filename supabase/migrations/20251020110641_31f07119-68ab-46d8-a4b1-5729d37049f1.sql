-- Clean up completed test tournaments
DELETE FROM tournaments WHERE id IN (
  '0d2a692f-a30f-4fd3-a07b-168f7f5b4800',
  '404915cd-719a-405c-a5ed-825a3bdfe900'
);

-- Add performance indexes for frequently queried tables
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament_id ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user_id ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, date_start);