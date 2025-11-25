-- Update player_agents skill_level constraint to support new agent proficiency levels
-- This migration changes the constraint from 5 role levels to 2 agent levels

-- Drop the old constraint
ALTER TABLE player_agents 
DROP CONSTRAINT IF EXISTS player_agents_skill_level_check;

-- Add new constraint with agent proficiency levels
ALTER TABLE player_agents 
ADD CONSTRAINT player_agents_skill_level_check 
CHECK (skill_level IN ('not_played', 'comfortable', 'main'));
