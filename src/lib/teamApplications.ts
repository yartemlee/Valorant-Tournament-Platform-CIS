import { supabase } from "@/integrations/supabase/client";

/**
 * Проверяет, есть ли у пользователя активная заявка в команду
 */
export const checkPendingApplication = async (
  teamId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from("team_applications")
    .select("id")
    .eq("team_id", teamId)
    .eq("from_user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return !!data;
};

/**
 * Проверяет, есть ли у пользователя активное приглашение в команду
 */
export const checkPendingInvite = async (
  teamId: string,
  userId: string
): Promise<boolean> => {
  const { data } = await supabase
    .from("team_invites")
    .select("id")
    .eq("team_id", teamId)
    .eq("to_user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return !!data;
};
