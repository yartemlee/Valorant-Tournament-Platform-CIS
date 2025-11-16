-- Add Riot ID link status and current team to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS riot_linked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS current_team_id uuid;

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tag text NOT NULL UNIQUE,
  logo_url text,
  description text,
  is_recruiting boolean DEFAULT true,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT name_length CHECK (char_length(name) >= 3 AND char_length(name) <= 24),
  CONSTRAINT tag_length CHECK (char_length(tag) >= 2 AND char_length(tag) <= 5)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_role text NOT NULL DEFAULT 'player' CHECK (team_role IN ('captain', 'coach', 'player')),
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create team_invites table
CREATE TABLE IF NOT EXISTS public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create team_applications table
CREATE TABLE IF NOT EXISTS public.team_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for team_members
CREATE POLICY "Team members are viewable by everyone"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Team captains and coaches can manage members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

-- RLS Policies for team_invites
CREATE POLICY "Users can view their own invites"
  ON public.team_invites FOR SELECT
  USING (auth.uid() = to_user_id OR 
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invites.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

CREATE POLICY "Team captains and coaches can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invites.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

CREATE POLICY "Users can update their own invites"
  ON public.team_invites FOR UPDATE
  USING (auth.uid() = to_user_id OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invites.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

-- RLS Policies for team_applications
CREATE POLICY "Users can view applications to their teams"
  ON public.team_applications FOR SELECT
  USING (auth.uid() = from_user_id OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_applications.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

CREATE POLICY "Users can create applications"
  ON public.team_applications FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update their own applications"
  ON public.team_applications FOR UPDATE
  USING (auth.uid() = from_user_id OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_applications.team_id
        AND tm.user_id = auth.uid()
        AND tm.team_role IN ('captain', 'coach')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_user ON public.team_invites(to_user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON public.team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_applications_user ON public.team_applications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_team_applications_team ON public.team_applications(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_current_team ON public.profiles(current_team_id);

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_team_applications_updated_at
  BEFORE UPDATE ON public.team_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add foreign key for current_team_id
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_current_team
FOREIGN KEY (current_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;