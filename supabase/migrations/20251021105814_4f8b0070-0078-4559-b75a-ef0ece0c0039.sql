-- Prevent users who already belong to a team from creating new applications
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can create applications" ON team_applications;

-- Recreate with check that user is not already in a team
CREATE POLICY "Users can create applications" 
ON team_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.current_team_id IS NULL
  )
);