-- Политика для приема приглашений в команду
-- Пользователь может добавить себя в команду, если у него есть активное приглашение

CREATE POLICY "Users can accept team invitations" ON public.team_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE team_id = team_members.team_id
      AND invited_user_id = auth.uid()
      AND status = 'pending'
  )
);

