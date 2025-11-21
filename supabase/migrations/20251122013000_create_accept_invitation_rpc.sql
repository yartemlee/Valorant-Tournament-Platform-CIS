-- RPC функция для безопасного принятия приглашения в команду
CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  invitation_id_input UUID
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_invited_user_id UUID;
  v_current_team_id UUID;
  v_member_count INTEGER;
  result JSON;
BEGIN
  -- Получаем данные приглашения
  SELECT team_id, invited_user_id
  INTO v_team_id, v_invited_user_id
  FROM public.team_invitations
  WHERE id = invitation_id_input
    AND invited_user_id = auth.uid()
    AND status = 'pending';

  -- Проверяем, что приглашение существует и принадлежит текущему пользователю
  IF v_team_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Приглашение не найдено или уже обработано'
    );
  END IF;

  -- Проверяем, не состоит ли пользователь уже в другой команде
  SELECT current_team_id INTO v_current_team_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_current_team_id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Вы уже состоите в команде. Сначала покиньте текущую команду.'
    );
  END IF;

  -- Проверяем лимит участников команды (макс. 10)
  SELECT COUNT(*) INTO v_member_count
  FROM public.team_members
  WHERE team_id = v_team_id;

  IF v_member_count >= 10 THEN
    -- Автоматически отклоняем приглашение
    UPDATE public.team_invitations
    SET status = 'declined', updated_at = NOW()
    WHERE id = invitation_id_input;

    RETURN json_build_object(
      'success', false,
      'error', 'В команде уже максимум участников (10)'
    );
  END IF;

  -- Добавляем пользователя в команду
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team_id, auth.uid(), 'member');

  -- Обновляем current_team_id в профиле
  UPDATE public.profiles
  SET current_team_id = v_team_id
  WHERE id = auth.uid();

  -- Обновляем статус приглашения на "accepted"
  UPDATE public.team_invitations
  SET status = 'accepted', updated_at = NOW()
  WHERE id = invitation_id_input;

  -- Отклоняем все остальные активные приглашения для этого пользователя
  UPDATE public.team_invitations
  SET status = 'declined', updated_at = NOW()
  WHERE invited_user_id = auth.uid()
    AND id != invitation_id_input
    AND status = 'pending';

  -- Отклоняем все активные заявки пользователя в другие команды
  UPDATE public.team_applications
  SET status = 'declined', updated_at = NOW()
  WHERE from_user_id = auth.uid()
    AND status = 'pending';

  RETURN json_build_object(
    'success', true,
    'team_id', v_team_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC функция для отклонения приглашения в команду
CREATE OR REPLACE FUNCTION public.decline_team_invitation(
  invitation_id_input UUID
)
RETURNS JSON AS $$
DECLARE
  v_invitation_exists BOOLEAN;
BEGIN
  -- Проверяем существование приглашения
  SELECT EXISTS(
    SELECT 1 FROM public.team_invitations
    WHERE id = invitation_id_input
      AND invited_user_id = auth.uid()
      AND status = 'pending'
  ) INTO v_invitation_exists;

  IF NOT v_invitation_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Приглашение не найдено или уже обработано'
    );
  END IF;

  -- Отклоняем приглашение
  UPDATE public.team_invitations
  SET status = 'declined', updated_at = NOW()
  WHERE id = invitation_id_input;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

