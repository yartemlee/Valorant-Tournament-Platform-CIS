-- Обновляем политики для команд, чтобы тренеры имели те же права что и капитаны
DROP POLICY IF EXISTS "Team owners can update their teams" ON teams;
CREATE POLICY "Team owners and coaches can update their teams" 
ON teams 
FOR UPDATE 
USING (
  auth.uid() = owner_id OR 
  is_team_captain_or_coach(id)
);

-- Обновляем политику для tournament_participants, чтобы тренеры могли регистрировать команды
DROP POLICY IF EXISTS "Authenticated users can join tournaments" ON tournament_participants;
CREATE POLICY "Users and team coaches can join tournaments" 
ON tournament_participants 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.team_role IN ('captain', 'coach')
    AND tm.team_id IN (
      SELECT current_team_id FROM profiles WHERE id = tournament_participants.user_id
    )
  )
);