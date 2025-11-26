-- Migration: Add award_tournament_medals RPC
-- Description: Securely awards medals to a team and its members, bypassing RLS

CREATE OR REPLACE FUNCTION public.award_tournament_medals(
  p_tournament_id UUID,
  p_team_id UUID,
  p_medal_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_col_name TEXT;
BEGIN
  -- Check permissions: Organizer or Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE id = p_tournament_id AND organizer_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only tournament organizer or admin can award medals';
  END IF;

  -- Determine column name
  IF p_medal_type = 'gold' THEN
    v_col_name := 'medals_gold';
  ELSIF p_medal_type = 'silver' THEN
    v_col_name := 'medals_silver';
  ELSIF p_medal_type = 'bronze' THEN
    v_col_name := 'medals_bronze';
  ELSE
    RAISE EXCEPTION 'Invalid medal type: %', p_medal_type;
  END IF;

  -- Update Team
  EXECUTE format('UPDATE public.teams SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', v_col_name, v_col_name)
  USING p_team_id;

  -- Update Members
  EXECUTE format('
    UPDATE public.profiles 
    SET %I = COALESCE(%I, 0) + 1 
    WHERE id IN (
      SELECT user_id FROM public.team_members WHERE team_id = $1
    )', v_col_name, v_col_name)
  USING p_team_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
