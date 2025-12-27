import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeTeamsOptions {
  /** ID конкретной команды (опционально) */
  teamId?: string;
  /** Отслеживать все команды */
  watchAll?: boolean;
}

/**
 * Hook для real-time обновлений команд
 * Подписывается на изменения в таблице teams
 * Используется для обновления информации о команде (название, лого, настройки и т.д.)
 * 
 * @param options - Конфигурация подписки
 */
export function useRealtimeTeams(options: UseRealtimeTeamsOptions = {}) {
  const { teamId, watchAll = false } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId && !watchAll) return;

    const channelName = teamId ? `teams:${teamId}` : 'teams:all';

    let channelBuilder = supabase.channel(channelName);

    if (teamId) {
      // Подписка на конкретную команду
      channelBuilder = channelBuilder.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        (_payload) => {
          // Инвалидируем запросы для этой команды
          queryClient.invalidateQueries({ queryKey: ["team", teamId] });
          queryClient.invalidateQueries({ queryKey: ["team-manage", teamId] });
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }
      );
    } else {
      // Подписка на все команды
      channelBuilder = channelBuilder.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        (_payload) => {
          // Инвалидируем список команд
          queryClient.invalidateQueries({ queryKey: ["teams"] });
        }
      );
    }

    const channel = channelBuilder.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, watchAll, queryClient]);
}





