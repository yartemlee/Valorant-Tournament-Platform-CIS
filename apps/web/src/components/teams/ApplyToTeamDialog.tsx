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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Users } from "lucide-react";

const MAX_MESSAGE_LENGTH = 500;

interface ApplyToTeamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: {
        id: string;
        name: string;
        tag: string;
        logo_url?: string | null;
    };
}

export function ApplyToTeamDialog({
    open,
    onOpenChange,
    team,
}: ApplyToTeamDialogProps) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (skipMessage = false) => {
        setIsSubmitting(true);
        try {
            // Use existing RPC that handles all validations
            const { error } = await supabase.rpc('rpc_apply_to_team', {
                target_team_id: team.id,
                note: skipMessage ? undefined : message.trim() || undefined
            });

            if (error) {
                // Handle known errors with friendly messages
                if (error.message?.includes('already_in_team')) {
                    toast.error("Вы уже состоите в команде. Сначала покиньте текущую.");
                    return;
                }
                if (error.message?.includes('duplicate_pending')) {
                    toast.error("Вы уже подали заявку в эту команду");
                    return;
                }
                if (error.message?.includes('not_authenticated')) {
                    toast.error("Требуется авторизация");
                    return;
                }
                if (error.message?.includes('team_not_recruiting')) {
                    toast.error("Набор в команду закрыт");
                    return;
                }
                if (error.message?.includes('team_full')) {
                    toast.error("Команда заполнена");
                    return;
                }

                throw error;
            }

            toast.success(`Заявка отправлена в команду ${team.name}`);

            queryClient.invalidateQueries({ queryKey: ["team-applications"] });
            queryClient.invalidateQueries({ queryKey: ["my-team-applications"] });
            queryClient.invalidateQueries({ queryKey: ["team", team.id] });
            queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });

            onOpenChange(false);
            setMessage("");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Ошибка отправки заявки";
            toast.error(message);
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
                        <Users className="h-5 w-5 text-primary" />
                        Подать заявку в команду
                    </DialogTitle>
                    <DialogDescription>
                        Отправить заявку на вступление в команду
                    </DialogDescription>
                </DialogHeader>

                {/* Team info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12 border-2 border-border">
                        <AvatarImage src={team.logo_url || ""} alt={team.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {team.tag?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-sm text-muted-foreground">[{team.tag}]</p>
                    </div>
                </div>

                {/* Message textarea */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        Сопроводительное письмо <span className="text-muted-foreground">(необязательно)</span>
                    </label>
                    <Textarea
                        placeholder="Расскажите о себе, вашем опыте, почему хотите вступить в эту команду..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                        rows={4}
                        className="resize-none"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Капитан команды увидит это сообщение</span>
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
