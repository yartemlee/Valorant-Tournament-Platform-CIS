-- Add coins column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0 NOT NULL;

-- Create RPC to create tournament with payment
CREATE OR REPLACE FUNCTION create_tournament_with_payment(
  p_title TEXT,
  p_description TEXT,
  p_format tournament_format,
  p_start_time TIMESTAMPTZ,
  p_prize_pool TEXT,
  p_max_teams INTEGER,
  p_rules TEXT,
  p_banner_url TEXT
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
  -- If prize pool is empty or not a number, treat as 0 for cost calculation but keep original text
  IF p_prize_pool IS NULL OR p_prize_pool = '' THEN
    v_prize_amount := 0;
  ELSE
    BEGIN
      v_prize_amount := p_prize_pool::INTEGER;
    EXCEPTION WHEN OTHERS THEN
      -- If it's not a valid integer (e.g. "$500"), try to strip non-digits or just fail
      -- For now, let's assume the frontend sends a clean number string or we fail
      RAISE EXCEPTION 'Invalid prize pool amount. Please enter a valid number.';
    END;
  END IF;

  -- Calculate total cost
  v_total_cost := v_prize_amount + 100;

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
    banner_url,
    organizer_id,
    status
  ) VALUES (
    p_title,
    p_description,
    p_format,
    p_start_time,
    p_prize_pool,
    p_max_teams,
    p_rules,
    p_banner_url,
    v_user_id,
    'registration'
  )
  RETURNING id INTO v_tournament_id;

  RETURN jsonb_build_object(
    'id', v_tournament_id,
    'coins_deducted', v_total_cost,
    'remaining_balance', v_user_coins - v_total_cost
  );
END;
$$;
