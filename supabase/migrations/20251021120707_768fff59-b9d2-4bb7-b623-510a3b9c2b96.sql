-- Create atomic captain transfer function
CREATE OR REPLACE FUNCTION public.transfer_captain(
  target_team_id uuid,
  new_captain_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_captain_id uuid;
  old_captain_member_id uuid;
  new_captain_member_id uuid;
  result json;
BEGIN
  -- Verify caller is the current captain
  SELECT tm.id, tm.user_id INTO old_captain_member_id, current_captain_id
  FROM team_members tm
  WHERE tm.team_id = target_team_id
    AND tm.team_role = 'captain'
  LIMIT 1;
  
  IF current_captain_id IS NULL THEN
    RAISE EXCEPTION 'no_captain_found';
  END IF;
  
  IF current_captain_id != auth.uid() THEN
    RAISE EXCEPTION 'not_current_captain';
  END IF;
  
  -- Verify new captain is a member of this team
  SELECT tm.id INTO new_captain_member_id
  FROM team_members tm
  WHERE tm.team_id = target_team_id
    AND tm.user_id = new_captain_user_id
  LIMIT 1;
  
  IF new_captain_member_id IS NULL THEN
    RAISE EXCEPTION 'new_captain_not_member';
  END IF;
  
  -- Perform atomic transfer
  -- Set current captain to player
  UPDATE team_members
  SET team_role = 'player'
  WHERE id = old_captain_member_id;
  
  -- Set new captain
  UPDATE team_members
  SET team_role = 'captain'
  WHERE id = new_captain_member_id;
  
  -- Build result
  result := json_build_object(
    'team_id', target_team_id,
    'old_captain_user_id', current_captain_id,
    'new_captain_user_id', new_captain_user_id
  );
  
  RETURN result;
END;
$$;