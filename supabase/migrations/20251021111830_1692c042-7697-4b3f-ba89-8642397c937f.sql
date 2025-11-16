-- Create secure RPC function to apply to a team with all validations
CREATE OR REPLACE FUNCTION public.rpc_apply_to_team(
  target_team_id uuid,
  note text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  applicant_id uuid;
  applicant_team_id uuid;
  result_row json;
BEGIN
  -- Get the authenticated user's ID
  applicant_id := auth.uid();
  
  IF applicant_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  
  -- Check if user is already in a team
  SELECT current_team_id INTO applicant_team_id
  FROM profiles
  WHERE id = applicant_id;
  
  IF applicant_team_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_in_team';
  END IF;
  
  -- Check for duplicate pending application
  IF EXISTS (
    SELECT 1 FROM team_applications
    WHERE team_id = target_team_id
      AND from_user_id = applicant_id
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'duplicate_pending';
  END IF;
  
  -- Insert the application
  INSERT INTO team_applications (team_id, from_user_id, note, status)
  VALUES (target_team_id, applicant_id, note, 'pending')
  RETURNING json_build_object(
    'id', id,
    'created_at', created_at,
    'status', status
  ) INTO result_row;
  
  RETURN result_row;
END;
$$;