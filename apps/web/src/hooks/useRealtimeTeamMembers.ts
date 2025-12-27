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
        () => {
          // Инвалидируем все запросы связанные с командой
          queryClient.invalidateQueries({ queryKey: ["team", teamId] });
          queryClient.invalidateQueries({ queryKey: ["team-manage", teamId] });
          queryClient.invalidateQueries({ queryKey: ["team-member", teamId] });

          // Также обновляем общий список команд (там может быть счётчик участников)
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);
}





