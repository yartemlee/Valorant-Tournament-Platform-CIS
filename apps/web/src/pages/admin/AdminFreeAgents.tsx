import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Trash, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface FreeAgentCardWithProfile {
    id: string;
    user_id: string;
    intro: string;
    preferred_roles: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
    profiles: {
        id: string;
        username: string;
        avatar_url: string | null;
        rank: string | null;
    };
}

const AdminFreeAgents = () => {
    const [cards, setCards] = useState<FreeAgentCardWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("free_agent_cards")
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        username,
                        avatar_url,
                        rank
                    )
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCards((data as FreeAgentCardWithProfile[]) || []);
        } catch {
            toast.error("Ошибка загрузки карточек");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!window.confirm("Вы уверены? Это действие необратимо.")) return;

        try {
            const { error } = await supabase
                .from("free_agent_cards")
                .delete()
                .eq("id", cardId);

            if (error) throw error;

            toast.success("Карточка удалена");
            fetchCards();
        } catch {
            toast.error("Ошибка удаления карточки");
        }
    };

    const handleToggleActive = async (card: FreeAgentCardWithProfile) => {
        try {
            const { error } = await supabase
                .from("free_agent_cards")
                .update({ is_active: !card.is_active })
                .eq("id", card.id);

            if (error) throw error;

            toast.success(card.is_active ? "Карточка скрыта" : "Карточка активирована");
            fetchCards();
        } catch {
            toast.error("Ошибка изменения статуса");
        }
    };

    const filteredCards = cards.filter((card) =>
        card.profiles?.username?.toLowerCase().includes(search.toLowerCase())
    );

    const roleNames: Record<string, string> = {
        duelist: "Дуэлянт",
        initiator: "Инициатор",
        controller: "Специалист",
        sentinel: "Страж",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Свободные агенты</h1>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск по никнейму..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Игрок</TableHead>
                            <TableHead>Роли</TableHead>
                            <TableHead>Intro</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : filteredCards.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    Карточки не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCards.map((card) => (
                                <TableRow key={card.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={card.profiles?.avatar_url || ""} />
                                                <AvatarFallback>
                                                    {card.profiles?.username?.slice(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{card.profiles?.username}</div>
                                                {card.profiles?.rank && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {card.profiles.rank}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {card.preferred_roles?.slice(0, 2).map((role) => (
                                                <Badge key={role} variant="secondary" className="text-xs">
                                                    {roleNames[role] || role}
                                                </Badge>
                                            ))}
                                            {card.preferred_roles?.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{card.preferred_roles.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {card.intro}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={card.is_active ? "default" : "secondary"}>
                                            {card.is_active ? "Активна" : "Скрыта"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(card.created_at).toLocaleDateString("ru-RU")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Управление</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => navigate(`/profile/${card.profiles?.username}`)}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Профиль
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleActive(card)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    {card.is_active ? "Скрыть" : "Активировать"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => navigator.clipboard.writeText(card.id)}
                                                >
                                                    Копировать ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteCard(card.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Удалить
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminFreeAgents;
