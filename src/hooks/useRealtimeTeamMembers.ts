import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeTeamMembersOptions {
  /** ID команды для отслеживания изменений в составе */
  teamId?: string;
}

/**
 * Hook для real-time обновлений состава команды
 * Подписывается на изменения в таблице team_members для конкретной команды
 * Автоматически обновляет все запросы связанные с составом команды
 * 
 * @param options - Конфигурация подписки
 */
export function useRealtimeTeamMembers(options: UseRealtimeTeamMembersOptions) {
  const { teamId } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;

    console.log(`[Realtime] Subscribing to team_members for team: ${teamId}`);

    const channel = supabase
      .channel(`team_members:${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          console.log('[Realtime] Team members change:', payload);
          
          // Инвалидируем все запросы связанные с командой
          queryClient.invalidateQueries({ queryKey: ["team", teamId] });
          queryClient.invalidateQueries({ queryKey: ["team-manage", teamId] });
          queryClient.invalidateQueries({ queryKey: ["team-member", teamId] });
          
          // Также обновляем общий список команд (там может быть счётчик участников)
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Team members subscription status for ${teamId}:`, status);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from team_members for team: ${teamId}`);
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);
}

