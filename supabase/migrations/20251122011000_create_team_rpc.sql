-- Function to create a team atomically
CREATE OR REPLACE FUNCTION public.create_team_with_captain(
  name_input TEXT,
  tag_input TEXT,
  description_input TEXT,
  logo_url_input TEXT,
  is_recruiting_input BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Start transaction implied by function execution

  -- 1. Create the team
  INSERT INTO public.teams (
    name,
    tag,
    description,
    logo_url,
    captain_id,
    is_recruiting
  )
  VALUES (
    name_input,
    tag_input,
    description_input,
    logo_url_input,
    auth.uid(),
    is_recruiting_input
  )
  RETURNING id INTO new_team_id;

  -- 2. Add the creator as captain in team_members
  -- This will now pass RLS because of "Initial captain can join empty team" policy
  -- OR because the function is SECURITY DEFINER (if we choose to make it so).
  -- However, better to rely on RLS if possible, or make this function SECURITY DEFINER to be safe against race conditions.
  -- Let's make it standard first. If RLS is correct, this works.
  
  INSERT INTO public.team_members (
    team_id,
    user_id,
    role
  )
  VALUES (
    new_team_id,
    auth.uid(),
    'captain'
  );
  
  -- 3. Update profile current_team_id
  UPDATE public.profiles
  SET current_team_id = new_team_id
  WHERE id = auth.uid();

  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

