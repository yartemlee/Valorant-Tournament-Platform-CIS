-- Drop the old foreign key that references auth.users
ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- Create new foreign key that references profiles table
ALTER TABLE team_members 
ADD CONSTRAINT team_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;