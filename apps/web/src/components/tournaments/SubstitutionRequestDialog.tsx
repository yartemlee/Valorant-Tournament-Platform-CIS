import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SubstitutionRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tournamentId: string;
    teamId: string;
    currentRosterIds: string[]; // IDs of players currently in the roster
    onSuccess?: () => void;
}

interface Player {
    id: string;
    nickname: string;
    avatar_url?: string;
}

export function SubstitutionRequestDialog({
    open,
    onOpenChange,
    tournamentId,
    teamId,
    currentRosterIds,
    onSuccess,
}: SubstitutionRequestDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [teamMembers, setTeamMembers] = useState<Player[]>([]);
    const [playerOut, setPlayerOut] = useState<string>("");
    const [playerIn, setPlayerIn] = useState<string>("");

    useEffect(() => {
        if (open && teamId) {
            fetchTeamMembers();
        }
    }, [open, teamId]);

    const fetchTeamMembers = async () => {
        setFetching(true);
        try {
            // Fetch all team members
            const { data: members, error } = await supabase
                .from("team_members")
                .select(`
          user_id,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
                .eq("team_id", teamId);

            if (error) throw error;

            if (members) {
                const players = members.map((m: any) => ({
                    id: m.profiles.id,
                    nickname: m.profiles.username,
                    avatar_url: m.profiles.avatar_url,
                }));
                setTeamMembers(players);
            }
        } catch (error) {
            console.error("Error fetching team members:", error);
            toast.error("Ошибка загрузки состава команды");
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!playerOut || !playerIn) {
            toast.error("Выберите обоих игроков");
            return;
        }

        if (playerOut === playerIn) {
            toast.error("Игроки должны отличаться");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc("request_substitution", {
                p_tournament_id: tournamentId,
                p_team_id: teamId,
                p_player_out_id: playerOut,
                p_player_in_id: playerIn,
            });

            if (error) throw error;

            if (data && !data.success) {
                toast.error(data.message || "Ошибка запроса замены");
                return;
            }

            toast.success("Запрос на замену отправлен организатору");
            onSuccess?.();
            onOpenChange(false);
            setPlayerOut("");
            setPlayerIn("");
        } catch (error: any) {
            console.error("Error requesting substitution:", error);
            toast.error("Ошибка: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter players
    const rosterPlayers = teamMembers.filter(p => currentRosterIds.includes(p.id));
    const availablePlayers = teamMembers.filter(p => !currentRosterIds.includes(p.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Запрос замены</DialogTitle>
                    <DialogDescription>
                        Выберите игрока для замены. Организатор должен одобрить запрос.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Кого заменить (Уходит)</Label>
                            <Select value={playerOut} onValueChange={setPlayerOut}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите игрока из состава" />
                                </SelectTrigger>
                                <SelectContent>
                                    {rosterPlayers.map((player) => (
                                        <SelectItem key={player.id} value={player.id}>
                                            {player.nickname}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>На кого заменить (Приходит)</Label>
                            <Select value={playerIn} onValueChange={setPlayerIn}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Выберите игрока из запаса" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePlayers.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            Нет доступных игроков в запасе
                                        </SelectItem>
                                    ) : (
                                        availablePlayers.map((player) => (
                                            <SelectItem key={player.id} value={player.id}>
                                                {player.nickname}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {availablePlayers.length === 0 && (
                            <p className="text-sm text-destructive">
                                В вашей команде нет свободных игроков для замены. Пригласите игроков в команду.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !playerOut || !playerIn || fetching}
                    >
                        {loading ? "Отправка..." : "Отправить запрос"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
