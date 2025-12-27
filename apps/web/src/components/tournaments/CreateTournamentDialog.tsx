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
import { DEFAULT_RULES, VALORANT_MAPS, VALORANT_RANKS } from "@/constants/tournament";
import { slugify } from "@/utils/slugify";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { TournamentSettings, Database } from "@/types/common.types";
import { DateTimeInput } from "@/components/ui/datetime-input";

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
    substitution_limit: 0,
    // Flexible Settings
    team_size: 5,
    veto_enabled: true,
    veto_time_limit: 60,
    map_pool: [...VALORANT_MAPS],
    rank_min: "Iron 1",
    rank_max: "Radiant",
    servers: ["eu"],
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
    const maxDate = new Date();
    maxDate.setFullYear(now.getFullYear() + 5);

    if (selectedDate < now) {
      toast.error("Дата начала турнира должна быть в будущем");
      return;
    }

    if (selectedDate > maxDate) {
      toast.error("Дата начала турнира не может быть более чем через 5 лет");
      return;
    }

    if (!canAfford) {
      toast.error("Недостаточно средств для создания турнира");
      return;
    }

    setLoading(true);

    const settings: TournamentSettings = {
      team_size: formData.team_size,
      match_format: "bo1", // Default, will be configured per round
      veto_enabled: formData.veto_enabled,
      veto_time_limit: formData.veto_time_limit,
      map_pool: formData.map_pool,
      rank_min: formData.rank_min,
      rank_max: formData.rank_max,
      servers: formData.servers,
    };

    const { data, error } = await supabase.rpc('create_tournament_with_payment', {
      p_title: formData.title,
      p_description: formData.description,
      p_format: formData.format as Database['public']['Enums']['tournament_format'],
      p_start_time: formData.start_time,
      p_prize_pool: formData.prize_pool,
      p_max_teams: formData.max_teams,
      p_rules: formData.rules,
      p_settings: settings,
    });

    setLoading(false);

    if (error) {
      toast.error("Ошибка создания турнира: " + error.message);
      return;
    }

    toast.success(`Турнир создан! Списано ${totalCost} VP`);
    onSuccess?.();

    const newTournamentId = (data as { id: string })?.id;
    if (newTournamentId) {
      const shortId = newTournamentId.slice(-4);
      const slug = `${slugify(formData.title)}-${shortId}`;

      const { error: slugError } = await supabase
        .from('tournaments')
        .update({ slug } as unknown as never)
        .eq('id', newTournamentId);

      if (!slugError) {
        navigate(`/tournaments/${slug}`);
      } else {
        navigate(`/tournaments/${newTournamentId}`);
      }
    } else {
      navigate('/tournaments');
    }
  };

  const maxDateStr = new Date();
  maxDateStr.setFullYear(maxDateStr.getFullYear() + 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать турнир</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Короткое описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Опишите турнир в нескольких словах"
              maxLength={300}
              rows={2}
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.description.length}/300
            </div>
          </div>

          {/* Row 1: Format, Team Size, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <Label htmlFor="team_size">Размер команды</Label>
              <Select
                value={formData.team_size.toString()}
                onValueChange={(value) => setFormData({ ...formData, team_size: parseInt(value) })}
              >
                <SelectTrigger id="team_size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x1</SelectItem>
                  <SelectItem value="2">2x2</SelectItem>
                  <SelectItem value="3">3x3</SelectItem>
                  <SelectItem value="5">5x5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">
                Дата начала <span className="text-destructive">*</span>
              </Label>
              <DateTimeInput
                id="start_time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
                max={maxDateStr.toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>

          {/* Row 2: Rank Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rank_min">Мин. ранг</Label>
              <Select
                value={formData.rank_min}
                onValueChange={(value) => setFormData({ ...formData, rank_min: value })}
              >
                <SelectTrigger id="rank_min">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALORANT_RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank_max">Макс. ранг</Label>
              <Select
                value={formData.rank_max}
                onValueChange={(value) => setFormData({ ...formData, rank_max: value })}
              >
                <SelectTrigger id="rank_max">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VALORANT_RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Map Pool & Veto Section */}
          <div className="space-y-4 rounded-lg border p-4" style={{ willChange: 'contents', contain: 'layout' }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Map Veto System</Label>
                <p className="text-xs text-muted-foreground">Включить систему бана карт</p>
              </div>
              <Switch
                checked={formData.veto_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, veto_enabled: checked })}
              />
            </div>

            <div className={formData.veto_enabled ? "space-y-2" : "hidden"}>
              <Label htmlFor="veto_time">Время на ход (сек)</Label>
              <Input
                id="veto_time"
                type="number"
                min={30}
                max={300}
                value={formData.veto_time_limit}
                onChange={(e) => setFormData({ ...formData, veto_time_limit: parseInt(e.target.value) || 60 })}
                className="w-32"
              />
            </div>

            <div className={formData.veto_enabled ? "space-y-2" : "hidden"}>
              <Label>Маппул ({formData.map_pool.length} карт)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 rounded-md border p-3 max-h-32 overflow-y-auto">
                {VALORANT_MAPS.map((map) => (
                  <div key={map} className="flex items-center space-x-2">
                    <Checkbox
                      id={`map-${map}`}
                      checked={formData.map_pool.includes(map)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, map_pool: [...formData.map_pool, map] });
                        } else {
                          setFormData({ ...formData, map_pool: formData.map_pool.filter(m => m !== map) });
                        }
                      }}
                    />
                    <label htmlFor={`map-${map}`} className="text-sm cursor-pointer">
                      {map}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Prize Pool, Max Teams */}
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
                onChange={(e) => setFormData({ ...formData, max_teams: parseInt(e.target.value) || 16 })}
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

          {/* Rules (collapsed by default) */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              Правила турнира (развернуть)
            </summary>
            <div className="mt-2 space-y-2">
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="Опишите правила участия и проведения"
                rows={4}
              />
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
