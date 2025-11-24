import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeTeamInvitationsOptions {
  /** ID текущего пользователя (для получения приглашений как игрок) */
  userId?: string;
  /** Список ID команд, где пользователь является капитаном/тренером */
  managedTeamIds?: string[];
}

/**
 * Hook для real-time обновлений приглашений в команды
 * Подписывается на изменения в таблице team_invitations:
 * - Для игрока: приглашения, где invited_user_id = userId
 * - Для менеджера команды: приглашения от команд, где пользователь captain/coach
 * 
 * @param options - Конфигурация подписок
 */
export function useRealtimeTeamInvitations(options: UseRealtimeTeamInvitationsOptions) {
  const { userId, managedTeamIds = [] } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // 1. Подписка на приглашения для текущего пользователя (как игрок)
    const playerChannel = supabase
      .channel(`team_invitations:player:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_invitations",
          filter: `invited_user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Team invitation change:', payload);
          // Инвалидируем запросы для игрока
          queryClient.invalidateQueries({ queryKey: ["my-team-invites", userId] });
          queryClient.invalidateQueries({ queryKey: ["notifications-count", userId] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Team invitations subscription status:', status);
      });

    channels.push(playerChannel);

    // 2. Подписка на приглашения от управляемых команд (как капитан/тренер)
    managedTeamIds.forEach((teamId) => {
      const managerChannel = supabase
        .channel(`team_invitations:team:${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_invitations",
            filter: `team_id=eq.${teamId}`,
          },
          () => {
            // Инвалидируем запросы для команды
            queryClient.invalidateQueries({ queryKey: ["team-invites-sent", teamId] });
          }
        )
        .subscribe();

      channels.push(managerChannel);
    });

    // Очистка всех каналов при размонтировании
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, managedTeamIds.join(","), queryClient]); // eslint-disable-line react-hooks/exhaustive-deps
}

