-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  bracket_format TEXT NOT NULL CHECK (bracket_format IN ('single_elimination', 'double_elimination')),
  date_start TIMESTAMP WITH TIME ZONE NOT NULL,
  prize TEXT,
  region TEXT,
  participant_limit INTEGER DEFAULT 16,
  rules TEXT,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ongoing', 'completed')),
  registration_open BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tournament_participants table
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'withdrawn')),
  UNIQUE(tournament_id, user_id)
);

-- Create tournament_results table
CREATE TABLE public.tournament_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
  first_place_team_ids UUID[],
  second_place_team_ids UUID[],
  third_place_team_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add medal counters to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS medals_gold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medals_silver INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS medals_bronze INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournaments
CREATE POLICY "Tournaments are viewable by everyone"
  ON public.tournaments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tournaments"
  ON public.tournaments FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tournament owners can update their tournaments"
  ON public.tournaments FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Tournament owners can delete their tournaments"
  ON public.tournaments FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for tournament_participants
CREATE POLICY "Tournament participants are viewable by everyone"
  ON public.tournament_participants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join tournaments"
  ON public.tournament_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can withdraw from tournaments"
  ON public.tournament_participants FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON public.tournament_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for tournament_results
CREATE POLICY "Tournament results are viewable by everyone"
  ON public.tournament_results FOR SELECT
  USING (true);

CREATE POLICY "Tournament owners can add results"
  ON public.tournament_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND owner_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();