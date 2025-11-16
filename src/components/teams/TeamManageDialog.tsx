import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Mail, Settings } from "lucide-react";
import { TeamRosterTab } from "./manage/TeamRosterTab";
import { TeamApplicationsTab } from "./manage/TeamApplicationsTab";
import { TeamSettingsTab } from "./manage/TeamSettingsTab";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TeamManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: any;
  isOwner: boolean;
  isCaptain?: boolean;
  isCoach?: boolean;
  onCaptainTransferred?: () => void;
}

export function TeamManageDialog({ open, onOpenChange, team, isOwner, isCaptain, isCoach, onCaptainTransferred }: TeamManageDialogProps) {
  // Доступ только для капитана или тренера (no separate owner role)
  const hasAccess = isCaptain || isCoach;

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // If user loses captain/coach status, close the dialog immediately
  if (open && !hasAccess) {
    onOpenChange(false);
    return null;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Управление командой</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="roster" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roster" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Состав
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Заявки и приглашения
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="mt-6">
            <TeamRosterTab 
              team={team} 
              isOwner={isOwner} 
              isCaptain={isCaptain} 
              isCoach={isCoach}
              currentUserId={session?.user?.id}
              onCaptainTransferred={() => {
                onOpenChange(false);
                onCaptainTransferred?.();
              }}
            />
          </TabsContent>

          <TabsContent value="applications" className="mt-6">
            <TeamApplicationsTab teamId={team.id} session={session} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <TeamSettingsTab team={team} isOwner={isOwner} isCaptain={isCaptain} isCoach={isCoach} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
