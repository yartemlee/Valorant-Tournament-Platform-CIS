-- Migration: Flexible Tournaments, VCT Veto System, Match Requests with Chat
-- Date: 2025-12-23

-- =============================================================================
-- 1. EXTEND TOURNAMENT FORMAT ENUM
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'round_robin' AND enumtypid = 'public.tournament_format'::regtype) THEN
    ALTER TYPE public.tournament_format ADD VALUE 'round_robin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'swiss' AND enumtypid = 'public.tournament_format'::regtype) THEN
    ALTER TYPE public.tournament_format ADD VALUE 'swiss';
  END IF;
END$$;

-- =============================================================================
-- 2. ADD SETTINGS JSONB TO TOURNAMENTS
-- =============================================================================
ALTER TABLE public.tournaments
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "team_size": 5,
  "match_format": "bo1",
  "veto_enabled": false,
  "veto_time_limit": 60,
  "map_pool": ["Abyss", "Ascent", "Bind", "Lotus", "Sunset", "Haven", "Split"],
  "rank_min": null,
  "rank_max": null,
  "servers": ["eu"]
}'::jsonb;

COMMENT ON COLUMN public.tournaments.settings IS 'Flexible tournament settings: team_size, match_format, veto_enabled, veto_time_limit, map_pool, rank_min, rank_max, servers';

-- =============================================================================
-- 3. CREATE MATCH VETO TABLE (VCT Veto System)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.match_veto (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  action_order INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('ban', 'pick', 'side_pick')),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  map_name TEXT,
  side TEXT CHECK (side IS NULL OR side IN ('attack', 'defense')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(match_id, action_order)
);

CREATE INDEX IF NOT EXISTS idx_match_veto_match_id ON public.match_veto(match_id);

ALTER TABLE public.match_veto ENABLE ROW LEVEL SECURITY;

-- Everyone can view veto actions
CREATE POLICY "Match veto viewable by everyone" ON public.match_veto FOR SELECT USING (true);

-- Team managers can insert veto actions for their matches
CREATE POLICY "Team managers can insert veto actions" ON public.match_veto FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_veto.match_id
    AND (public.is_team_manager(m.team1_id) OR public.is_team_manager(m.team2_id))
  )
);

-- =============================================================================
-- 4. CREATE MATCH REQUESTS TABLE (Complaints/Issues)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.match_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('no_show', 'toxic', 'cheat_suspect', 'technical', 'other')),
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_requests_match_id ON public.match_requests(match_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_reporter_id ON public.match_requests(reporter_id);
CREATE INDEX IF NOT EXISTS idx_match_requests_status ON public.match_requests(status);

ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own requests" ON public.match_requests FOR SELECT USING (reporter_id = auth.uid());

-- Organizers can view requests for their tournaments
CREATE POLICY "Organizers can view requests for their tournaments" ON public.match_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_requests.match_id AND t.organizer_id = auth.uid()
  )
);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON public.match_requests FOR SELECT USING (public.is_admin());

-- Users can create requests
CREATE POLICY "Users can create requests" ON public.match_requests FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Organizers can update requests for their tournaments
CREATE POLICY "Organizers can update requests" ON public.match_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.tournaments t ON m.tournament_id = t.id
    WHERE m.id = match_requests.match_id AND t.organizer_id = auth.uid()
  )
);

-- Admins can update any request
CREATE POLICY "Admins can update any request" ON public.match_requests FOR UPDATE USING (public.is_admin());

-- =============================================================================
-- 5. CREATE MATCH REQUEST MESSAGES TABLE (Chat in Requests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.match_request_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.match_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_request_messages_request_id ON public.match_request_messages(request_id);

ALTER TABLE public.match_request_messages ENABLE ROW LEVEL SECURITY;

-- Request participants can view messages
CREATE POLICY "Request participants can view messages" ON public.match_request_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.match_requests mr
    WHERE mr.id = match_request_messages.request_id
    AND (
      mr.reporter_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.matches m
        JOIN public.tournaments t ON m.tournament_id = t.id
        WHERE m.id = mr.match_id AND t.organizer_id = auth.uid()
      )
      OR public.is_admin()
    )
  )
);

-- Request participants can send messages
CREATE POLICY "Request participants can send messages" ON public.match_request_messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.match_requests mr
    WHERE mr.id = match_request_messages.request_id
    AND (
      mr.reporter_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.matches m
        JOIN public.tournaments t ON m.tournament_id = t.id
        WHERE m.id = mr.match_id AND t.organizer_id = auth.uid()
      )
      OR public.is_admin()
    )
  )
);

-- =============================================================================
-- 6. ENABLE REALTIME FOR NEW TABLES
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_veto;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_request_messages;

-- =============================================================================
-- 7. TRIGGER FOR UPDATED_AT ON MATCH_REQUESTS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_match_requests_updated_at ON public.match_requests;
CREATE TRIGGER set_match_requests_updated_at
  BEFORE UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
