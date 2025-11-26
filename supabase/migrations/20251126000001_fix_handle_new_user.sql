-- Migration: Fix handle_new_user function and ensure nickname column is removed
-- Description: Updates handle_new_user to not use nickname column, and drops the column if it exists

-- Drop nickname column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS nickname;

-- Redefine handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
