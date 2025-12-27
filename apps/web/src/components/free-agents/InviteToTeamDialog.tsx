import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Send, UserPlus } from "lucide-react";

const MAX_MESSAGE_LENGTH = 500;

interface InviteToTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    player: {
        id: string;
        username: string;
        avatar_url?: string | null;
        rank?: string | null;
    };
    teamId: string;
    teamName: string;
}

export function InviteToTeamDialog({
    open,
    onOpenChange,
    player,
    teamId,
    teamName,
}: InviteToTeamDialogProps) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (skipMessage = false) => {
        setIsSubmitting(true);
        try {
            // Check for existing invite
            const { data: existingInvite } = await supabase
                .from("team_invitations")
                .select("id")
                .eq("team_id", teamId)
                .eq("invited_user_id", player.id)
                .eq("status", "pending")
                .maybeSingle();

            if (existingInvite) {
                toast.error("Приглашение уже отправлено этому игроку");
                return;
            }

            // Check if user allows invites
            const { data: targetProfile } = await supabase
                .from("profiles")
                .select("allow_invites")
                .eq("id", player.id)
                .single();

            if (targetProfile?.allow_invites === false) {
                toast.error("Этот игрок отключил приглашения в команды");
                return;
            }

            // Create invitation
            const { error } = await supabase
                .from("team_invitations")
                .insert({
                    team_id: teamId,
                    invited_user_id: player.id,
                    message: skipMessage ? null : message.trim() || null,
                    status: "pending",
                });

            if (error) throw error;

            toast.success(`Приглашение отправлено игроку ${player.username}`);

            queryClient.invalidateQueries({ queryKey: ["team-invites-sent"] });
            queryClient.invalidateQueries({ queryKey: ["free-agent-cards"] });

            onOpenChange(false);
            setMessage("");
        } catch (error: any) {
            if (error.code === "23505") {
                toast.error("Этот игрок уже приглашен в команду");
            } else {
                toast.error(error.message || "Ошибка отправки приглашения");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setMessage("");
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Пригласить в команду
                    </DialogTitle>
                    <DialogDescription>
                        Отправить приглашение в команду <span className="font-semibold text-foreground">{teamName}</span>
                    </DialogDescription>
                </DialogHeader>

                {/* Player info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={player.avatar_url || ""} alt={player.username} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {player.username?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{player.username}</p>
                        {player.rank && (
                            <Badge variant="outline" className="text-xs">
                                {player.rank}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Message textarea */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Сопроводительное письмо <span className="text-muted-foreground">(необязательно)</span>
                    </label>
                    <Textarea
                        placeholder="Напишите сообщение для игрока... Расскажите о команде, целях, почему вы хотите пригласить этого игрока."
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                        rows={4}
                        className="resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Игрок увидит это сообщение вместе с приглашением</span>
                        <span className={message.length >= MAX_MESSAGE_LENGTH ? "text-destructive" : ""}>
                            {message.length}/{MAX_MESSAGE_LENGTH}
                        </span>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Отмена
                    </Button>
                    <Button onClick={() => handleSubmit()} disabled={isSubmitting}>
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Отправка..." : "Отправить"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
