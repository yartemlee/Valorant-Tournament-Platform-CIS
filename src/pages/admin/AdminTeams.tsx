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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import { Team } from "@/types/common.types";
import { EditTeamDialog } from "@/components/admin/EditTeamDialog";

const AdminTeams = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("teams")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setTeams(data || []);
        } catch (error) {
            console.error("Error fetching teams:", error);
            toast.error("Ошибка загрузки команд");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setEditDialogOpen(true);
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!window.confirm("Вы уверены? Это действие необратимо.")) return;

        try {
            const { error } = await supabase
                .from("teams")
                .delete()
                .eq("id", teamId);

            if (error) throw error;

            toast.success("Команда удалена");
            fetchTeams();
        } catch (error) {
            console.error("Error deleting team:", error);
            toast.error("Ошибка удаления команды");
        }
    };

    const filteredTeams = teams.filter(
        (team) =>
            team.name.toLowerCase().includes(search.toLowerCase()) ||
            team.tag.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Команды</h1>
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
                            <TableHead>Команда</TableHead>
                            <TableHead>Тег</TableHead>
                            <TableHead>Описание</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    Загрузка...
                                </TableCell>
                            </TableRow>
                        ) : filteredTeams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    Команды не найдены
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTeams.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={team.logo_url || ""} />
                                            <AvatarFallback>{team.tag}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{team.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-sm">{team.tag}</span>
                                    </TableCell>
                                    <TableCell className="max-w-md truncate">
                                        {team.description || "-"}
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
                                                <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Редактировать
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(team.id)}>
                                                    Копировать ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleDeleteTeam(team.id)}
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

            <EditTeamDialog
                team={editingTeam}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onSuccess={fetchTeams}
            />
        </div>
    );
};

export default AdminTeams;
