-- Drop old foreign key to auth.users
ALTER TABLE tournament_participants
  DROP CONSTRAINT IF EXISTS tournament_participants_user_id_fkey;

-- Add new foreign key to profiles
ALTER TABLE tournament_participants
  ADD CONSTRAINT tournament_participants_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;