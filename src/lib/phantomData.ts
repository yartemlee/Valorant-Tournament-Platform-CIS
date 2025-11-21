import { supabase } from "@/lib/supabase";

interface FillTournamentResult {
  createdTeams: number;
  createdUsers: number;
  registeredTeams: number;
  totalRegistered: number;
}

interface CleanupTournamentResult {
  removedTeams: number;
  removedUsers: number;
  removedRegistrations: number;
}

interface FillTeamResult {
  addedPhantoms: number;
  totalMembers: number;
}

interface CleanupTeamResult {
  removedPhantoms: number;
  removedUsers: number;
}

export async function fillTournamentWithPhantoms(
  tournamentId: string,
  desiredSize?: number
): Promise<FillTournamentResult> {
  const { data, error } = await supabase.rpc("rpc_fill_tournament", {
    tournament_id_input: tournamentId,
    desired_size: desiredSize,
  });

  if (error) throw error;
  return data as unknown as FillTournamentResult;
}

export async function cleanupTournamentPhantoms(
  tournamentId: string
): Promise<CleanupTournamentResult> {
  const { data, error } = await supabase.rpc("rpc_cleanup_tournament_phantoms", {
    tournament_id_input: tournamentId,
  });

  if (error) throw error;
  return data as unknown as CleanupTournamentResult;
}

export async function fillTeamRoster(
  teamId: string,
  minSize: number = 5,
  maxSize: number = 10
): Promise<FillTeamResult> {
  const { data, error } = await supabase.rpc("rpc_fill_team_roster", {
    team_id_input: teamId,
    min_size: minSize,
    max_size: maxSize,
  });

  if (error) throw error;
  return data as unknown as FillTeamResult;
}

export async function cleanupTeamPhantoms(teamId: string): Promise<CleanupTeamResult> {
  const { data, error } = await supabase.rpc("rpc_cleanup_team_phantoms", {
    team_id_input: teamId,
  });

  if (error) throw error;
  return data as unknown as CleanupTeamResult;
}
