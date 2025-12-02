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
import { Team } from "@/types/common.types";

interface EditTeamDialogProps {
    team: Team | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditTeamDialog({ team, open, onOpenChange, onSuccess }: EditTeamDialogProps) {
    const [form, setForm] = useState({
        name: team?.name || "",
        tag: team?.tag || "",
        logo_url: team?.logo_url || "",
        description: team?.description || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!team) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("teams")
                .update({
                    name: form.name,
                    tag: form.tag,
                    logo_url: form.logo_url || null,
                    description: form.description || null,
                })
                .eq("id", team.id);

            if (error) throw error;

            toast.success("Команда обновлена");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating team:", error);
            toast.error("Ошибка обновления команды");
        } finally {
            setSaving(false);
        }
    };

    // Update form when team changes
    if (team && form.name === "" && team.name) {
        setForm({
            name: team.name || "",
            tag: team.tag || "",
            logo_url: team.logo_url || "",
            description: team.description || "",
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Редактировать команду</DialogTitle>
                    <DialogDescription>
                        Изменение данных команды {team?.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Название команды *</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Название команды"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tag">Тег команды *</Label>
                            <Input
                                id="tag"
                                value={form.tag}
                                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                                placeholder="TAG"
                                maxLength={5}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="logo_url">URL логотипа</Label>
                            <Input
                                id="logo_url"
                                value={form.logo_url}
                                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                                placeholder="https://example.com/logo.png"
                                type="url"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Описание команды"
                                rows={3}
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
