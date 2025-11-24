import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
    name: "",
    description: "",
    bracket_format: "single_elimination",
    date_start: "",
    prize: "",
    participant_limit: 16,
    rules: "",
    banner_url: "",
    registration_open: true,
  });

  useEffect(() => {
    if (tournament) {
      setFormData({
        name: tournament.name || "",
        description: tournament.description || "",
        bracket_format: tournament.bracket_format || "single_elimination",
        date_start: tournament.date_start ? new Date(tournament.date_start).toISOString().slice(0, 16) : "",
        prize: tournament.prize || "",
        participant_limit: tournament.participant_limit || 16,
        rules: tournament.rules || "",
        banner_url: tournament.banner_url || "",
        registration_open: tournament.registration_open ?? true,
      });
    }
  }, [tournament]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date_start) {
      toast.error("Заполните обязательные поля");
      return;
    }

    // Проверка - если турнир уже начался, запретить редактирование
    if (tournament.started_at) {
      toast.error("Нельзя редактировать турнир после его начала");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("tournaments")
        .update({
          name: formData.name,
          description: formData.description,
          bracket_format: formData.bracket_format,
          date_start: new Date(formData.date_start).toISOString(),
          prize: formData.prize || null,
          participant_limit: formData.participant_limit,
          rules: formData.rules || null,
          banner_url: formData.banner_url || null,
          registration_open: formData.registration_open,
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
            <Label htmlFor="name">Название турнира *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="bracket_format">Формат сетки *</Label>
              <Select value={formData.bracket_format} onValueChange={(value) => setFormData({ ...formData, bracket_format: value })}>
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
              <Label htmlFor="date_start">Дата и время начала *</Label>
              <Input
                id="date_start"
                type="datetime-local"
                value={formData.date_start}
                onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prize">Приз</Label>
              <Input
                id="prize"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                placeholder="Например: 10,000₽"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_limit">Лимит команд</Label>
              <Input
                id="participant_limit"
                type="number"
                min="2"
                max="64"
                value={formData.participant_limit}
                onChange={(e) => setFormData({ ...formData, participant_limit: parseInt(e.target.value) })}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="registration_open"
              checked={formData.registration_open}
              onCheckedChange={(checked) => setFormData({ ...formData, registration_open: checked as boolean })}
            />
            <Label htmlFor="registration_open" className="cursor-pointer">
              Открыт для регистрации
            </Label>
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
