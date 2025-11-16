-- Create secure RPC for updating team settings (captain only)
CREATE OR REPLACE FUNCTION public.update_team_settings(
  team_id_input uuid,
  new_name text DEFAULT NULL,
  new_tag text DEFAULT NULL,
  new_logo_url text DEFAULT NULL,
  new_description text DEFAULT NULL,
  new_is_recruiting boolean DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result_row json;
BEGIN
  -- Validate caller is current captain
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_input
      AND user_id = auth.uid()
      AND team_role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;
  
  -- Update team settings (only provided fields)
  UPDATE teams
  SET
    name = COALESCE(new_name, name),
    tag = COALESCE(new_tag, tag),
    logo_url = COALESCE(new_logo_url, logo_url),
    description = COALESCE(new_description, description),
    is_recruiting = COALESCE(new_is_recruiting, is_recruiting),
    updated_at = now()
  WHERE id = team_id_input
  RETURNING json_build_object(
    'id', id,
    'name', name,
    'tag', tag,
    'logo_url', logo_url,
    'description', description,
    'is_recruiting', is_recruiting
  ) INTO result_row;
  
  RETURN result_row;
END;
$$;

-- Create secure RPC for changing member role (captain only)
CREATE OR REPLACE FUNCTION public.set_member_role(
  team_id_input uuid,
  member_user_id uuid,
  new_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result_row json;
BEGIN
  -- Validate caller is current captain
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_input
      AND user_id = auth.uid()
      AND team_role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;
  
  -- Prevent changing own role
  IF member_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_change_own_role';
  END IF;
  
  -- Only allow player or coach roles
  IF new_role NOT IN ('player', 'coach') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;
  
  -- Update member role
  UPDATE team_members
  SET team_role = new_role
  WHERE team_id = team_id_input
    AND user_id = member_user_id
  RETURNING json_build_object(
    'id', id,
    'user_id', user_id,
    'team_role', team_role
  ) INTO result_row;
  
  IF result_row IS NULL THEN
    RAISE EXCEPTION 'member_not_found';
  END IF;
  
  RETURN result_row;
END;
$$;

-- Create secure RPC for kicking member (captain only)
CREATE OR REPLACE FUNCTION public.kick_member(
  team_id_input uuid,
  member_user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Validate caller is current captain
  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_input
      AND user_id = auth.uid()
      AND team_role = 'captain'
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;
  
  -- Prevent kicking self
  IF member_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_kick_self';
  END IF;
  
  -- Remove member from team
  DELETE FROM team_members
  WHERE team_id = team_id_input
    AND user_id = member_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'member_not_found';
  END IF;
  
  -- Clear current_team_id from profile
  UPDATE profiles
  SET current_team_id = NULL
  WHERE id = member_user_id;
  
  result := json_build_object(
    'team_id', team_id_input,
    'kicked_user_id', member_user_id
  );
  
  RETURN result;
END;
$$;