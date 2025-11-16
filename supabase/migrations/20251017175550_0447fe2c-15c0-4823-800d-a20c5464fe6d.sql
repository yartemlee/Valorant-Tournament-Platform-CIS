-- Create a function to get email by username
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_id_found uuid;
BEGIN
  -- Get user_id from profiles by username
  SELECT id INTO user_id_found
  FROM public.profiles
  WHERE username = username_input
  LIMIT 1;

  -- If user not found, return null
  IF user_id_found IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id_found;

  RETURN user_email;
END;
$$;