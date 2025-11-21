import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fillTournamentWithPhantoms, cleanupTournamentPhantoms } from "@/lib/phantomData";

interface PhantomDataControlsProps {
  tournamentId: string;
  onUpdate: () => void;
}

export function PhantomDataControls({ tournamentId, onUpdate }: PhantomDataControlsProps) {
  const [fillDialogOpen, setFillDialogOpen] = useState(false);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("auto");

  const handleFill = async () => {
    setIsLoading(true);
    try {
      const size = selectedSize === "auto" ? undefined : parseInt(selectedSize);
      const result = await fillTournamentWithPhantoms(tournamentId, size);
      
      toast.success(
        `Турнир заполнен фантомными командами`,
        {
          description: `Создано команд: ${result.createdTeams}, игроков: ${result.createdUsers}`,
        }
      );
      
      setFillDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Fill tournament error:", error);
      toast.error("Ошибка заполнения турнира", {
        description: error.message || "Не удалось создать фантомные команды",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupTournamentPhantoms(tournamentId);
      
      toast.success("Фантомные данные турнира удалены", {
        description: `Удалено команд: ${result.removedTeams}, игроков: ${result.removedUsers}`,
      });
      
      setCleanupDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Cleanup tournament error:", error);
      toast.error("Ошибка удаления фантомных данных", {
        description: error.message || "Не удалось удалить фантомные данные",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setFillDialogOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Users className="h-4 w-4 mr-2" />
        )}
        Заполнить турнир
      </Button>

      <Button
        variant="outline"
        onClick={() => setCleanupDialogOpen(true)}
        disabled={isLoading}
        className="text-destructive hover:text-destructive"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 mr-2" />
        )}
        Удалить фантомные данные
      </Button>

      <AlertDialog open={fillDialogOpen} onOpenChange={setFillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Заполнить турнир?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Будут добавлены фантомные команды и игроки для тестирования сетки.
                Реальные команды не затронуты.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Размер сетки
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите размер" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Автоматически</SelectItem>
                    <SelectItem value="8">8 команд</SelectItem>
                    <SelectItem value="16">16 команд</SelectItem>
                    <SelectItem value="32">32 команд</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Автоматический режим выберет следующий размер сетки (8, 16 или 32)
                  в зависимости от текущего количества зарегистрированных команд.
                </p>
              </div>
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
            <AlertDialogTitle>Удалить фантомные данные?</AlertDialogTitle>
            <AlertDialogDescription>
              Будут удалены фантомные регистрации, команды и игроки, созданные для тестирования.
              Реальные команды и игроки останутся без изменений.
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
