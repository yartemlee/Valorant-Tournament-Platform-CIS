import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus } from "lucide-react";

interface InvitePlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function InvitePlayerDialog({ open, onOpenChange, teamId }: InvitePlayerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  const { data: players } = useQuery({
    queryKey: ["available-players", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, riot_id, riot_tag, current_team_id")
        .ilike("username", `%${search}%`)
        .is("current_team_id", null)
        .limit(10);

      return data || [];
    },
    enabled: search.length >= 2,
  });

  const handleInvite = async (playerId: string) => {
    setInviting(playerId);
    try {
      // Проверка существующего приглашения
      const { data: existingInvite } = await supabase
        .from("team_invites")
        .select("id")
        .eq("team_id", teamId)
        .eq("to_user_id", playerId)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        toast({
          title: "Приглашение уже отправлено",
          variant: "destructive",
        });
        return;
      }

      // Отменяем все старые приглашения перед созданием нового
      await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("team_id", teamId)
        .eq("to_user_id", playerId)
        .in("status", ["accepted", "declined"]);

      const { error } = await supabase.from("team_invites").insert({
        team_id: teamId,
        to_user_id: playerId,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Приглашение уже отправлено",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Приглашение отправлено",
        description: "Игрок получит уведомление",
      });

      queryClient.invalidateQueries({ queryKey: ["team-invites-sent"] });
      onOpenChange(false);
      setSearch("");
    } catch (error: any) {
      // Если ошибка связана с дублированием или RLS, показываем дружественное сообщение
      if (error.code === "23505" || error.message?.includes("row-level security")) {
        toast({
          title: "Этот игрок уже приглашен в команду",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Ошибка",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setInviting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пригласить игрока</DialogTitle>
          <DialogDescription>
            Найдите игрока по нику и отправьте приглашение в команду
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Введите ник игрока..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {players && players.length > 0 ? (
              players.map((player: any) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={player.avatar_url} />
                      <AvatarFallback>
                        {player.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{player.username}</p>
                      {player.riot_id && (
                        <p className="text-sm text-muted-foreground">
                          {player.riot_id}
                          {player.riot_tag && `#${player.riot_tag}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInvite(player.id)}
                    disabled={inviting === player.id}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Пригласить
                  </Button>
                </div>
              ))
            ) : search.length >= 2 ? (
              <p className="text-center text-muted-foreground py-8">Игроки не найдены</p>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Начните вводить ник для поиска
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
