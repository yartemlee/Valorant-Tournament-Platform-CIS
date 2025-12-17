import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeTeamApplicationsOptions {
  /** ID текущего пользователя (для получения собственных заявок) */
  userId?: string;
  /** Список ID команд, где пользователь является капитаном/тренером */
  managedTeamIds?: string[];
}

/**
 * Hook для real-time обновлений заявок в команды
 * Подписывается на изменения в таблице team_applications:
 * - Для игрока: заявки, где applicant_id = userId
 * - Для менеджера команды: заявки в команды, где пользователь captain/coach
 * 
 * @param options - Конфигурация подписок
 */
export function useRealtimeTeamApplications(options: UseRealtimeTeamApplicationsOptions) {
  const { userId, managedTeamIds = [] } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // 1. Подписка на собственные заявки пользователя (как игрок-заявитель)
    const applicantChannel = supabase
      .channel(`team_applications:applicant:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_applications",
          filter: `applicant_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[Realtime] Team application change:', payload);
          // Инвалидируем запросы для заявителя
          queryClient.invalidateQueries({ queryKey: ["my-team-applications", userId] });
          queryClient.invalidateQueries({ queryKey: ["notifications-count", userId] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Team applications subscription status:', status);
      });

    channels.push(applicantChannel);

    // 2. Подписка на заявки в управляемые команды (как капитан/тренер)
    managedTeamIds.forEach((teamId) => {
      const managerChannel = supabase
        .channel(`team_applications:team:${teamId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_applications",
            filter: `team_id=eq.${teamId}`,
          },
          () => {
            // Инвалидируем запросы для команды
            queryClient.invalidateQueries({ queryKey: ["team-applications", teamId] });
            queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });
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

