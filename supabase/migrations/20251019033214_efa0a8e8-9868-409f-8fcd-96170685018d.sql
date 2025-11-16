-- Create matches table for tournament bracket
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  match_number integer NOT NULL,
  bracket_type text NOT NULL CHECK (bracket_type IN ('upper', 'lower', 'final', 'third_place')),
  team1_id uuid REFERENCES public.profiles(id),
  team2_id uuid REFERENCES public.profiles(id),
  team1_score integer DEFAULT 0,
  team2_score integer DEFAULT 0,
  winner_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  scheduled_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create tournament notifications table
CREATE TABLE IF NOT EXISTS public.tournament_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('30min', '15min', '5min', 'started')),
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Add tournament start confirmation field
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS bracket_generated boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
CREATE POLICY "Tournament matches are viewable by everyone"
ON public.tournament_matches FOR SELECT
USING (true);

CREATE POLICY "Tournament owners can manage matches"
ON public.tournament_matches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE tournaments.id = tournament_matches.tournament_id 
    AND tournaments.owner_id = auth.uid()
  )
);

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.tournament_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.tournament_notifications FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_tournament_id ON public.tournament_notifications(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_notifications_user_id ON public.tournament_notifications(user_id);