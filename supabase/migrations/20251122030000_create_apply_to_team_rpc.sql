-- Function to apply to a team with validation
CREATE OR REPLACE FUNCTION public.rpc_apply_to_team(
  target_team_id UUID,
  note TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  user_team_id UUID;
  existing_application_id UUID;
  new_application_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check if user is already in a team
  SELECT current_team_id INTO user_team_id
  FROM public.profiles
  WHERE id = current_user_id;

  IF user_team_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_in_team';
  END IF;

  -- Check if there's already a pending application
  SELECT id INTO existing_application_id
  FROM public.team_applications
  WHERE team_id = target_team_id 
    AND applicant_id = current_user_id 
    AND status = 'pending';

  IF existing_application_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_pending';
  END IF;

  -- Check if team exists and is recruiting
  IF NOT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = target_team_id AND is_recruiting = true
  ) THEN
    RAISE EXCEPTION 'team_not_recruiting';
  END IF;

  -- Check if team is full
  IF (
    SELECT COUNT(*) 
    FROM public.team_members 
    WHERE team_id = target_team_id
  ) >= 10 THEN
    RAISE EXCEPTION 'team_full';
  END IF;

  -- Create the application
  INSERT INTO public.team_applications (
    team_id,
    applicant_id,
    message,
    status
  )
  VALUES (
    target_team_id,
    current_user_id,
    note,
    'pending'
  )
  RETURNING id INTO new_application_id;

  -- Return success with application ID
  RETURN json_build_object(
    'success', true,
    'application_id', new_application_id
  );

EXCEPTION
  WHEN others THEN
    -- Re-raise the exception so it can be caught by the client
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.rpc_apply_to_team(UUID, TEXT) TO authenticated;

