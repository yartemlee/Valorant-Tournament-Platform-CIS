import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/services/queryKeys";

interface UseRealtimeTeamMembersOptions {
  teamId?: string;
}

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
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.manage(teamId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers.all(teamId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);
}
