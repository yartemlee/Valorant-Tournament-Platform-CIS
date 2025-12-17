import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useCurrentUserProfile(teamId?: string) {
  const { session } = useAuth();

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: teamMember, refetch: refetchTeamMember } = useQuery({
    queryKey: ["team-member", teamId, session?.user?.id],
    queryFn: async () => {
      if (!teamId || !session?.user?.id) return null;
      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", session.user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!teamId && !!session?.user?.id,
    // Refetch more aggressively to ensure fresh data after captain transfer
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    id: session?.user?.id,
    profile,
    current_team_id: profile?.current_team_id,
    isCaptainOfThisTeam: teamMember?.role === "captain",
    isMemberOfThisTeam: !!teamMember,
    isCoachOfThisTeam: teamMember?.role === "coach",
    isManager: teamMember?.role === "captain" || teamMember?.role === "coach",
    refetch: () => {
      refetchProfile();
      refetchTeamMember();
    },
  };
}
