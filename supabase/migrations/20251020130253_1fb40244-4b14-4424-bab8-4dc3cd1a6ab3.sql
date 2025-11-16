-- Добавляем политику, позволяющую пользователям добавлять себя в команду при наличии приглашения
CREATE POLICY "Users can join team with valid invite"
ON public.team_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM team_invites
    WHERE team_invites.team_id = team_members.team_id
      AND team_invites.to_user_id = auth.uid()
      AND team_invites.status = 'pending'
  )
);