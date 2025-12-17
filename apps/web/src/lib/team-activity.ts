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

interface LogActivityParams {
    teamId: string;
    type: TeamActivityType;
    description: string;
    data?: Record<string, any>;
}

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
            console.error("Failed to log team activity:", error);
        }
    } catch (error) {
        console.error("Error logging team activity:", error);
    }
}
