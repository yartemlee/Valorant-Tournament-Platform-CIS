-- Add current_team_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN current_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Add an index for performance (optional but good practice)
CREATE INDEX idx_profiles_current_team_id ON public.profiles(current_team_id);

