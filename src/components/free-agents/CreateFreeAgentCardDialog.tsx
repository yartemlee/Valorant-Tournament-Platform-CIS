import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Role options
const roleOptions = [
    { value: "duelist", label: "Дуэлянт" },
    { value: "initiator", label: "Инициатор" },
    { value: "controller", label: "Специалист" },
    { value: "sentinel", label: "Страж" },
];

const MAX_INTRO_LENGTH = 500;

interface CreateFreeAgentCardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: { intro: string; preferred_roles: string[] }) => Promise<void>;
    initialData?: {
        intro: string;
        preferred_roles: string[];
    };
    isEditing?: boolean;
}

export function CreateFreeAgentCardDialog({
    open,
    onOpenChange,
    onSave,
    initialData,
    isEditing = false,
}: CreateFreeAgentCardDialogProps) {
    const [intro, setIntro] = useState(initialData?.intro || "");
    const [preferredRoles, setPreferredRoles] = useState<string[]>(initialData?.preferred_roles || []);
    const [saving, setSaving] = useState(false);

    // Reset form when dialog opens/closes or initialData changes
    useEffect(() => {
        if (open) {
            setIntro(initialData?.intro || "");
            setPreferredRoles(initialData?.preferred_roles || []);
        }
    }, [open, initialData]);

    const toggleRole = (role: string) => {
        setPreferredRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const handleSave = async () => {
        if (!intro.trim()) return;

        try {
            setSaving(true);
            await onSave({ intro: intro.trim(), preferred_roles: preferredRoles });
            onOpenChange(false);
        } catch (error) {
            console.error("Error saving card:", error);
        } finally {
            setSaving(false);
        }
    };

    const charactersLeft = MAX_INTRO_LENGTH - intro.length;
    const isOverLimit = charactersLeft < 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-display">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {isEditing ? "Редактировать карточку" : "Создать карточку свободного агента"}
                    </DialogTitle>
                    <DialogDescription>
                        Расскажите потенциальным командам о себе. Ваши роли и агенты будут автоматически подтянуты из профиля.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Intro textarea */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            О себе <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            placeholder="Опишите свой опыт, чего ищете в команде, когда готовы играть..."
                            value={intro}
                            onChange={(e) => setIntro(e.target.value)}
                            className="min-h-[120px] resize-none"
                            maxLength={MAX_INTRO_LENGTH + 50} // Allow slight overflow for UX
                        />
                        <div className={cn(
                            "text-xs text-right",
                            isOverLimit ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {charactersLeft} / {MAX_INTRO_LENGTH}
                        </div>
                    </div>

                    {/* Preferred roles */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Предпочитаемые роли</label>
                        <p className="text-xs text-muted-foreground">
                            Выберите роли, которые вы хотите играть в команде
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {roleOptions.map((role) => (
                                <Badge
                                    key={role.value}
                                    variant={preferredRoles.includes(role.value) ? "default" : "outline"}
                                    className={cn(
                                        "cursor-pointer transition-all hover:scale-105",
                                        preferredRoles.includes(role.value)
                                            ? "bg-primary text-primary-foreground shadow-glow-primary"
                                            : "hover:bg-primary/10"
                                    )}
                                    onClick={() => toggleRole(role.value)}
                                >
                                    {role.label}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !intro.trim() || isOverLimit}
                    >
                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEditing ? "Сохранить" : "Создать карточку"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
