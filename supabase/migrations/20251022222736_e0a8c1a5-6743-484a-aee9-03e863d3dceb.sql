-- Add missing fields to tournament_matches table
ALTER TABLE tournament_matches
  ADD COLUMN IF NOT EXISTS best_of INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS loser_id UUID REFERENCES teams(id);

-- Add index for faster bracket queries
CREATE INDEX IF NOT EXISTS idx_tournament_matches_lookup 
  ON tournament_matches(tournament_id, round_number, bracket_type);

-- Add comment for clarity
COMMENT ON COLUMN tournament_matches.best_of IS 'Series format: 1, 3, or 5 games';
COMMENT ON COLUMN tournament_matches.loser_id IS 'Team that lost this match (for double elimination)';