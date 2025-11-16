import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";

interface LeaveTeamButtonProps {
  teamId: string;
  userId: string;
  isCaptain: boolean;
  onLeave?: () => void;
}

export function LeaveTeamButton({ teamId, userId, isCaptain, onLeave }: LeaveTeamButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveTeam = async () => {
    if (isCaptain) {
      toast({
        title: "Нельзя покинуть команду",
        description: "Сначала передайте капитанство другому участнику",
        variant: "destructive",
      });
      return;
    }

    setIsLeaving(true);
    try {
      // Find member record
      const { data: memberData } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .single();

      if (!memberData) {
        throw new Error("Не удалось найти запись участника");
      }

      // Remove from team
      const { error: memberError } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberData.id);

      if (memberError) throw memberError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ current_team_id: null })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Cancel related invites
      await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("team_id", teamId)
        .eq("to_user_id", userId)
        .in("status", ["pending", "accepted"]);

      toast({
        title: "Вы покинули команду",
        description: "Вы можете присоединиться к другой команде",
      });

      // Invalidate caches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["team", teamId] }),
        queryClient.invalidateQueries({ queryKey: ["team-member"] }),
      ]);

      setShowConfirm(false);
      
      if (onLeave) {
        onLeave();
      }
    } catch (error: any) {
      console.error("Leave team error:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось покинуть команду",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
        disabled={isCaptain}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Покинуть команду
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Покинуть команду?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы сможете присоединиться к другой команде позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              disabled={isLeaving}
            >
              {isLeaving ? "Выход..." : "Покинуть"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
