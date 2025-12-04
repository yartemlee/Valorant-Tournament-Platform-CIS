import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface TeamMember {
    user_id: string;
    profiles: {
        id: string;
        username: string;
        avatar_url: string | null;
        riot_id: string | null;
    };
}

interface RosterSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    onConfirm: (selectedUserIds: string[]) => void;
}

export const RosterSelectionDialog = ({
    open,
    onOpenChange,
    teamId,
    onConfirm,
}: RosterSelectionDialogProps) => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && teamId) {
            fetchTeamMembers();
            setSelectedIds([]); // Reset selection on open
        }
    }, [open, teamId]);

    const fetchTeamMembers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("team_members")
            .select(`
        user_id,
        profiles:user_id (
          id,
          username,
          avatar_url,
          riot_id
        )
      `)
            .eq("team_id", teamId);

        if (error) {
            toast.error("Ошибка загрузки участников команды");
            console.error(error);
        } else {
            // Filter out members without profiles (shouldn't happen with inner join logic but safe to check)
            const validMembers = data?.filter(m => m.profiles) as any as TeamMember[];
            setMembers(validMembers || []);
        }
        setLoading(false);
    };

    const toggleSelection = (userId: string) => {
        const member = members.find(m => m.user_id === userId);
        if (!member?.profiles?.riot_id) {
            toast.error("Этот игрок не привязал Riot ID");
            return;
        }

        setSelectedIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                if (prev.length >= 5) {
                    toast.error("Можно выбрать только 5 игроков");
                    return prev;
                }
                return [...prev, userId];
            }
        });
    };

    const handleConfirm = () => {
        if (selectedIds.length !== 5) {
            toast.error(`Необходимо выбрать ровно 5 игроков. Выбрано: ${selectedIds.length}`);
            return;
        }
        onConfirm(selectedIds);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Выберите состав на турнир</DialogTitle>
                    <DialogDescription>
                        Выберите 5 игроков, которые будут участвовать в турнире.
                        Только эти игроки получат медали в случае победы.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <p className="text-center text-muted-foreground">Загрузка...</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {members.map((member) => {
                                const hasRiotId = !!member.profiles?.riot_id;
                                return (
                                    <div
                                        key={member.user_id}
                                        className={`flex items-center space-x-3 p-2 rounded-lg border border-border transition-colors ${hasRiotId
                                                ? "hover:bg-accent/50 cursor-pointer"
                                                : "opacity-50 cursor-not-allowed"
                                            }`}
                                        onClick={() => toggleSelection(member.user_id)}
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(member.user_id)}
                                            onCheckedChange={() => toggleSelection(member.user_id)}
                                            disabled={!hasRiotId}
                                        />
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                                {member.profiles.avatar_url ? (
                                                    <img
                                                        src={member.profiles.avatar_url}
                                                        alt={member.profiles.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Users className="h-4 w-4 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{member.profiles.username}</p>
                                                {hasRiotId ? (
                                                    <p className="text-xs text-muted-foreground">{member.profiles.riot_id}</p>
                                                ) : (
                                                    <p className="text-xs text-destructive">Riot ID не привязан</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-4 flex justify-between items-center text-sm">
                        <span className={selectedIds.length === 5 ? "text-green-500 font-medium" : "text-muted-foreground"}>
                            Выбрано: {selectedIds.length} / 5
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Отмена
                    </Button>
                    <Button onClick={handleConfirm} disabled={selectedIds.length !== 5 || loading}>
                        Подтвердить участие
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
