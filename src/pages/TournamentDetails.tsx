import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar, Users, Edit, LogOut, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { CompleteTournamentDialog } from "@/components/tournaments/CompleteTournamentDialog";
import { EditTournamentDialog } from "@/components/tournaments/EditTournamentDialog";
import { TournamentBracket } from "@/components/tournaments/TournamentBracket";
import { PhantomDataControls } from "@/components/tournaments/PhantomDataControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  bracket_format: string;
  date_start: string;
  prize: string | null;
  status: string;
  registration_open: boolean;
  banner_url: string | null;
  participant_limit: number;
  rules: string | null;
  owner_id: string;
  started_at: string | null;
  bracket_generated: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  team_id: string | null;
  joined_at: string;
  team: {
    name: string;
    tag: string;
    logo_url: string | null;
  } | null;
}

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
    checkAuth();

    // Auto-join if action=join
    if (searchParams.get("action") === "join") {
      handleJoin();
    }
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch tournament
    const { data: tournamentData, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (tournamentError || !tournamentData) {
      toast.error("Турнир не найден");
      navigate("/tournaments");
      return;
    }

    setTournament(tournamentData);

    // Fetch participants
    const { data: participantsData } = await supabase
      .from("tournament_participants")
      .select("id, user_id, team_id, joined_at")
      .eq("tournament_id", id);

    if (participantsData) {
      const participantsWithTeams = await Promise.all(
        participantsData.map(async (p) => {
          // team_id contains team UUID
          const { data: team } = await supabase
            .from("teams")
            .select("name, tag, logo_url")
            .eq("id", p.team_id)
            .maybeSingle();

          return {
            ...p,
            team: team || null,
          };
        })
      );
      setParticipants(participantsWithTeams);
    }

    // Check if current user is participant
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const isJoined = participantsData?.some((p) => p.user_id === user.id);
      setIsParticipant(!!isJoined);
    }

    setLoading(false);
  };

  const handleJoin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Войдите, чтобы участвовать");
      navigate("/login");
      return;
    }

    // Check if user is a captain
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_team_id")
      .eq("id", user.id)
      .single();

    if (!profile?.current_team_id) {
      toast.error("Зарегистрировать команду может только капитан");
      return;
    }

    // Check if user is captain or coach of their team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_role, team_id")
      .eq("user_id", user.id)
      .eq("team_id", profile.current_team_id)
      .single();

    if (!teamMember || !["captain", "coach"].includes(teamMember.team_role)) {
      toast.error("Зарегистрировать команду может только капитан или тренер");
      return;
    }

    // Check team size
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", profile.current_team_id);

    if (!teamMembers || teamMembers.length < 5) {
      toast.error("В команде должно быть минимум 5 игроков для участия в турнире");
      return;
    }

    // Check Riot IDs for all team members
    const { data: teamProfiles } = await supabase
      .from("team_members")
      .select("user_id, profiles:user_id(riot_linked, riot_id, riot_tag, is_phantom)")
      .eq("team_id", profile.current_team_id);

    const allHaveRiotId = teamProfiles?.every((m: any) => {
      const prof = m.profiles;
      if (!prof) return false;
      
      // Для фантомных игроков проверяем наличие riot_id и riot_tag
      if (prof.is_phantom) {
        return !!(prof.riot_id && prof.riot_tag);
      }
      
      // Для реальных игроков проверяем riot_linked
      return prof.riot_linked === true;
    });

    if (!allHaveRiotId) {
      toast.error("Все участники команды должны привязать Riot ID");
      return;
    }

    if (!tournament?.registration_open) {
      toast.error("Регистрация закрыта");
      return;
    }

    const { error } = await supabase.from("tournament_participants").insert([
      {
        tournament_id: id,
        user_id: user.id,
        team_id: teamMember.team_id,
        status: "registered",
      },
    ]);

    if (error) {
      toast.error("Ошибка регистрации");
      return;
    }

    toast.success("Команда зарегистрирована на турнир");
    fetchData();
  };

  const handleStartTournament = async () => {
    if (!isOwner) return;

    try {
      await supabase
        .from("tournaments")
        .update({ 
          started_at: new Date().toISOString(),
          status: "ongoing" 
        })
        .eq("id", id);

      // Send notifications to all participants
      const notificationTypes = ["30min", "15min", "5min", "started"];
      const notifications = participants.flatMap((p) =>
        notificationTypes.map((type) => ({
          tournament_id: id,
          user_id: p.user_id,
          notification_type: type,
          sent_at: type === "started" ? new Date().toISOString() : null,
        }))
      );

      await supabase.from("tournament_notifications").insert(notifications);

      toast.success("Турнир начался! Уведомления отправлены участникам");
      setStartDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Ошибка начала турнира");
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("tournament_participants")
      .delete()
      .eq("tournament_id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Ошибка выхода из турнира");
      return;
    }

    toast.success("Вы вышли из турнира");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!tournament) return null;

  const isOwner = user?.id === tournament.owner_id;

  const statusColors = {
    open: "bg-accent text-accent-foreground",
    ongoing: "bg-primary text-primary-foreground",
    completed: "bg-muted text-muted-foreground",
  };

  const statusLabels = {
    open: "Открыт",
    ongoing: "В процессе",
    completed: "Завершён",
  };

  const formatLabels = {
    single_elimination: "Single Elimination",
    double_elimination: "Double Elimination",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="relative mb-8 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-border">
              {tournament.banner_url && (
                <div className="absolute inset-0">
                  <img
                    src={tournament.banner_url}
                    alt={tournament.name}
                    className="w-full h-full object-cover opacity-30"
                  />
                </div>
              )}
              <div className="relative p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-bold">{tournament.name}</h1>
                  </div>
                  <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
                    {statusLabels[tournament.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-6 mb-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{format(new Date(tournament.date_start), "d MMMM yyyy, HH:mm", { locale: ru })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{formatLabels[tournament.bracket_format as keyof typeof formatLabels]}</span>
                  </div>
                  {tournament.prize && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      <span className="text-accent font-semibold">{tournament.prize}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {tournament.status === "open" && tournament.registration_open && !isParticipant && (
                    <Button onClick={handleJoin}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Участвовать
                    </Button>
                  )}
                  {isParticipant && tournament.status === "open" && (
                    <Button variant="outline" onClick={handleLeave}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти из турнира
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      {!tournament.started_at && (
                        <>
                          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </Button>
                          <Button onClick={() => setStartDialogOpen(true)}>
                            Начать турнир
                          </Button>
                        </>
                      )}
                      {tournament.started_at && tournament.status !== "completed" && (
                        <Button onClick={() => setCompleteDialogOpen(true)}>
                          Завершить турнир
                        </Button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Phantom Data Controls for Organizer */}
                {isOwner && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Инструменты для тестирования сетки
                    </p>
                    <PhantomDataControls 
                      tournamentId={id!} 
                      onUpdate={fetchData}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="space-y-6">
              <TabsList>
                <TabsTrigger value="description">Описание</TabsTrigger>
                <TabsTrigger value="participants">
                  Команды ({participants.length}/{tournament.participant_limit})
                </TabsTrigger>
                <TabsTrigger value="bracket">Сетка</TabsTrigger>
              </TabsList>

              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle>О турнире</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tournament.description && <p className="text-muted-foreground">{tournament.description}</p>}
                    {tournament.rules && (
                      <div>
                        <h3 className="font-semibold mb-2">Правила</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{tournament.rules}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants">
                <Card>
                  <CardHeader>
                    <CardTitle>Список команд</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {participants.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Пока нет зарегистрированных команд</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                {participant.team?.logo_url ? (
                                  <img
                                    src={participant.team.logo_url}
                                    alt={participant.team.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{participant.team?.name || "Unknown"}</p>
                                {participant.team?.tag && (
                                  <p className="text-xs text-muted-foreground truncate">{participant.team.tag}</p>
                                )}
                              </div>
                            </div>
                            {isOwner && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                onClick={async () => {
                                  if (window.confirm(`Удалить команду ${participant.team?.name || "Unknown"} из турнира?`)) {
                                    const { error } = await supabase
                                      .from("tournament_participants")
                                      .delete()
                                      .eq("id", participant.id);

                                    if (error) {
                                      toast.error("Ошибка удаления");
                                      return;
                                    }

                                    toast.success("Команда удалена из турнира");
                                    fetchData();
                                  }
                                }}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bracket">
                <Card>
                  <CardHeader>
                    <CardTitle>Турнирная сетка</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tournament.started_at || isOwner ? (
                      <TournamentBracket
                        tournamentId={tournament.id}
                        isOwner={isOwner}
                        bracketFormat={tournament.bracket_format}
                        participants={participants}
                      />
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Сетка появится после начала турнира
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {isOwner && (
        <>
          <CompleteTournamentDialog
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            tournamentId={tournament.id}
            participants={participants}
            onSuccess={() => {
              fetchData();
              setCompleteDialogOpen(false);
            }}
          />
          <EditTournamentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            tournament={tournament}
            onSuccess={fetchData}
          />
          <AlertDialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Начать турнир?</AlertDialogTitle>
                <AlertDialogDescription>
                  После начала турнира редактирование будет недоступно. Всем участникам будут отправлены уведомления.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartTournament}>Начать турнир</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default TournamentDetails;
