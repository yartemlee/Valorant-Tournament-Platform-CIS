import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);

  const { data: players } = useQuery({
    queryKey: ["available-players", search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];

      const { data, error } = await supabase
        .rpc("search_available_players", { search_term: search });

      if (error) {
        console.error("Error searching players:", error);
        return [];
      }

      return data || [];
    },
    enabled: search.length >= 2,
  });

  const handleInvite = async (playerId: string) => {
    setInviting(playerId);
    try {
      // Проверка существующего приглашения
      const { data: existingInvite } = await supabase
        .from("team_invitations")
        .select("id")
        .eq("team_id", teamId)
        .eq("invited_user_id", playerId)
        .eq("status", "pending")
        .maybeSingle();

      if (existingInvite) {
        toast.error("Приглашение уже отправлено");
        return;
      }

      // Отменяем все старые приглашения перед созданием нового
      await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("team_id", teamId)
        .eq("invited_user_id", playerId)
        .in("status", ["accepted", "rejected"]);

      const { error } = await supabase.from("team_invitations").insert({
        team_id: teamId,
        invited_user_id: playerId,
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Приглашение уже отправлено");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Приглашение отправлено. Игрок получит уведомление");

      queryClient.invalidateQueries({ queryKey: ["team-invites-sent"] });
      onOpenChange(false);
      setSearch("");
    } catch (error) {
      // Если ошибка связана с дублированием или RLS, показываем дружественное сообщение
      if (error.code === "23505" || error.message?.includes("row-level security")) {
        toast.error("Этот игрок уже приглашен в команду");
      } else {
        toast.error(error.message || "Ошибка отправки приглашения");
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
              players.map((player) => (
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
