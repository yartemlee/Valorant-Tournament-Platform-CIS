import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Hook для real-time обновлений уведомлений
 * Подписывается на изменения в таблице notifications для текущего пользователя
 * 
 * @param userId - ID текущего пользователя
 */
export function useRealtimeNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Создаем канал для подписки на изменения уведомлений
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Слушаем все события: INSERT, UPDATE, DELETE
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // При любом изменении инвалидируем все связанные запросы
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        }
      )
      .subscribe();

    // Очистка при размонтировании
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}





