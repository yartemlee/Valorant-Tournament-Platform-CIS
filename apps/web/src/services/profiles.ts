import { supabase } from "@/lib/supabase";
import type { Profile, UpdateTables } from "@/types/common.types";

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  id: string,
  updates: UpdateTables<"profiles">,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPlayerRoles(userId: string) {
  const { data, error } = await supabase
    .from("player_roles")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

export async function fetchPlayerAgents(userId: string) {
  const { data, error } = await supabase
    .from("player_agents")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}
