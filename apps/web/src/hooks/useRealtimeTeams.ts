import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/services/queryKeys";

interface UseRealtimeTeamsOptions {
  teamId?: string;
  watchAll?: boolean;
}

export function useRealtimeTeams(options: UseRealtimeTeamsOptions = {}) {
  const { teamId, watchAll = false } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId && !watchAll) return;

    const channelName = teamId ? `teams:${teamId}` : "teams:all";

    let channelBuilder = supabase.channel(channelName);

    if (teamId) {
      channelBuilder = channelBuilder.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.manage(teamId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        }
      );
    } else {
      channelBuilder = channelBuilder.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        }
      );
    }

    const channel = channelBuilder.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, watchAll, queryClient]);
}
