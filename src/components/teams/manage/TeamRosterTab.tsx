import { TeamWithMembers } from '@/types/common.types';
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { UserMinus, Crown, Shield } from "lucide-react";

interface TeamRosterTabProps {
  team: TeamWithMembers;
  isOwner: boolean;
  isCaptain?: boolean;
  isCoach?: boolean;
  currentUserId?: string;
  onCaptainTransferred?: () => void;
}

export function TeamRosterTab({ team, isOwner, isCaptain, isCoach, currentUserId, onCaptainTransferred }: TeamRosterTabProps) {
  const queryClient = useQueryClient();
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [transferringCaptaincy, setTransferringCaptaincy] = useState<string | null>(null);

  const isManager = isOwner || isCoach;

  const handleRoleChange = async (memberUserId: string, newRole: string) => {
    setUpdatingRole(memberUserId);
    try {
      // Use secure RPC that validates captain role
      const { data, error } = await supabase.rpc('set_member_role', {
        team_id_input: team.id,
        member_user_id: memberUserId,
        new_role: newRole,
      });

      if (error) {
        if (error.message.includes('not_captain')) {
          toast.error("Управление доступно только капитану команды");
          return;
        } else if (error.message.includes('cannot_change_own_role')) {
          toast.error("Нельзя изменить свою роль");
          return;
        }
        throw error;
      }

      toast.success("Роль обновлена");

      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["team-member"] });
    } catch (error) {
      toast.error(error.message || "Ошибка изменения роли");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleTransferCaptaincy = async (newCaptainId: string, newCaptainUserId: string) => {
    try {
      // Call atomic RPC function
      const { data, error } = await supabase.rpc('transfer_captain', {
        target_team_id: team.id,
        new_captain_user_id: newCaptainUserId
      });

      if (error) {
        // Handle specific error messages
        if (error.message.includes('no_captain_found')) {
          throw new Error("Текущий капитан не найден");
        } else if (error.message.includes('not_current_captain')) {
          throw new Error("Только капитан может передать капитанство");
        } else if (error.message.includes('new_captain_not_member')) {
          throw new Error("Новый капитан должен быть членом команды");
        }
        throw error;
      }

      toast.success("Капитанство передано");

      // Invalidate all relevant caches for immediate UI update, including team-member
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-manage", team.id] }),
        queryClient.invalidateQueries({ queryKey: ["profile", currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["team", team.id] }),
        queryClient.invalidateQueries({ queryKey: ["team-member", team.id, currentUserId] }),
        queryClient.invalidateQueries({ queryKey: ["team-member", team.id] }),
        queryClient.invalidateQueries({ queryKey: ["team-member"] }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
      
      setTransferringCaptaincy(null);
      
      // Close the management modal immediately and trigger parent refetch
      if (onCaptainTransferred) {
        onCaptainTransferred();
      }
    } catch (error) {
      toast.error(error.message || "Ошибка передачи капитанства");
      setTransferringCaptaincy(null);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    try {
      // Use secure RPC that validates captain role and prevents self-kick
      const { data, error } = await supabase.rpc('kick_member', {
        team_id_input: team.id,
        member_user_id: userId,
      });

      if (error) {
        if (error.message.includes('not_captain')) {
          toast.error("Управление доступно только капитану команды");
          return;
        } else if (error.message.includes('cannot_kick_self')) {
          toast.error("Нельзя удалить самого себя из команды");
          return;
        }
        throw error;
      }

      toast.success("Игрок удалён из команды");

      // Инвалидируем все связанные кэши для мгновенного обновления UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["team-manage"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["team", team.id] }),
        queryClient.invalidateQueries({ queryKey: ["team-member"] }),
        queryClient.invalidateQueries({ queryKey: ["session"] }),
      ]);
      
      setRemovingMember(null);
    } catch (error) {
      toast.error(error.message || "Ошибка удаления игрока");
      setRemovingMember(null);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {team.team_members?.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.profiles?.avatar_url} />
                <AvatarFallback>
                  {member.profiles?.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{member.profiles?.username || "Unknown"}</p>
                {member.profiles?.riot_id && (
                  <p className="text-sm text-muted-foreground">
                    {member.profiles.riot_id}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isCaptain && member.role !== "captain" && member.user_id !== currentUserId ? (
                <Select
                  value={member.role}
                  onValueChange={(value) => handleRoleChange(member.user_id, value)}
                  disabled={updatingRole === member.user_id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Игрок</SelectItem>
                    <SelectItem value="coach">Тренер</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={member.role === "captain" ? "default" : "secondary"}>
                  {member.role === "captain" ? (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Капитан
                    </>
                  ) : member.role === "coach" ? (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      Тренер
                    </>
                  ) : (
                    "Игрок"
                  )}
                </Badge>
              )}

              {isCaptain && member.role !== "captain" && member.user_id !== currentUserId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTransferringCaptaincy(member.id)}
                >
                  Передать капитанство
                </Button>
              )}

              {isCaptain && member.role !== "captain" && member.user_id !== currentUserId && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRemovingMember(member.id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>

            <AlertDialog
              open={removingMember === member.id}
              onOpenChange={(open) => !open && setRemovingMember(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить участника?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {member.profiles?.username} будет удален из команды. Это действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveMember(member.id, member.user_id)}
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={transferringCaptaincy === member.id}
              onOpenChange={(open) => !open && setTransferringCaptaincy(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Передать капитанство?</AlertDialogTitle>
                  <AlertDialogDescription>
                    После передачи вы станете обычным игроком и потеряете доступ к управлению командой.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleTransferCaptaincy(member.id, member.user_id)}
                  >
                    Передать
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
