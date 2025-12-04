import { Profile, Tournament, Match, ParticipantWithTeam } from '@/types/common.types';
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
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
import { RosterSelectionDialog } from "@/components/tournaments/RosterSelectionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";



import { User } from "@supabase/supabase-js";

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithTeam[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [isTeamLeader, setIsTeamLeader] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
  });


  useEffect(() => {
    checkAuth();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Real-time subscription for tournament registrations
  useEffect(() => {
    if (!id) return;

    // Subscribe to changes in tournament_registrations
    const channel = supabase
      .channel(`tournament_${id}_registrations`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          // Refetch participants when any change occurs
          refetchParticipants();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Auto-join after data is loaded
  useEffect(() => {
    if (!loading && tournament && searchParams.get("action") === "join") {
      handleJoin();
      // Clear the action parameter after handling
      navigate(`/tournaments/${id}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tournament, searchParams]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Separate function to refetch participants for real-time updates
  const refetchParticipants = async () => {
    if (!id) return;

    // Fetch participants (registrations)
    const { data: participantsData } = await supabase
      .from("tournament_registrations")
      .select("id, team_id, registered_at, status")
      .eq("tournament_id", id)
      .in("status", ["pending", "approved"]);

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
            id: p.id,
            user_id: "", // Not used for team registrations
            team_id: p.team_id,
            joined_at: p.registered_at,
            team: team || null,
          };
        })
      );
      setParticipants(participantsWithTeams);

      // Check if current user's team is participant
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: anyTeamMember } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (anyTeamMember?.team_id) {
          const isJoined = participantsData?.some((p) => p.team_id === anyTeamMember.team_id);
          setIsParticipant(!!isJoined);
        }
      }
    }
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

    // Fetch participants using the new function
    await refetchParticipants();

    // Check if current user is team leader
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if user is captain or coach
      const { data: leaderRole } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .in("role", ["captain", "coach"])
        .maybeSingle();

      setIsTeamLeader(!!leaderRole);
    }

    setLoading(false);
  };

  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const handleJoin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Войдите, чтобы участвовать");
      navigate("/login");
      return;
    }

    // Check if user is captain or coach of any team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role, team_id")
      .eq("user_id", user.id)
      .in("role", ["captain", "coach"])
      .single();

    if (!teamMember) {
      toast.error("Зарегистрировать команду может только капитан или тренер");
      return;
    }

    // Check team size
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamMember.team_id);

    if (!teamMembers || teamMembers.length < 5) {
      toast.error("В команде должно быть минимум 5 игроков для участия в турнире");
      return;
    }

    // Check Riot IDs for all team members
    const { data: teamProfiles } = await supabase
      .from("team_members")
      .select("user_id, profiles:user_id(riot_id)")
      .eq("team_id", teamMember.team_id);

    const allHaveRiotId = teamProfiles?.every((m) => {
      const prof = m.profiles;
      if (!prof) return false;

      // Check if riot_id is present (assuming it contains Name#Tag)
      return !!prof.riot_id;
    });

    if (!allHaveRiotId) {
      toast.error("Все участники команды должны привязать Riot ID");
      return;
    }

    if (tournament?.status !== "registration") {
      toast.error("Регистрация закрыта");
      return;
    }

    // Проверка на максимальное количество команд
    if (tournament.max_teams && participants.length >= tournament.max_teams) {
      toast.error("Турнир заполнен", {
        description: `Максимальное количество команд: ${tournament.max_teams}`
      });
      return;
    }

    // Open roster selection dialog instead of direct registration
    setPendingTeamId(teamMember.team_id);
    setRosterDialogOpen(true);
  };

  const handleRosterConfirm = async (selectedUserIds: string[]) => {
    if (!pendingTeamId) return;

    const { error } = await supabase.from("tournament_registrations").insert([
      {
        tournament_id: id,
        team_id: pendingTeamId,
        status: "pending",
        selected_roster: selectedUserIds,
      } as any, // Cast to any because selected_roster might not be in types yet
    ]);

    if (error) {
      console.error(error);
      toast.error("Ошибка регистрации");
      return;
    }

    toast.success("Команда зарегистрирована на турнир");
    setRosterDialogOpen(false);
    setPendingTeamId(null);
    fetchData();
  };

  const handleStartTournament = async () => {
    if (!isOwner) return;

    try {
      await supabase
        .from("tournaments")
        .update({
          status: "active"
        })
        .eq("id", id);

      toast.success("Турнир начался!");
      setStartDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Ошибка начала турнира");
    }
  };

  const handleLeave = async () => {
    if (!user) return;

    // Get user's team
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .in("role", ["captain", "coach"])
      .single();

    if (!teamMember) {
      toast.error("Команда не найдена");
      return;
    }

    const { error } = await supabase
      .from("tournament_registrations")
      .delete()
      .eq("tournament_id", id)
      .eq("team_id", teamMember.team_id);

    if (error) {
      toast.error("Ошибка выхода из турнира");
      return;
    }

    toast.success("Команда снята с турнира");
    // Realtime subscription will automatically update the participants list
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



  const isOwner = user?.id === tournament.organizer_id || isAdmin;

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    registration: "bg-accent text-accent-foreground",
    active: "bg-primary text-primary-foreground",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };

  const statusLabels = {
    draft: "Черновик",
    registration: "Регистрация",
    active: "Активен",
    completed: "Завершён",
    cancelled: "Отменён",
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
                    alt={tournament.title}
                    className="w-full h-full object-cover opacity-30"
                  />
                </div>
              )}
              <div className="relative p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-10 w-10 text-primary" />
                    <h1 className="text-4xl font-bold">{tournament.title}</h1>
                  </div>
                  <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
                    {statusLabels[tournament.status as keyof typeof statusLabels]}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-6 mb-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{format(new Date(tournament.start_time), "d MMMM yyyy, HH:mm", { locale: ru })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{formatLabels[tournament.format as keyof typeof formatLabels]}</span>
                  </div>
                  {tournament.prize_pool && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      <span className="text-accent font-semibold">{tournament.prize_pool}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {tournament.status === "registration" && !isParticipant && isTeamLeader && (
                    <Button onClick={handleJoin}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Участвовать
                    </Button>
                  )}
                  {isParticipant && tournament.status === "registration" && isTeamLeader && (
                    <Button variant="outline" onClick={handleLeave}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти из турнира
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      {(tournament.status === "draft" || tournament.status === "registration") && (
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
                      {tournament.status === "active" && (
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
                      onUpdate={refetchParticipants}
                      currentTeamsCount={participants.length}
                      maxTeams={tournament.max_teams}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="description">Описание</TabsTrigger>
                <TabsTrigger value="participants">
                  Команды ({participants.length}/{tournament.max_teams || 0})
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
                                      .from("tournament_registrations")
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
                    {tournament.status === "active" || tournament.status === "completed" || isOwner ? (
                      <TournamentBracket
                        tournamentId={tournament.id}
                        isOwner={isOwner}
                        isAdmin={!!isAdmin}
                        bracketFormat={tournament.format}
                        participants={participants}
                        tournamentStatus={tournament.status}
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

      <RosterSelectionDialog
        open={rosterDialogOpen}
        onOpenChange={setRosterDialogOpen}
        teamId={pendingTeamId || ""}
        onConfirm={handleRosterConfirm}
      />
    </div>
  );
};

export default TournamentDetails;



