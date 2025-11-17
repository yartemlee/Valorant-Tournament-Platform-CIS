import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserPlus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fillTeamRoster, cleanupTeamPhantoms } from "@/lib/phantomData";

interface PhantomPlayersControlsProps {
  teamId: string;
  onUpdate: () => void;
}

export function PhantomPlayersControls({ teamId, onUpdate }: PhantomPlayersControlsProps) {
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFill = async () => {
    setIsLoading(true);
    try {
      const result = await fillTeamRoster(teamId, 5, 10);
      
      toast.success("Состав пополнен фантомными игроками", {
        description: `Добавлено игроков: ${result.addedPhantoms}, всего в команде: ${result.totalMembers}`,
      });
      
      setFillDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Fill team roster error:", error);
      toast.error("Ошибка пополнения состава", {
        description: error.message || "Не удалось добавить фантомных игроков",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupTeamPhantoms(teamId);
      
      toast.success("Фантомные игроки удалены", {
        description: `Удалено игроков: ${result.removedPhantoms}`,
      });
      
      setCleanupDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Cleanup team phantoms error:", error);
      toast.error("Ошибка удаления фантомных игроков", {
        description: error.message || "Не удалось удалить фантомных игроков",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2 relative z-10 pointer-events-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setFillDialogOpen(true);
        }}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )}
        Заполнить команду игроками
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCleanupDialogOpen(true);
        }}
        disabled={isLoading}
        className="text-destructive hover:text-destructive"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        Удалить фантомных игроков
      </Button>

      <AlertDialog open={fillDialogOpen} onOpenChange={setFillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заполнить состав?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут добавлены фантомные игроки до полноценного состава (минимум 5, максимум 10 игроков).
              Реальные участники не будут изменены или удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleFill} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Заполнение...
                </>
              ) : (
                "Заполнить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить фантомных игроков?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут удалены все фантомные игроки из состава команды.
              Реальные участники останутся без изменений.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanup}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
