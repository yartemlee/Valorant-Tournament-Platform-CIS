import { Match, Tournament } from '@/types/common.types';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface EditTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament | null;
  onSuccess?: () => void;
}

export function EditTournamentDialog({
  open,
  onOpenChange,
  tournament,
  onSuccess,
}: EditTournamentDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [initialPrizePool, setInitialPrizePool] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    format: "single_elimination",
    start_time: "",
    prize_pool: "",
    max_teams: 16,
    rules: "",
  });

  // Fetch user coins when dialog opens
  const fetchUserCoins = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserCoins(data.coins);
      }
    }
  };

  useEffect(() => {
    if (open) {
      fetchUserCoins();
    }
  }, [open]);

  useEffect(() => {
    if (tournament) {
      const prizePool = tournament.prize_pool ? parseInt(tournament.prize_pool.toString()) : 0;
      setInitialPrizePool(prizePool);

      setFormData({
        title: tournament.title || "",
        description: tournament.description || "",
        format: tournament.format || "single_elimination",
        start_time: tournament.start_time ? new Date(tournament.start_time).toISOString().slice(0, 16) : "",
        prize_pool: tournament.prize_pool ? tournament.prize_pool.toString() : "",
        max_teams: tournament.max_teams || 16,
        rules: tournament.rules || "",
      });
    }
  }, [tournament]);

  const currentPrizePool = parseInt(formData.prize_pool) || 0;
  const additionalPrize = Math.max(0, currentPrizePool - initialPrizePool);
  const totalCost = additionalPrize;
  const canAfford = userCoins !== null && userCoins >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Введите название турнира");
      return;
    }

    if (!formData.start_time) {
      toast.error("Выберите дату начала");
      return;
    }

    if (currentPrizePool < initialPrizePool) {
      toast.error("Призовой фонд нельзя уменьшать");
      return;
    }

    if (!canAfford) {
      toast.error("Недостаточно средств");
      return;
    }

    // Проверка - если турнир уже активен, запретить редактирование
    if (tournament?.status === "active" || tournament?.status === "completed") {
      toast.error("Нельзя редактировать турнир после его начала");
      return;
    }

    setLoading(true);

    try {
      // Use RPC to handle potential payment and update
      const { data, error } = await supabase.rpc('update_tournament_with_payment', {
        p_tournament_id: tournament?.id,
        p_title: formData.title,
        p_description: formData.description,
        p_format: formData.format as any,
        p_start_time: new Date(formData.start_time).toISOString(),
        p_prize_pool: formData.prize_pool,
        p_max_teams: formData.max_teams,
        p_rules: formData.rules
      });

      if (error) throw error;

      toast.success("Изменения сохранены");
      if (totalCost > 0) {
        toast.success(`Списано ${totalCost} VP`);
        fetchUserCoins();
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Ошибка сохранения: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tournament) return;

    try {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournament.id);

      if (error) throw error;

      toast.success("Турнир удалён");
      onOpenChange(false);
      setDeleteDialogOpen(false);
      navigate("/tournaments");
    } catch (error) {
      toast.error("Ошибка удаления турнира");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать турнир</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Название турнира <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Короткое описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Опишите турнир в нескольких словах"
              maxLength={300}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">
                Формат сетки <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">
                Дата и время начала <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
                className="[color-scheme:dark] w-full block"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize_pool">Призовой фонд (VP)</Label>
              <Input
                id="prize_pool"
                type="number"
                min={initialPrizePool}
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                placeholder="0"
              />
              {initialPrizePool > 0 && (
                <p className="text-xs text-muted-foreground">
                  Текущий фонд: {initialPrizePool} VP. Можно только увеличить.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_teams">Лимит команд</Label>
              <Input
                id="max_teams"
                type="number"
                min={2}
                max={64}
                value={formData.max_teams}
                onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Transaction Summary - Only show if cost > 0 */}
          {totalCost > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ваш баланс:</span>
                <span className="font-medium">{userCoins !== null ? `${userCoins} VP` : 'Загрузка...'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Добавлено в фонд:</span>
                <span>{additionalPrize} VP</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Итого к списанию:</span>
                <span className={canAfford ? "text-primary" : "text-destructive"}>
                  {totalCost} VP
                </span>
              </div>
              {!canAfford && userCoins !== null && (
                <p className="text-xs text-destructive font-medium text-center pt-1">
                  Недостаточно средств на балансе
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="rules">Правила турнира</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Опишите правила участия и проведения"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !canAfford} className="flex-1">
              {loading ? "Сохранение..." : (totalCost > 0 ? `Доплатить ${totalCost} VP и сохранить` : "Сохранить изменения")}
            </Button>
          </div>
        </form>

        {/* Delete button - only for draft/registration status */}
        {(tournament?.status === "draft" || tournament?.status === "registration") && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить турнир
            </Button>
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить турнир?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Турнир и все связанные данные (участники, матчи, результаты) будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
