-- Исправляем search_path для функции rpc_apply_to_team
ALTER FUNCTION public.rpc_apply_to_team(UUID, TEXT) SET search_path = public, pg_temp;

