-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'player' CHECK (role IN ('player', 'admin', 'publisher', 'organizer'));

-- Migrate existing roles from user_roles table
-- We take the most privileged role if a user has multiple (though the UI seemed to imply one, the table allowed multiple)
-- Priority: admin > publisher > organizer > player
UPDATE profiles
SET role = 'admin'
WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin');

UPDATE profiles
SET role = 'publisher'
WHERE role = 'player' AND id IN (SELECT user_id FROM user_roles WHERE role = 'publisher');

UPDATE profiles
SET role = 'organizer'
WHERE role = 'player' AND id IN (SELECT user_id FROM user_roles WHERE role = 'organizer');

-- Update RLS policies for profiles to allow admins to update roles
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- Drop dependent policies
DROP POLICY IF EXISTS "Publishers/Admins can manage posts" ON posts;

-- Recreate policy using profiles.role
CREATE POLICY "Publishers/Admins can manage posts" ON posts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('publisher', 'admin'))
);

-- Update is_admin function to use profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now safe to drop the old table
DROP TABLE IF EXISTS user_roles;
