import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { CreateTournamentDialog } from "@/components/tournaments/CreateTournamentDialog";
import { Trophy, Plus, Filter } from "lucide-react";
import { toast } from "sonner";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  format: string;
  start_time: string;
  prize_pool: string | null;
  status: string;
  banner_url: string | null;
  max_teams: number | null;
  organizer_id: string;
}

const Tournaments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    // Open create dialog if specified in URL
    if (searchParams.get("create") === "true") {
      setCreateDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTournaments();
  }, [statusFilter, formatFilter]);

  const fetchTournaments = async () => {
    setLoading(true);
    let query = supabase
      .from("tournaments")
      .select("*")
      .order("start_time", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    if (formatFilter !== "all") {
      query = query.eq("format", formatFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Ошибка загрузки турниров");
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  const filteredTournaments = tournaments.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMyTournaments = () => {
    if (!user) {
      toast.error("Войдите, чтобы увидеть свои турниры");
      navigate("/login");
      return;
    }
    setStatusFilter("all");
    setFormatFilter("all");
    setTournaments((prev) => prev.filter((t) => t.organizer_id === user.id));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Турниры</h1>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleMyTournaments}>
                  Мои турниры
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать турнир
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Фильтры</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="draft">Черновик</SelectItem>
                    <SelectItem value="registration">Регистрация</SelectItem>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="completed">Завершён</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Формат" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все форматы</SelectItem>
                    <SelectItem value="single_elimination">Single Elimination</SelectItem>
                    <SelectItem value="double_elimination">Double Elimination</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("all");
                    setFormatFilter("all");
                    setSearchQuery("");
                    fetchTournaments();
                  }}
                >
                  Сбросить
                </Button>
              </div>
            </div>

            {/* Tournament Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка турниров...</p>
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Пока турниров нет</h3>
                <p className="text-muted-foreground mb-6">
                  Создайте свой турнир или загляните позже
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать турнир
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <CreateTournamentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchTournaments();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
};

export default Tournaments;
