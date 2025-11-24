-- Valorant Tournament Platform MVP Schema
-- Consolidated Migration

-- -----------------------------------------------------------------------------
-- 1. ENUMS & TYPES
-- -----------------------------------------------------------------------------

-- User Roles (System level)
CREATE TYPE public.app_role AS ENUM ('admin', 'publisher', 'organizer', 'player');

-- Team Roles
CREATE TYPE public.team_role AS ENUM ('captain', 'coach', 'member');

-- Tournament Formats
CREATE TYPE public.tournament_format AS ENUM ('single_elimination', 'double_elimination');

-- Tournament Status
CREATE TYPE public.tournament_status AS ENUM ('draft', 'registration', 'active', 'completed', 'cancelled');

-- Match Status
CREATE TYPE public.match_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Scrim Status
CREATE TYPE public.scrim_status AS ENUM ('searching', 'in_progress', 'finished', 'cancelled');

-- Valorant Ranks
CREATE TYPE public.valorant_rank AS ENUM (
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant'
);

-- Valorant Regions (CIS specific focus but general structure)
CREATE TYPE public.valorant_region AS ENUM ('eu', 'na', 'ap', 'kr', 'br', 'latam');

-- -----------------------------------------------------------------------------
-- 2. PROFILES & USERS
-- -----------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT, -- Display name if different from username
  riot_id TEXT, -- Required for tournaments (Name#TAG)
  region public.valorant_region,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}'::jsonb, -- { "discord": "...", "twitch": "..." }
  main_agents TEXT[] DEFAULT '{}', -- Array of agent names
  rank public.valorant_rank,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User Roles Table (Many-to-Many for flexible permissions)
CREATE TABLE public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- -----------------------------------------------------------------------------
-- 3. TEAMS
-- -----------------------------------------------------------------------------

CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tag TEXT NOT NULL, -- Short tag (e.g. "TSM")
  description TEXT,
  logo_url TEXT,
  captain_id UUID NOT NULL REFERENCES public.profiles(id), -- Current captain
  is_recruiting BOOLEAN DEFAULT FALSE,
  min_rank public.valorant_rank, -- Recruitment requirement
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id) -- User can be in team only once
);

-- Constraint: User can be in only ONE team at a time?
-- Spec: "Игрок может быть только в одной команде одновременно"
-- We enforce this via a unique index on user_id (partial index potentially, or just check in app logic. 
-- DB constraint is safer).
CREATE UNIQUE INDEX unique_user_team_membership ON public.team_members(user_id);

CREATE TABLE public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.team_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------------
-- 4. TOURNAMENTS
-- -----------------------------------------------------------------------------

CREATE TABLE public.tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  organizer_id UUID NOT NULL REFERENCES public.profiles(id),
  format public.tournament_format NOT NULL DEFAULT 'single_elimination',
  status public.tournament_status NOT NULL DEFAULT 'draft',
  start_time TIMESTAMPTZ NOT NULL,
  max_teams INTEGER DEFAULT 16,
  min_players_per_team INTEGER DEFAULT 5,
  prize_pool TEXT, -- Text description for MVP (e.g. "$100" or "Respect")
  rules TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.tournament_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tournament_id, team_id)
);

CREATE TABLE public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team1_id UUID REFERENCES public.teams(id), -- Nullable for TBD
  team2_id UUID REFERENCES public.teams(id), -- Nullable for TBD
  winner_id UUID REFERENCES public.teams(id),
  start_time TIMESTAMPTZ,
  status public.match_status DEFAULT 'scheduled',
  round_number INTEGER NOT NULL, -- 1 = Ro16, 2 = QF, etc. or logic specific
  bracket_position INTEGER, -- For visual rendering
  score_team1 INTEGER DEFAULT 0,
  score_team2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------------
-- 5. SCRIMS
-- -----------------------------------------------------------------------------

CREATE TABLE public.scrims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL REFERENCES public.profiles(id), -- Can be any user
  region public.valorant_region,
  min_rank public.valorant_rank,
  max_rank public.valorant_rank,
  team_size INTEGER DEFAULT 5, -- 5v5 usually
  status public.scrim_status DEFAULT 'searching',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.scrim_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scrim_id UUID NOT NULL REFERENCES public.scrims(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id), -- User applying (captain)
  team_id UUID REFERENCES public.teams(id), -- Optional: apply as team
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------------
-- 6. SOCIAL & SYSTEM
-- -----------------------------------------------------------------------------

CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'team_invite', 'match_scheduled', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to redirect
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrim_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is captain or coach of a team
CREATE OR REPLACE FUNCTION public.is_team_manager(team_id_input UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = team_id_input 
      AND user_id = auth.uid() 
      AND role IN ('captain', 'coach')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TEAMS
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Captains can update their teams" ON public.teams FOR UPDATE USING (
  auth.uid() = captain_id OR public.is_team_manager(id)
);
CREATE POLICY "Any user can create a team" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Only captain can delete team" ON public.teams FOR DELETE USING (auth.uid() = captain_id);

-- TEAM MEMBERS
CREATE POLICY "Team members are viewable by everyone" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Team managers can manage members" ON public.team_members FOR ALL USING (
  public.is_team_manager(team_id)
);
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING (user_id = auth.uid());

-- TEAM INVITATIONS
CREATE POLICY "Users see invites sent to them" ON public.team_invitations FOR SELECT USING (invited_user_id = auth.uid());
CREATE POLICY "Team managers see invites sent by their team" ON public.team_invitations FOR SELECT USING (public.is_team_manager(team_id));
CREATE POLICY "Team managers can create invites" ON public.team_invitations FOR INSERT WITH CHECK (public.is_team_manager(team_id));
CREATE POLICY "Invited users can update status (accept/reject)" ON public.team_invitations FOR UPDATE USING (invited_user_id = auth.uid());
CREATE POLICY "Team managers can cancel invites" ON public.team_invitations FOR DELETE USING (public.is_team_manager(team_id));

-- TEAM APPLICATIONS
CREATE POLICY "Team managers see applications to their team" ON public.team_applications FOR SELECT USING (public.is_team_manager(team_id));
CREATE POLICY "Applicants see their own applications" ON public.team_applications FOR SELECT USING (applicant_id = auth.uid());
CREATE POLICY "Users can create applications" ON public.team_applications FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Team managers can update status" ON public.team_applications FOR UPDATE USING (public.is_team_manager(team_id));

-- TOURNAMENTS
CREATE POLICY "Tournaments viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Organizer can update own tournament" ON public.tournaments FOR UPDATE USING (auth.uid() = organizer_id OR public.is_admin());
CREATE POLICY "Users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizer/Admin can delete" ON public.tournaments FOR DELETE USING (auth.uid() = organizer_id OR public.is_admin());

-- TOURNAMENT REGISTRATIONS
CREATE POLICY "Registrations viewable by everyone" ON public.tournament_registrations FOR SELECT USING (true);
CREATE POLICY "Team managers can register" ON public.tournament_registrations FOR INSERT WITH CHECK (public.is_team_manager(team_id));
CREATE POLICY "Team managers can cancel registration" ON public.tournament_registrations FOR DELETE USING (public.is_team_manager(team_id));
CREATE POLICY "Organizer can manage registrations" ON public.tournament_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments WHERE id = tournament_registrations.tournament_id AND organizer_id = auth.uid())
);

-- MATCHES
CREATE POLICY "Matches viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Organizer can manage matches" ON public.matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments WHERE id = matches.tournament_id AND organizer_id = auth.uid()) OR public.is_admin()
);

-- SCRIMS
CREATE POLICY "Scrims viewable by everyone" ON public.scrims FOR SELECT USING (true);
CREATE POLICY "Users can create scrims" ON public.scrims FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update own scrims" ON public.scrims FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Host can delete own scrims" ON public.scrims FOR DELETE USING (auth.uid() = host_id);

-- POSTS
CREATE POLICY "Posts viewable by everyone" ON public.posts FOR SELECT USING (is_published = TRUE OR auth.uid() = author_id OR public.is_admin());
CREATE POLICY "Publishers/Admins can manage posts" ON public.posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('publisher', 'admin'))
);

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true); -- Usually triggered by functions, but allow insert for now.
CREATE POLICY "Users can update own notifications (mark read)" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- USER ROLES
CREATE POLICY "Roles viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());


