import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/services/queryKeys";

interface UseRealtimeTeamInvitationsOptions {
  userId?: string;
  managedTeamIds?: string[];
}

export function useRealtimeTeamInvitations(options: UseRealtimeTeamInvitationsOptions) {
  const { userId, managedTeamIds = [] } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

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
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.teamInvitations.my(userId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count(userId) });
        }
      )
      .subscribe();

    channels.push(playerChannel);

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
            queryClient.invalidateQueries({ queryKey: queryKeys.teamInvitations.sent(teamId) });
          }
        )
        .subscribe();

      channels.push(managerChannel);
    });

    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
    };
  }, [userId, managedTeamIds.join(","), queryClient]); // eslint-disable-line react-hooks/exhaustive-deps
}
