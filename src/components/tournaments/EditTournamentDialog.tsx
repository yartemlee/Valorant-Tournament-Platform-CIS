import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface EditTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: any;
  onSuccess?: () => void;
}

export function EditTournamentDialog({
  open,
  onOpenChange,
  tournament,
  onSuccess,
}: EditTournamentDialogProps) {
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

  useEffect(() => {
    if (tournament) {
      setFormData({
        title: tournament.title || "",
        description: tournament.description || "",
        format: tournament.format || "single_elimination",
        start_time: tournament.start_time ? new Date(tournament.start_time).toISOString().slice(0, 16) : "",
        prize_pool: tournament.prize_pool || "",
        max_teams: tournament.max_teams || 16,
        rules: tournament.rules || "",
        banner_url: tournament.banner_url || "",
      });
    }
  }, [tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_time) {
      toast.error("Заполните обязательные поля");
      return;
    }

    // Проверка - если турнир уже активен, запретить редактирование
    if (tournament.status === "active" || tournament.status === "completed") {
      toast.error("Нельзя редактировать турнир после его начала");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          title: formData.title,
          description: formData.description,
          format: formData.format,
          start_time: new Date(formData.start_time).toISOString(),
          prize_pool: formData.prize_pool || null,
          max_teams: formData.max_teams,
          rules: formData.rules || null,
          banner_url: formData.banner_url || null,
        })
        .eq("id", tournament.id);

      if (error) throw error;

      toast.success("Изменения сохранены");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Ошибка сохранения");
      console.error(error);
    } finally {
      setLoading(false);
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
            <Label htmlFor="title">Название турнира *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Введите название"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Короткое описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="До 300 символов"
              maxLength={300}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Формат сетки *</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Дата и время начала *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize_pool">Приз</Label>
              <Input
                id="prize_pool"
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                placeholder="Например: 10,000₽"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_teams">Лимит команд</Label>
              <Input
                id="max_teams"
                type="number"
                min="2"
                max="64"
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
              placeholder="Опишите правила турнира"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner_url">URL обложки</Label>
            <Input
              id="banner_url"
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
              {loading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
