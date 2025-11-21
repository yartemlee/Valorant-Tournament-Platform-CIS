-- RPC функция для принятия заявки в команду (вызывается капитаном/тренером)
CREATE OR REPLACE FUNCTION public.accept_team_application(
  application_id_input UUID
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_from_user_id UUID;
  v_member_count INTEGER;
  v_existing_team_id UUID;
BEGIN
  -- Получаем данные заявки
  SELECT team_id, from_user_id
  INTO v_team_id, v_from_user_id
  FROM public.team_applications
  WHERE id = application_id_input
    AND status = 'pending';

  -- Проверяем существование заявки
  IF v_team_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Заявка не найдена или уже обработана'
    );
  END IF;

  -- Проверяем права (должен быть капитаном или тренером команды)
  IF NOT public.is_team_manager(v_team_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'У вас нет прав для управления заявками этой команды'
    );
  END IF;

  -- Проверяем лимит участников команды (макс. 10)
  SELECT COUNT(*) INTO v_member_count
  FROM public.team_members
  WHERE team_id = v_team_id;

  IF v_member_count >= 10 THEN
    -- Автоматически отклоняем заявку
    UPDATE public.team_applications
    SET status = 'declined', updated_at = NOW()
    WHERE id = application_id_input;

    RETURN json_build_object(
      'success', false,
      'error', 'В команде уже максимум участников (10)'
    );
  END IF;

  -- Проверяем, не состоит ли игрок уже в другой команде
  SELECT team_id INTO v_existing_team_id
  FROM public.team_members
  WHERE user_id = v_from_user_id
  LIMIT 1;

  IF v_existing_team_id IS NOT NULL THEN
    -- Автоматически отклоняем заявку
    UPDATE public.team_applications
    SET status = 'declined', updated_at = NOW()
    WHERE id = application_id_input;

    RETURN json_build_object(
      'success', false,
      'error', 'Игрок уже состоит в другой команде. Заявка автоматически отклонена'
    );
  END IF;

  -- Добавляем игрока в команду
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (v_team_id, v_from_user_id, 'member');

  -- Обновляем current_team_id в профиле игрока
  UPDATE public.profiles
  SET current_team_id = v_team_id
  WHERE id = v_from_user_id;

  -- Обновляем статус заявки на "accepted"
  UPDATE public.team_applications
  SET status = 'accepted', updated_at = NOW()
  WHERE id = application_id_input;

  -- Отклоняем все остальные заявки этого пользователя в другие команды
  UPDATE public.team_applications
  SET status = 'declined', updated_at = NOW()
  WHERE from_user_id = v_from_user_id
    AND id != application_id_input
    AND status = 'pending';

  -- Отклоняем все активные приглашения для этого пользователя
  UPDATE public.team_invitations
  SET status = 'declined', updated_at = NOW()
  WHERE invited_user_id = v_from_user_id
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

-- RPC функция для отклонения заявки в команду (вызывается капитаном/тренером)
CREATE OR REPLACE FUNCTION public.decline_team_application(
  application_id_input UUID
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
BEGIN
  -- Получаем team_id заявки
  SELECT team_id INTO v_team_id
  FROM public.team_applications
  WHERE id = application_id_input
    AND status = 'pending';

  -- Проверяем существование заявки
  IF v_team_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Заявка не найдена или уже обработана'
    );
  END IF;

  -- Проверяем права (должен быть капитаном или тренером команды)
  IF NOT public.is_team_manager(v_team_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'У вас нет прав для управления заявками этой команды'
    );
  END IF;

  -- Отклоняем заявку
  UPDATE public.team_applications
  SET status = 'declined', updated_at = NOW()
  WHERE id = application_id_input;

  RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

