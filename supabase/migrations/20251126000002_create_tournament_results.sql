-- Migration: Create tournament_results table
-- Description: Stores the final results of a tournament including winners

CREATE TABLE IF NOT EXISTS public.tournament_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  first_place_team_ids UUID[] DEFAULT '{}',
  second_place_team_ids UUID[] DEFAULT '{}',
  third_place_team_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(tournament_id)
);

-- Enable RLS
ALTER TABLE public.tournament_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tournament results are viewable by everyone" 
  ON public.tournament_results FOR SELECT USING (true);

CREATE POLICY "System can insert results" 
  ON public.tournament_results FOR INSERT WITH CHECK (true);
