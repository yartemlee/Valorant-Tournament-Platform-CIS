import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Profile } from "@/types/common.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditUserDialogProps {
    user: Profile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const ranks = [
    "Iron 1", "Iron 2", "Iron 3",
    "Bronze 1", "Bronze 2", "Bronze 3",
    "Silver 1", "Silver 2", "Silver 3",
    "Gold 1", "Gold 2", "Gold 3",
    "Platinum 1", "Platinum 2", "Platinum 3",
    "Diamond 1", "Diamond 2", "Diamond 3",
    "Ascendant 1", "Ascendant 2", "Ascendant 3",
    "Immortal 1", "Immortal 2", "Immortal 3",
    "Radiant"
];

const regions = ["eu", "na", "ap", "kr", "br", "latam"];

export function EditUserDialog({ user, open, onOpenChange, onSuccess }: EditUserDialogProps) {
    const [form, setForm] = useState({
        // Basic info
        nickname: "",
        riot_id: "",
        rank: "",
        region: "",
        avatar_url: "",
        bio: "",

        // Personal info
        country: "",
        phone_number: "",
        status: "",
        instagram_username: "",

        // Privacy settings
        show_statistics: true,
        show_country: true,
        show_social_links: true,

        // Notification settings
        email_notifications: true,
        discord_notifications: false,
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                nickname: user.nickname || "",
                riot_id: user.riot_id || "",
                rank: user.rank || "",
                region: user.region || "",
                avatar_url: user.avatar_url || "",
                bio: user.bio || "",
                country: (user as any).country || "",
                phone_number: (user as any).phone_number || "",
                status: (user as any).status || "",
                instagram_username: (user as any).instagram_username || "",
                show_statistics: (user as any).show_statistics ?? true,
                show_country: (user as any).show_country ?? true,
                show_social_links: (user as any).show_social_links ?? true,
                email_notifications: (user as any).email_notifications ?? true,
                discord_notifications: (user as any).discord_notifications ?? false,
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    nickname: form.nickname || null,
                    riot_id: form.riot_id || null,
                    rank: form.rank || null,
                    region: form.region || null,
                    avatar_url: form.avatar_url || null,
                    bio: form.bio || null,
                    country: form.country || null,
                    phone_number: form.phone_number || null,
                    status: form.status || null,
                    instagram_username: form.instagram_username || null,
                    show_statistics: form.show_statistics,
                    show_country: form.show_country,
                    show_social_links: form.show_social_links,
                    email_notifications: form.email_notifications,
                    discord_notifications: form.discord_notifications,
                })
                .eq("id", user.id);

            if (error) throw error;

            toast.success("Профиль обновлен");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Ошибка обновления профиля");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Редактировать пользователя</DialogTitle>
                    <DialogDescription>
                        Изменение данных профиля {user?.username}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="basic">Основное</TabsTrigger>
                            <TabsTrigger value="personal">Личное</TabsTrigger>
                            <TabsTrigger value="privacy">Приватность</TabsTrigger>
                            <TabsTrigger value="notify">Уведомления</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basic" className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="nickname">Никнейм</Label>
                                <Input
                                    id="nickname"
                                    value={form.nickname}
                                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                                    placeholder="Отображаемое имя"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="riot_id">Riot ID</Label>
                                <Input
                                    id="riot_id"
                                    value={form.riot_id}
                                    onChange={(e) => setForm({ ...form, riot_id: e.target.value })}
                                    placeholder="Username#TAG"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="rank">Ранг</Label>
                                <Select
                                    value={form.rank}
                                    onValueChange={(value) => setForm({ ...form, rank: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите ранг" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {ranks.map((rank) => (
                                            <SelectItem key={rank} value={rank}>
                                                {rank}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="region">Регион</Label>
                                <Select
                                    value={form.region}
                                    onValueChange={(value) => setForm({ ...form, region: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите регион" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regions.map((region) => (
                                            <SelectItem key={region} value={region}>
                                                {region.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="avatar_url">URL аватара</Label>
                                <Input
                                    id="avatar_url"
                                    value={form.avatar_url}
                                    onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                                    placeholder="https://example.com/avatar.png"
                                    type="url"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Био</Label>
                                <Textarea
                                    id="bio"
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    placeholder="О себе"
                                    rows={3}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="personal" className="space-y-4 mt-4">
                            <div className="grid gap-2">
                                <Label htmlFor="country">Страна (код)</Label>
                                <Input
                                    id="country"
                                    value={form.country}
                                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                                    placeholder="RU, US, GB..."
                                    maxLength={2}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">Телефон</Label>
                                <Input
                                    id="phone_number"
                                    value={form.phone_number}
                                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                                    placeholder="+7 (999) 123-45-67"
                                    type="tel"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Статус</Label>
                                <Input
                                    id="status"
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    placeholder="Собственный статус"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="instagram_username">Instagram</Label>
                                <Input
                                    id="instagram_username"
                                    value={form.instagram_username}
                                    onChange={(e) => setForm({ ...form, instagram_username: e.target.value })}
                                    placeholder="username"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="privacy" className="space-y-4 mt-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="show_statistics"
                                    checked={form.show_statistics}
                                    onCheckedChange={(checked) =>
                                        setForm({ ...form, show_statistics: checked as boolean })
                                    }
                                />
                                <Label htmlFor="show_statistics" className="cursor-pointer">
                                    Показывать статистику
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="show_country"
                                    checked={form.show_country}
                                    onCheckedChange={(checked) =>
                                        setForm({ ...form, show_country: checked as boolean })
                                    }
                                />
                                <Label htmlFor="show_country" className="cursor-pointer">
                                    Показывать страну
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="show_social_links"
                                    checked={form.show_social_links}
                                    onCheckedChange={(checked) =>
                                        setForm({ ...form, show_social_links: checked as boolean })
                                    }
                                />
                                <Label htmlFor="show_social_links" className="cursor-pointer">
                                    Показывать социальные сети
                                </Label>
                            </div>
                        </TabsContent>

                        <TabsContent value="notify" className="space-y-4 mt-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="email_notifications"
                                    checked={form.email_notifications}
                                    onCheckedChange={(checked) =>
                                        setForm({ ...form, email_notifications: checked as boolean })
                                    }
                                />
                                <Label htmlFor="email_notifications" className="cursor-pointer">
                                    Email уведомления
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="discord_notifications"
                                    checked={form.discord_notifications}
                                    onCheckedChange={(checked) =>
                                        setForm({ ...form, discord_notifications: checked as boolean })
                                    }
                                />
                                <Label htmlFor="discord_notifications" className="cursor-pointer">
                                    Discord уведомления
                                </Label>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
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
