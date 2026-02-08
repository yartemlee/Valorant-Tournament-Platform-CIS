import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/services/queryKeys";
import { fetchProfileById } from "@/services/profiles";
import { fetchTeamMemberRole } from "@/services/teams";

export function useCurrentUserProfile(teamId?: string) {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: userId ? queryKeys.profiles.detail(userId) : queryKeys.profiles.all,
    queryFn: () => (userId ? fetchProfileById(userId) : null),
    enabled: !!userId,
  });

  const { data: teamMemberRole, refetch: refetchTeamMember } = useQuery({
    queryKey:
      teamId && userId
        ? queryKeys.teamMembers.role(teamId, userId)
        : ["noop"],
    queryFn: () =>
      teamId && userId ? fetchTeamMemberRole(teamId, userId) : null,
    enabled: !!teamId && !!userId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    id: userId,
    profile,
    current_team_id: profile?.current_team_id,
    isCaptainOfThisTeam: teamMemberRole === "captain",
    isMemberOfThisTeam: !!teamMemberRole,
    isCoachOfThisTeam: teamMemberRole === "coach",
    isManager: teamMemberRole === "captain" || teamMemberRole === "coach",
    refetch: () => {
      refetchProfile();
      refetchTeamMember();
    },
  };
}
