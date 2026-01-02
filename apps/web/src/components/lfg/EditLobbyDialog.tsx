import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronsUpDown, X } from 'lucide-react';
import { type LFGLobbyWithMembers, type UpdateLobbyParams } from '@/hooks/useLFGLobbies';

const formSchema = z.object({
    title: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
    description: z.string().max(200, 'Максимум 200 символов').optional(),
    maxSize: z.coerce.number().min(2).max(10),
    servers: z.array(z.string()).default([]),
    minRank: z.string().optional(),
    maxRank: z.string().optional(),
    isPrivate: z.boolean().default(false),
    voiceRequired: z.boolean().default(false),
});

export type EditLobbyFormValues = z.infer<typeof formSchema>;

interface EditLobbyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lobby: LFGLobbyWithMembers;
    onSubmit: (values: UpdateLobbyParams) => Promise<void>;
}

const SERVERS = [
    { value: 'frankfurt', label: 'Франкфурт' },
    { value: 'paris', label: 'Париж' },
    { value: 'london', label: 'Лондон' },
    { value: 'warsaw', label: 'Варшава' },
    { value: 'stockholm', label: 'Стокгольм' },
    { value: 'istanbul', label: 'Стамбул' },
    { value: 'madrid', label: 'Мадрид' },
    { value: 'bahrain', label: 'Бахрейн' },
    { value: 'dubai', label: 'Дубай' },
    { value: 'capetown', label: 'Кейптаун' },
    { value: 'tokyo', label: 'Токио' },
];

const RANKS = [
    'Iron 1', 'Iron 2', 'Iron 3',
    'Bronze 1', 'Bronze 2', 'Bronze 3',
    'Silver 1', 'Silver 2', 'Silver 3',
    'Gold 1', 'Gold 2', 'Gold 3',
    'Platinum 1', 'Platinum 2', 'Platinum 3',
    'Diamond 1', 'Diamond 2', 'Diamond 3',
    'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
    'Immortal 1', 'Immortal 2', 'Immortal 3',
    'Radiant',
];

const GAME_MODE_LABELS: Record<string, string> = {
    competitive: 'Соревновательный',
    unrated: 'Обычный',
    spike_rush: 'Spike Rush',
    deathmatch: 'Deathmatch',
    swiftplay: 'Быстрый',
    tdm: 'TDM',
    escalation: 'Escalation',
    custom: 'Кастом',
};

export function EditLobbyDialog({ open, onOpenChange, lobby, onSubmit }: EditLobbyDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<EditLobbyFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: lobby.title,
            description: lobby.description || '',
            maxSize: lobby.max_size,
            servers: [],
            minRank: lobby.min_rank || 'none',
            maxRank: lobby.max_rank || 'none',
            isPrivate: lobby.is_private || false,
            voiceRequired: lobby.voice_required || false,
        },
    });

    // Update form when lobby changes
    useEffect(() => {
        if (open) {
            form.reset({
                title: lobby.title,
                description: lobby.description || '',
                maxSize: lobby.max_size,
                servers: [],
                minRank: lobby.min_rank || 'none',
                maxRank: lobby.max_rank || 'none',
                isPrivate: lobby.is_private || false,
                voiceRequired: lobby.voice_required || false,
            });
        }
    }, [open, lobby, form]);

    const handleSubmit = async (values: EditLobbyFormValues) => {
        setIsSubmitting(true);
        try {
            await onSubmit({
                lobbyId: lobby.id,
                title: values.title,
                description: values.description,
                maxSize: values.maxSize,
                minRank: values.minRank === 'none' ? undefined : values.minRank,
                maxRank: values.maxRank === 'none' ? undefined : values.maxRank,
                isPrivate: values.isPrivate,
                voiceRequired: values.voiceRequired,
            });
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cannot reduce max_size below current member count
    const currentMemberCount = lobby.lfg_lobby_members?.length || 1;
    const isCompetitive = lobby.game_mode === 'competitive';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Редактировать лобби</DialogTitle>
                    <DialogDescription>
                        Измените настройки вашего лобби. Режим игры: <strong>{GAME_MODE_LABELS[lobby.game_mode] || lobby.game_mode}</strong>
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        {/* Название */}
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Название</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ищем 2 в рейтинг" maxLength={50} {...field} />
                                    </FormControl>
                                    <div className="flex justify-between">
                                        <FormMessage />
                                        <span className="text-xs text-muted-foreground">{field.value?.length || 0}/50</span>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Описание */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Описание (опционально)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Дополнительная информация о лобби..."
                                            className="resize-none"
                                            rows={2}
                                            maxLength={200}
                                            {...field}
                                        />
                                    </FormControl>
                                    <div className="flex justify-between">
                                        <FormMessage />
                                        <span className="text-xs text-muted-foreground">{field.value?.length || 0}/200</span>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {/* Размер команды */}
                        <FormField
                            control={form.control}
                            name="maxSize"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Размер команды</FormLabel>
                                    <Select onValueChange={field.onChange} value={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[2, 3, 5].map((num) => (
                                                <SelectItem
                                                    key={num}
                                                    value={String(num)}
                                                    disabled={num < currentMemberCount}
                                                >
                                                    {num === 2 ? 'Duo (2)' : num === 3 ? 'Trio (3)' : 'Full stack (5)'}
                                                    {num < currentMemberCount && ' (слишком мало)'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Ранги для соревновательного режима */}
                        {isCompetitive && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="minRank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Минимальный ранг</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Любой" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Любой</SelectItem>
                                                    {RANKS.map((rank) => (
                                                        <SelectItem key={rank} value={rank}>
                                                            {rank}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="maxRank"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Максимальный ранг</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Любой" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Любой</SelectItem>
                                                    {RANKS.map((rank) => (
                                                        <SelectItem key={rank} value={rank}>
                                                            {rank}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {/* Серверы */}
                        <FormField
                            control={form.control}
                            name="servers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Серверы</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full h-auto min-h-10 justify-between font-normal"
                                                >
                                                    {field.value.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 flex-1">
                                                            {field.value.map((serverValue) => {
                                                                const server = SERVERS.find((s) => s.value === serverValue);
                                                                return (
                                                                    <Badge key={serverValue} variant="secondary" className="text-xs">
                                                                        {server?.label}
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground flex-1 text-left">Оптимальный</span>
                                                    )}
                                                    <div className="flex items-center gap-1 ml-2">
                                                        {field.value.length > 0 && (
                                                            <span
                                                                role="button"
                                                                className="rounded-sm hover:bg-accent p-0.5"
                                                                onPointerDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                }}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    field.onChange([]);
                                                                }}
                                                            >
                                                                <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                                                            </span>
                                                        )}
                                                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                                    </div>
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-2" align="start">
                                            <div className="grid grid-cols-2 gap-2">
                                                {SERVERS.map((server) => {
                                                    const isSelected = field.value.includes(server.value);
                                                    return (
                                                        <div
                                                            key={server.value}
                                                            className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    field.onChange(field.value.filter((v) => v !== server.value));
                                                                } else {
                                                                    field.onChange([...field.value, server.value]);
                                                                }
                                                            }}
                                                        >
                                                            <Checkbox checked={isSelected} />
                                                            <span className="text-sm">{server.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Переключатели */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="voiceRequired"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Голосовой чат</FormLabel>
                                            <FormDescription>
                                                Только с микрофоном
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isPrivate"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Приватное</FormLabel>
                                            <FormDescription>
                                                Нужен запрос доступа
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Отмена
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
