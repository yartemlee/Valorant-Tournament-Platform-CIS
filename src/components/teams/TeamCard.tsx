import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";

interface TeamCardProps {
  team: any;
  isUserTeam?: boolean;
}

export function TeamCard({ team, isUserTeam }: TeamCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const { id: currentUserId, current_team_id, isMemberOfThisTeam, isManager } = useCurrentUserProfile(team.id);

  const memberCount = team.team_members?.length || 0;
  const isRecruiting = team.is_recruiting;
  const isFull = memberCount >= 10;

  const handleApply = async () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы подать заявку",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      // Fresh DB check перед отправкой заявки
      const { data: freshProfile, error: profileError } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", currentUserId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Не удалось проверить статус команды");
      }

      if (freshProfile.current_team_id) {
        toast({
          title: "Вы уже состоите в команде",
          description: "Чтобы вступить в другую — сначала покиньте текущую.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsApplying(false);
        return;
      }

      // Используем безопасный RPC для подачи заявки с DB-валидацией
      const { data, error } = await supabase.rpc('rpc_apply_to_team', {
        target_team_id: team.id,
        note: null
      });

      if (error) {
        console.error("RPC error:", error);
        
        // Обрабатываем известные ошибки с понятными сообщениями
        if (error.message.includes('already_in_team')) {
          toast({
            title: "Вы уже состоите в команде",
            description: "Чтобы вступить в другую — сначала покиньте текущую.",
            variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          return;
        }
        
        if (error.message.includes('duplicate_pending')) {
          toast({
            title: "Вы уже подали заявку в эту команду",
            description: "Ожидайте ответа от капитана команды",
          });
          return;
        }
        
        if (error.message.includes('not_authenticated')) {
          toast({
            title: "Требуется авторизация",
            description: "Войдите, чтобы подать заявку",
            variant: "destructive",
          });
          return;
        }

        if (error.code === '42501') {
          toast({
            title: "Не удалось отправить заявку",
            description: "Проверьте, что вы не состоите в команде.",
            variant: "destructive",
          });
          return;
        }
        
        // Неизвестная ошибка
        throw error;
      }

      toast({
        title: "Заявка отправлена",
        description: "Ожидайте ответа от капитана команды",
      });

      // Обновляем все связанные кэши
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["team-applications", team.id] }),
        queryClient.invalidateQueries({ queryKey: ["team-applications-count"] }),
      ]);
    } catch (error: any) {
      console.error("Application process error:", error);
      toast({
        title: "Ошибка при отправке заявки",
        description: "Не удалось отправить заявку. Попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Unified button logic
  const showManageButton = isManager;
  const showApplyButton = currentUserId && 
    !isMemberOfThisTeam && 
    !current_team_id && 
    isRecruiting && 
    !isFull;
  const showAlreadyInTeam = currentUserId && current_team_id && !isMemberOfThisTeam;
  const showRecruitmentClosed = !isRecruiting && !isMemberOfThisTeam;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${isUserTeam ? 'ring-2 ring-primary shadow-glow-primary' : 'hover:shadow-glow-primary'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">{team.name}</h3>
              <p className="text-sm text-muted-foreground">[{team.tag}]</p>
            </div>
          </div>
          {isUserTeam && (
            <Badge className="bg-primary/20 text-primary border-primary/30 shadow-glow-primary animate-pulse">
              Твоя команда
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
        )}
        
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className={memberCount >= 10 ? "text-destructive font-semibold" : ""}>
            {memberCount}/10 участников
          </span>
        </div>

        <div className="flex gap-2">
          {isRecruiting ? (
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
              Набор открыт
            </Badge>
          ) : (
            <Badge variant="secondary">Набор закрыт</Badge>
          )}
          {isFull && (
            <Badge variant="destructive">Полный состав</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 flex-col">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/teams/${team.id}`)}
          >
            Подробнее
          </Button>
          {showManageButton && (
            <Button
              className="flex-1"
              onClick={() => navigate(`/teams/${team.id}`)}
            >
              Управление командой
            </Button>
          )}
          {showApplyButton && (
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={isApplying}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isApplying ? "Отправка..." : "Подать заявку"}
            </Button>
          )}
        </div>
        {showAlreadyInTeam && (
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Вы уже состоите в команде. Чтобы вступить в другую — сначала покиньте текущую.
          </p>
        )}
        {showRecruitmentClosed && (
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Набор закрыт.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
