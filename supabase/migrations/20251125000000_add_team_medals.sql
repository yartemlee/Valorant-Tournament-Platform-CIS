-- Migration: Add medal counters to teams table
-- Description: Add medals_gold, medals_silver, medals_bronze columns to track team achievements

-- Add medal columns to teams table
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS medals_gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medals_silver INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medals_bronze INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN teams.medals_gold IS 'Number of gold medals (1st place) won in tournaments';
COMMENT ON COLUMN teams.medals_silver IS 'Number of silver medals (2nd place) won in tournaments';
COMMENT ON COLUMN teams.medals_bronze IS 'Number of bronze medals (3rd place) won in tournaments';
