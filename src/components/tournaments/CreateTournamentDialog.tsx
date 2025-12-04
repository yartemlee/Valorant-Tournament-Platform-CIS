import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEFAULT_RULES } from "@/constants/tournament";

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTournamentDialog({ open, onOpenChange, onSuccess }: CreateTournamentDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userCoins, setUserCoins] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    format: "single_elimination",
    start_time: "",
    prize_pool: "",
    max_teams: 16,

    rules: DEFAULT_RULES,
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

  // Fetch coins when dialog opens
  if (open && userCoins === null) {
    fetchUserCoins();
  }

  const prizePoolAmount = parseInt(formData.prize_pool) || 0;
  const commission = 1;
  const totalCost = prizePoolAmount + commission;
  const canAfford = userCoins !== null && userCoins >= totalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Войдите, чтобы создать турнир");
      navigate("/login");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Введите название турнира");
      return;
    }

    if (!formData.start_time) {
      toast.error("Выберите дату начала");
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(formData.start_time);
    const now = new Date();

    if (selectedDate < now) {
      toast.error("Дата начала турнира должна быть в будущем");
      return;
    }

    if (!canAfford) {
      toast.error("Недостаточно средств для создания турнира");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.rpc('create_tournament_with_payment', {
      p_title: formData.title,
      p_description: formData.description,
      p_format: formData.format as any,
      p_start_time: formData.start_time,
      p_prize_pool: formData.prize_pool, // Pass as string, RPC handles parsing
      p_max_teams: formData.max_teams,
      p_rules: formData.rules,

    });

    setLoading(false);

    if (error) {
      toast.error("Ошибка создания турнира: " + error.message);
      console.error(error);
      return;
    }

    toast.success(`Турнир создан! Списано ${totalCost} VP`);
    onSuccess?.();
    // RPC returns the new tournament ID in the response
    // The response structure from RPC is JSONB, so we might need to cast or access carefully
    // Based on our RPC: RETURN jsonb_build_object('id', v_tournament_id, ...)
    const newTournamentId = (data as any)?.id;
    if (newTournamentId) {
      navigate(`/tournaments/${newTournamentId}`);
    } else {
      // Fallback if ID not found (shouldn't happen if RPC works)
      navigate('/tournaments');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать турнир</DialogTitle>
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
            <div className="text-xs text-muted-foreground text-right">
              {formData.title.length}/100
            </div>
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
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/300
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">
                Формат сетки <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData({ ...formData, format: value })}
              >
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
                min={new Date().toISOString().slice(0, 16)}
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
                min="0"
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Комиссия платформы: 1 VP
              </p>
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

          {/* Cost Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ваш баланс:</span>
              <span className="font-medium">{userCoins !== null ? `${userCoins} VP` : 'Загрузка...'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Призовой фонд:</span>
              <span>{prizePoolAmount} VP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Комиссия:</span>
              <span>{commission} VP</span>
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
              {loading ? "Создание..." : `Создать за ${totalCost} VP`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
