import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface UseRealtimeProfilesOptions {
  /** ID пользователя для отслеживания изменений профиля */
  userId?: string;
}

/**
 * Hook для real-time обновлений профиля пользователя
 * Подписывается на изменения в таблице profiles
 * Автоматически обновляет профиль при изменениях
 * 
 * @param options - Конфигурация подписки
 */
export function useRealtimeProfiles(options: UseRealtimeProfilesOptions) {
  const { userId } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profiles:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}





