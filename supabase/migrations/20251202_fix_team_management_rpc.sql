-- Function to kick a member from a team
CREATE OR REPLACE FUNCTION public.kick_member(team_id UUID, user_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if executor is captain
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id AND captain_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;

  -- Prevent self-kick
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_kick_self';
  END IF;

  DELETE FROM public.team_members
  WHERE team_members.team_id = kick_member.team_id
  AND team_members.user_id = kick_member.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set a member's role
CREATE OR REPLACE FUNCTION public.set_member_role(team_id UUID, user_id UUID, new_role public.team_role)
RETURNS void AS $$
BEGIN
  -- Check if executor is captain
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id AND captain_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_captain';
  END IF;

  -- Prevent changing own role
  IF user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot_change_own_role';
  END IF;

  UPDATE public.team_members
  SET role = new_role
  WHERE team_members.team_id = set_member_role.team_id
  AND team_members.user_id = set_member_role.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer captaincy
CREATE OR REPLACE FUNCTION public.transfer_captain(team_id UUID, new_captain_id UUID)
RETURNS void AS $$
BEGIN
  -- Check if executor is captain
  IF NOT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = team_id AND captain_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_current_captain';
  END IF;

  -- Check if new captain is a member
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = transfer_captain.team_id
    AND team_members.user_id = new_captain_id
  ) THEN
    RAISE EXCEPTION 'new_captain_not_member';
  END IF;

  -- Update team captain
  UPDATE public.teams
  SET captain_id = new_captain_id
  WHERE id = team_id;

  -- Update roles
  -- Old captain becomes member
  UPDATE public.team_members
  SET role = 'member'
  WHERE team_members.team_id = transfer_captain.team_id
  AND team_members.user_id = auth.uid();

  -- New captain becomes captain
  UPDATE public.team_members
  SET role = 'captain'
  WHERE team_members.team_id = transfer_captain.team_id
  AND team_members.user_id = new_captain_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
