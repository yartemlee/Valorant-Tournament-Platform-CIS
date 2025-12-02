import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, Trash, Edit, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Tournament } from "@/types/common.types";
import { EditTournamentDialog } from "@/components/admin/EditTournamentDialog";

const AdminTournaments = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("tournaments")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTournaments(data || []);
        } catch (error) {
            console.error("Error fetching tournaments:", error);
            toast.error("Ошибка загрузки турниров");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTournament = (tournament: Tournament) => {
        setEditingTournament(tournament);
        setEditDialogOpen(true);
    };

    const handleDeleteTournament = async (tournamentId: string) => {
        if (!window.confirm("Вы уверены? Это действие необратимо.")) return;

        try {
            const { error } = await supabase
                .from("tournaments")
                .delete()
                .eq("id", tournamentId);

            if (error) throw error;

            toast.success("Турнир удален");
            fetchTournaments();
        } catch (error) {
            console.error("Error deleting tournament:", error);
            toast.error("Ошибка удаления турнира");
        }
    };

    const filteredTournaments = tournaments.filter((tournament) =>
        tournament.title.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors = {
        draft: "bg-muted text-muted-foreground",
        registration: "bg-blue-500 text-white",
        active: "bg-green-500 text-white",
        completed: "bg-gray-500 text-white",
        cancelled: "bg-red-500 text-white",
    };

    const statusLabels = {
        draft: "Черновик",
        registration: "Регистрация",
        active: "Активный",
        completed: "Завершен",
        cancelled: "Отменен",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Турниры</h1>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Поиск..."
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
                            <TableHead>Турнир</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead>Дата начала</TableHead>
                            <TableHead>Макс. команд</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : filteredTournaments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Турниры не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTournaments.map((tournament) => (
                                <TableRow key={tournament.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            to={`/tournaments/${tournament.id}`}
                                            className="hover:underline flex items-center gap-2"
                                        >
                                            {tournament.title}
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[tournament.status]}>
                                            {statusLabels[tournament.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {tournament.start_time
                                            ? new Date(tournament.start_time).toLocaleDateString("ru-RU", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "-"}
                                    </TableCell>
                                    <TableCell>{tournament.max_teams || "-"}</TableCell>
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
                                                <DropdownMenuItem onClick={() => handleEditTournament(tournament)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Редактировать
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(tournament.id)}>
                                                    Копировать ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteTournament(tournament.id)}
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

            <EditTournamentDialog
                tournament={editingTournament}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={fetchTournaments}
            />
        </div>
    );
};

export default AdminTournaments;
