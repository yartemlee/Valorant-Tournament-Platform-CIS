-- Migration: Add RPC function for requesting to join a private LFG lobby
-- This function allows users to submit a join request with an optional message

CREATE OR REPLACE FUNCTION public.request_to_join_lfg_lobby(
  p_lobby_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby RECORD;
  v_user_id UUID;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  -- Проверяем, не состоит ли уже в лобби
  IF EXISTS (SELECT 1 FROM lfg_lobby_members WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы уже состоите в лобби');
  END IF;

  -- Проверяем, нет ли уже активного запроса
  IF EXISTS (
    SELECT 1 FROM lfg_lobby_requests 
    WHERE lobby_id = p_lobby_id AND requester_id = v_user_id AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы уже подали заявку в это лобби');
  END IF;

  -- Получаем лобби
  SELECT * INTO v_lobby FROM lfg_lobbies WHERE id = p_lobby_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби не найдено');
  END IF;

  IF v_lobby.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби закрыто');
  END IF;

  IF v_lobby.current_size >= v_lobby.max_size THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби заполнено');
  END IF;

  IF NOT v_lobby.is_private THEN
    RETURN jsonb_build_object('success', false, 'error', 'Это открытое лобби, используйте прямое вступление');
  END IF;

  IF v_lobby.owner_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы владелец этого лобби');
  END IF;

  -- Создаём заявку
  INSERT INTO lfg_lobby_requests (lobby_id, requester_id, message, status)
  VALUES (p_lobby_id, v_user_id, p_message, 'pending')
  ON CONFLICT (lobby_id, requester_id) 
  DO UPDATE SET 
    message = p_message,
    status = 'pending',
    updated_at = NOW()
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.request_to_join_lfg_lobby(UUID, TEXT) TO authenticated;
