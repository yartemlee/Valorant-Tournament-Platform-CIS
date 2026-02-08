import { supabase } from "@/lib/supabase";

interface FetchTeamsFilters {
  status?: string;
  search?: string;
}

export async function fetchTeams(filters: FetchTeamsFilters) {
  let query = supabase
    .from("teams")
    .select("id, name, tag, logo_url, is_recruiting, created_at, team_members(id)");

  if (filters.status === "recruiting") {
    query = query.eq("is_recruiting", true);
  } else if (filters.status === "closed") {
    query = query.eq("is_recruiting", false);
  }

  if (filters.search?.trim()) {
    query = query.or(
      `name.ilike.%${filters.search}%,tag.ilike.%${filters.search}%`,
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchTeamById(id: string) {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, tag, logo_url")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTeamMemberRole(
  teamId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.role ?? null;
}

export async function checkPendingApplication(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("team_applications")
    .select("id")
    .eq("team_id", teamId)
    .eq("applicant_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return !!data;
}

export async function checkPendingInvite(
  teamId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("team_id", teamId)
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  return !!data;
}
