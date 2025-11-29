-- Add privacy settings columns to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_roles BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_invites BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS socials_team_only BOOLEAN DEFAULT false;

-- Update RLS policies if necessary (assuming profiles are readable by everyone, but specific fields are handled by frontend logic or specific RLS)
-- For now, we rely on frontend logic as requested, but ensuring columns exist is key.
