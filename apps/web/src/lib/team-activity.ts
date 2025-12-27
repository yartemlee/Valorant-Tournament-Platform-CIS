import { supabase } from "./supabase";

export type TeamActivityType =
    | "member_joined"
    | "member_left"
    | "member_kicked"
    | "role_updated"
    | "captain_transferred"
    | "team_updated"
    | "logo_updated"
    | "tournament_joined"
    | "tournament_won";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface LogActivityParams {
    teamId: string;
    type: TeamActivityType;
    description: string;
    data?: Record<string, any>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function logTeamActivity({ teamId, type, description, data = {} }: LogActivityParams) {
    try {
        const { error } = await supabase
            .from("team_activity_logs")
            .insert({
                team_id: teamId,
                type,
                description,
                data
            });

        if (error) {
            // Log error silently, activity logging should not block main operations
        }
    } catch {
        // Silently ignore activity logging errors
    }
}
