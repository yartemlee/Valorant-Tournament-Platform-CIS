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

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTournamentDialog({ open, onOpenChange, onSuccess }: CreateTournamentDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    format: "single_elimination",
    start_time: "",
    prize_pool: "",
    max_teams: 16,
    rules: "",
    banner_url: "",
  });

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
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (selectedDate < tomorrow) {
      toast.error("Дата начала турнира должна быть в будущем");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("tournaments")
      .insert([
        {
          ...formData,
          organizer_id: user.id,
          status: "registration",
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error("Ошибка создания турнира");
      console.error(error);
      return;
    }

    toast.success("Турнир создан");
    onSuccess?.();
    navigate(`/tournaments/${data.id}`);
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
                min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Минимум: завтра
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize_pool">Призовой фонд</Label>
              <Input
                id="prize_pool"
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                placeholder="Например: $500"
              />
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

          <div className="space-y-2">
            <Label htmlFor="banner_url">URL обложки</Label>
            <Input
              id="banner_url"
              type="url"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Создание..." : "Создать турнир"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
