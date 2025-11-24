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

    console.log(`[Realtime] Subscribing to profiles for user: ${userId}`);

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
        (payload) => {
          console.log('[Realtime] Profile change:', payload);
          
          // Инвалидируем запросы профиля
          queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          queryClient.invalidateQueries({ queryKey: ["current-user-profile"] });
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Profile subscription status for ${userId}:`, status);
      });

    return () => {
      console.log(`[Realtime] Unsubscribing from profiles for user: ${userId}`);
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

