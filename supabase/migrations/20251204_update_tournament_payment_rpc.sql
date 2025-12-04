CREATE OR REPLACE FUNCTION update_tournament_with_payment(
  p_tournament_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_format tournament_format,
  p_start_time TIMESTAMPTZ,
  p_prize_pool TEXT,
  p_max_teams INTEGER,
  p_rules TEXT
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
    rules = p_rules
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
