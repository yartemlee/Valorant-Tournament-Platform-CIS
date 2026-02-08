import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/services/queryKeys";

interface UseRealtimeTeamApplicationsOptions {
  userId?: string;
  managedTeamIds?: string[];
}

export function useRealtimeTeamApplications(options: UseRealtimeTeamApplicationsOptions) {
  const { userId, managedTeamIds = [] } = options;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

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
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.teamApplications.my(userId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.count(userId) });
        }
      )
      .subscribe();

    channels.push(applicantChannel);

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
            queryClient.invalidateQueries({ queryKey: queryKeys.teamApplications.byTeam(teamId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.teamApplications.count });
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
