-- Migration: Add Substitution Logic and Update Tournament RPCs
-- Description: Adds substitution_limit to tournaments, creates substitution_requests table, adds substitution RPCs, and updates tournament creation/editing RPCs.

-- 1. Add substitution_limit to tournaments
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS substitution_limit INTEGER DEFAULT 0;

-- 2. Create substitution_requests table
CREATE TABLE IF NOT EXISTS public.substitution_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    requester_id UUID REFERENCES public.profiles(id),
    player_out_id UUID REFERENCES public.profiles(id),
    player_in_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.substitution_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizers can view all requests for their tournaments
CREATE POLICY "Organizers can view requests for their tournaments" ON public.substitution_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE id = substitution_requests.tournament_id
            AND organizer_id = auth.uid()
        )
    );

-- Organizers can update requests (approve/reject)
CREATE POLICY "Organizers can update requests" ON public.substitution_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE id = substitution_requests.tournament_id
            AND organizer_id = auth.uid()
        )
    );

-- Team captains/coaches can view their own requests
CREATE POLICY "Team leaders can view their own requests" ON public.substitution_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = substitution_requests.team_id
            AND user_id = auth.uid()
            AND role IN ('captain', 'coach')
        )
    );

-- Team leaders can create requests
CREATE POLICY "Team leaders can create requests" ON public.substitution_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = substitution_requests.team_id
            AND user_id = auth.uid()
            AND role IN ('captain', 'coach')
        )
    );

-- 3. RPC: Request Substitution
CREATE OR REPLACE FUNCTION public.request_substitution(
    p_tournament_id UUID,
    p_team_id UUID,
    p_player_out_id UUID,
    p_player_in_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_limit INTEGER;
    v_count INTEGER;
    v_roster UUID[];
BEGIN
    -- Check if tournament allows substitutions
    SELECT substitution_limit INTO v_limit
    FROM public.tournaments
    WHERE id = p_tournament_id;

    IF v_limit <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Substitutions are not allowed in this tournament');
    END IF;

    -- Check how many APPROVED requests this team already has
    SELECT COUNT(*) INTO v_count
    FROM public.substitution_requests
    WHERE tournament_id = p_tournament_id
    AND team_id = p_team_id
    AND status = 'approved';

    IF v_count >= v_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Substitution limit reached');
    END IF;

    -- Check if player_out is in the current roster
    SELECT selected_roster INTO v_roster
    FROM public.tournament_registrations
    WHERE tournament_id = p_tournament_id AND team_id = p_team_id;

    IF NOT (p_player_out_id = ANY(v_roster)) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Player to remove is not in the roster');
    END IF;

    -- Check if player_in is NOT in the current roster
    IF p_player_in_id = ANY(v_roster) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Player to add is already in the roster');
    END IF;

    -- Insert request
    INSERT INTO public.substitution_requests (
        tournament_id, team_id, requester_id, player_out_id, player_in_id
    ) VALUES (
        p_tournament_id, p_team_id, auth.uid(), p_player_out_id, p_player_in_id
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: Process Substitution (Approve/Reject)
CREATE OR REPLACE FUNCTION public.process_substitution(
    p_request_id UUID,
    p_status TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_roster UUID[];
    v_new_roster UUID[];
BEGIN
    -- Get request details
    SELECT * INTO v_req
    FROM public.substitution_requests
    WHERE id = p_request_id;

    IF v_req IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request not found');
    END IF;

    -- Verify permission (Organizer)
    IF NOT EXISTS (
        SELECT 1 FROM public.tournaments
        WHERE id = v_req.tournament_id
        AND organizer_id = auth.uid()
    ) AND NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Permission denied');
    END IF;

    -- Update status
    UPDATE public.substitution_requests
    SET status = p_status
    WHERE id = p_request_id;

    -- If approved, update the roster
    IF p_status = 'approved' THEN
        -- Get current roster
        SELECT selected_roster INTO v_roster
        FROM public.tournament_registrations
        WHERE tournament_id = v_req.tournament_id AND team_id = v_req.team_id;

        -- Remove player_out and add player_in
        v_new_roster := array_remove(v_roster, v_req.player_out_id);
        v_new_roster := array_append(v_new_roster, v_req.player_in_id);

        -- Update registration
        UPDATE public.tournament_registrations
        SET selected_roster = v_new_roster
        WHERE tournament_id = v_req.tournament_id AND team_id = v_req.team_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update create_tournament_with_payment to include substitution_limit
CREATE OR REPLACE FUNCTION create_tournament_with_payment(
  p_title TEXT,
  p_description TEXT,
  p_format tournament_format,
  p_start_time TIMESTAMPTZ,
  p_prize_pool TEXT,
  p_max_teams INTEGER,
  p_rules TEXT,
  p_substitution_limit INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_prize_amount INTEGER;
  v_total_cost INTEGER;
  v_tournament_id UUID;
  v_user_coins INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Parse prize pool
  IF p_prize_pool IS NULL OR p_prize_pool = '' THEN
    v_prize_amount := 0;
  ELSE
    BEGIN
      v_prize_amount := p_prize_pool::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid prize pool amount. Please enter a valid number.';
    END;
  END IF;

  -- Calculate total cost
  v_total_cost := v_prize_amount + 1; -- Commission 1 VP

  -- Check user balance
  SELECT coins INTO v_user_coins
  FROM profiles
  WHERE id = v_user_id;

  IF v_user_coins < v_total_cost THEN
    RAISE EXCEPTION 'Insufficient funds. Required: %, Available: %', v_total_cost, v_user_coins;
  END IF;

  -- Deduct coins
  UPDATE profiles
  SET coins = coins - v_total_cost
  WHERE id = v_user_id;

  -- Create tournament
  INSERT INTO tournaments (
    title,
    description,
    format,
    start_time,
    prize_pool,
    max_teams,
    rules,
    organizer_id,
    status,
    substitution_limit
  ) VALUES (
    p_title,
    p_description,
    p_format,
    p_start_time,
    p_prize_pool,
    p_max_teams,
    p_rules,
    v_user_id,
    'registration',
    p_substitution_limit
  )
  RETURNING id INTO v_tournament_id;

  RETURN jsonb_build_object(
    'id', v_tournament_id,
    'coins_deducted', v_total_cost,
    'remaining_balance', v_user_coins - v_total_cost
  );
END;
$$;

-- 6. Update update_tournament_with_payment to include substitution_limit
CREATE OR REPLACE FUNCTION update_tournament_with_payment(
  p_tournament_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_format tournament_format,
  p_start_time TIMESTAMPTZ,
  p_prize_pool TEXT,
  p_max_teams INTEGER,
  p_rules TEXT,
  p_substitution_limit INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_old_prize_pool TEXT;
  v_old_prize_amount INTEGER;
  v_new_prize_amount INTEGER;
  v_diff_amount INTEGER;
  v_total_cost INTEGER := 0;
  v_user_coins INTEGER;
  v_tournament_status TEXT;
  v_organizer_id UUID;
  v_coins_before INTEGER;
  v_coins_after INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get current tournament data
  SELECT prize_pool, status, organizer_id INTO v_old_prize_pool, v_tournament_status, v_organizer_id
  FROM tournaments
  WHERE id = p_tournament_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournament not found';
  END IF;

  -- Verify ownership
  IF v_organizer_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check status
  IF v_tournament_status IN ('active', 'completed') THEN
    RAISE EXCEPTION 'Cannot edit active or completed tournament';
  END IF;

  -- Parse old prize pool
  IF v_old_prize_pool IS NULL OR v_old_prize_pool = '' THEN
    v_old_prize_amount := 0;
  ELSE
    BEGIN
      v_old_prize_amount := v_old_prize_pool::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      v_old_prize_amount := 0;
    END;
  END IF;

  -- Parse new prize pool
  IF p_prize_pool IS NULL OR p_prize_pool = '' THEN
    v_new_prize_amount := 0;
  ELSE
    BEGIN
      v_new_prize_amount := p_prize_pool::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid prize pool amount';
    END;
  END IF;

  -- Validate prize pool change
  IF v_new_prize_amount < v_old_prize_amount THEN
    RAISE EXCEPTION 'Prize pool cannot be decreased';
  END IF;

  -- Calculate cost if increased
  IF v_new_prize_amount > v_old_prize_amount THEN
    v_diff_amount := v_new_prize_amount - v_old_prize_amount;
    v_total_cost := v_diff_amount;
  END IF;

  -- Process payment if needed
  IF v_total_cost > 0 THEN
    SELECT coins INTO v_user_coins FROM profiles WHERE id = v_user_id;
    v_coins_before := v_user_coins;
    
    IF v_user_coins < v_total_cost THEN
      RAISE EXCEPTION 'Insufficient funds. Required: %, Available: %', v_total_cost, v_user_coins;
    END IF;

    UPDATE profiles SET coins = coins - v_total_cost WHERE id = v_user_id
    RETURNING coins INTO v_coins_after;
  ELSE
    v_coins_after := v_user_coins;
  END IF;

  -- Update tournament
  UPDATE tournaments SET
    title = p_title,
    description = p_description,
    format = p_format,
    start_time = p_start_time,
    prize_pool = p_prize_pool,
    max_teams = p_max_teams,
    rules = p_rules,
    substitution_limit = p_substitution_limit
  WHERE id = p_tournament_id;

  RETURN jsonb_build_object(
    'success', true, 
    'cost', v_total_cost,
    'old_prize', v_old_prize_amount,
    'new_prize', v_new_prize_amount,
    'coins_before', v_coins_before,
    'coins_after', v_coins_after
  );
END;
$$;
