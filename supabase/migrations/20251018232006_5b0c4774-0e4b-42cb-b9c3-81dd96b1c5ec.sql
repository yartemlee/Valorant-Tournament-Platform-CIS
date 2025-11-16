-- Add social media and profile fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status TEXT,
ADD COLUMN IF NOT EXISTS discord_username TEXT,
ADD COLUMN IF NOT EXISTS twitch_username TEXT,
ADD COLUMN IF NOT EXISTS youtube_username TEXT,
ADD COLUMN IF NOT EXISTS tiktok_username TEXT,
ADD COLUMN IF NOT EXISTS tracker_gg_username TEXT,
ADD COLUMN IF NOT EXISTS twitter_username TEXT,
ADD COLUMN IF NOT EXISTS about_me TEXT,
ADD COLUMN IF NOT EXISTS current_rank TEXT,
ADD COLUMN IF NOT EXISTS peak_rank TEXT,
ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_country BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS discord_notifications BOOLEAN DEFAULT false;

-- Add check constraint for about_me length
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_about_me_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_about_me_check CHECK (length(about_me) <= 300);
  END IF;
END $$;

-- Create enum for role comfort levels
DO $$ BEGIN
  CREATE TYPE comfort_level AS ENUM ('not_played', 'learning', 'average', 'good', 'perfect');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for valorant roles
DO $$ BEGIN
  CREATE TYPE valorant_role AS ENUM ('duelist', 'initiator', 'controller', 'sentinel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create player_roles table
CREATE TABLE IF NOT EXISTS public.player_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role valorant_role NOT NULL,
  comfort_level comfort_level NOT NULL DEFAULT 'not_played',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on player_roles
ALTER TABLE public.player_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_roles' AND policyname = 'Player roles are viewable by everyone'
  ) THEN
    CREATE POLICY "Player roles are viewable by everyone"
    ON public.player_roles FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_roles' AND policyname = 'Users can insert their own roles'
  ) THEN
    CREATE POLICY "Users can insert their own roles"
    ON public.player_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_roles' AND policyname = 'Users can update their own roles'
  ) THEN
    CREATE POLICY "Users can update their own roles"
    ON public.player_roles FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_roles' AND policyname = 'Users can delete their own roles'
  ) THEN
    CREATE POLICY "Users can delete their own roles"
    ON public.player_roles FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create player_agents table
CREATE TABLE IF NOT EXISTS public.player_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  skill_level comfort_level NOT NULL DEFAULT 'not_played',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, agent_name)
);

-- Enable RLS on player_agents
ALTER TABLE public.player_agents ENABLE ROW LEVEL SECURITY;

-- RLS policies for player_agents
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_agents' AND policyname = 'Player agents are viewable by everyone'
  ) THEN
    CREATE POLICY "Player agents are viewable by everyone"
    ON public.player_agents FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_agents' AND policyname = 'Users can insert their own agents'
  ) THEN
    CREATE POLICY "Users can insert their own agents"
    ON public.player_agents FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_agents' AND policyname = 'Users can update their own agents'
  ) THEN
    CREATE POLICY "Users can update their own agents"
    ON public.player_agents FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'player_agents' AND policyname = 'Users can delete their own agents'
  ) THEN
    CREATE POLICY "Users can delete their own agents"
    ON public.player_agents FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'achievements' AND policyname = 'Achievements are viewable by everyone'
  ) THEN
    CREATE POLICY "Achievements are viewable by everyone"
    ON public.achievements FOR SELECT
    USING (true);
  END IF;
END $$;

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tournament_name TEXT,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_achievements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'User achievements are viewable by everyone'
  ) THEN
    CREATE POLICY "User achievements are viewable by everyone"
    ON public.user_achievements FOR SELECT
    USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_achievements' AND policyname = 'Users can insert their own achievements'
  ) THEN
    CREATE POLICY "Users can insert their own achievements"
    ON public.user_achievements FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create medals table for tournament placements
CREATE TABLE IF NOT EXISTS public.tournament_medals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  placement INTEGER NOT NULL CHECK (placement >= 1 AND placement <= 3),
  tournament_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tournament_medals
ALTER TABLE public.tournament_medals ENABLE ROW LEVEL SECURITY;

-- RLS policies for tournament_medals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tournament_medals' AND policyname = 'Tournament medals are viewable by everyone'
  ) THEN
    CREATE POLICY "Tournament medals are viewable by everyone"
    ON public.tournament_medals FOR SELECT
    USING (true);
  END IF;
END $$;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_player_roles_updated_at ON public.player_roles;
CREATE TRIGGER update_player_roles_updated_at
BEFORE UPDATE ON public.player_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_player_agents_updated_at ON public.player_agents;
CREATE TRIGGER update_player_agents_updated_at
BEFORE UPDATE ON public.player_agents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();