import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Войдите, чтобы создать турнир");
      onOpenChange(false);
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error("Введите название турнира");
      return;
    }

    if (!formData.date_start) {
      toast.error("Выберите дату начала");
      return;
    }

    // Check if date is in the past
    const selectedDate = new Date(formData.date_start);
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
          owner_id: user.id,
          status: "open",
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
            <Label htmlFor="name">
              Название турнира <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <Label htmlFor="bracket_format">
                Формат сетки <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.bracket_format}
                onValueChange={(value) => setFormData({ ...formData, bracket_format: value })}
              >
                <SelectTrigger id="bracket_format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_start">
                Дата и время начала <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date_start"
                type="datetime-local"
                value={formData.date_start}
                onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
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
              <Label htmlFor="prize">Призовой фонд</Label>
              <Input
                id="prize"
                value={formData.prize}
                onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                placeholder="Например: $500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_limit">Лимит команд</Label>
              <Input
                id="participant_limit"
                type="number"
                min={2}
                max={64}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="registration_open"
              checked={formData.registration_open}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, registration_open: checked as boolean })
              }
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
              {loading ? "Создание..." : "Создать турнир"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
