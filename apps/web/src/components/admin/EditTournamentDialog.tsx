import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tournament } from "@/types/common.types";

interface EditTournamentDialogProps {
    tournament: Tournament | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditTournamentDialog({ tournament, open, onOpenChange, onSuccess }: EditTournamentDialogProps) {
    const [form, setForm] = useState({
        title: tournament?.title || "",
        description: tournament?.description || "",
        rules: tournament?.rules || "",
        prize_pool: tournament?.prize_pool || "",
        max_teams: tournament?.max_teams?.toString() || "",
        start_time: tournament?.start_time ? new Date(tournament.start_time).toISOString().slice(0, 16) : "",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tournament) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("tournaments")
                .update({
                    title: form.title,
                    description: form.description || null,
                    rules: form.rules || null,
                    prize_pool: form.prize_pool || null,
                    max_teams: form.max_teams ? parseInt(form.max_teams) : null,
                    start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
                })
                .eq("id", tournament.id);

            if (error) throw error;

            toast.success("Турнир обновлен");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating tournament:", error);
            toast.error("Ошибка обновления турнира");
        } finally {
            setSaving(false);
        }
    };

    // Update form when tournament changes
    if (tournament && form.title === "" && tournament.title) {
        setForm({
            title: tournament.title || "",
            description: tournament.description || "",
            rules: tournament.rules || "",
            prize_pool: tournament.prize_pool || "",
            max_teams: tournament.max_teams?.toString() || "",
            start_time: tournament.start_time ? new Date(tournament.start_time).toISOString().slice(0, 16) : "",
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Редактировать турнир</DialogTitle>
                    <DialogDescription>
                        Изменение данных турнира {tournament?.title}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Название турнира *</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Название турнира"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Описание турнира"
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rules">Правила</Label>
                            <Textarea
                                id="rules"
                                value={form.rules}
                                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                                placeholder="Правила турнира"
                                rows={4}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="max_teams">Макс. команд</Label>
                                <Input
                                    id="max_teams"
                                    type="number"
                                    value={form.max_teams}
                                    onChange={(e) => setForm({ ...form, max_teams: e.target.value })}
                                    placeholder="16"
                                    min="2"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="prize_pool">Призовой фонд</Label>
                                <Input
                                    id="prize_pool"
                                    value={form.prize_pool}
                                    onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                                    placeholder="10,000₽"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="start_time">Дата и время начала</Label>
                            <Input
                                id="start_time"
                                type="datetime-local"
                                value={form.start_time}
                                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
