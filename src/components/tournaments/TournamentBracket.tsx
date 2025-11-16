import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shuffle, Zap } from "lucide-react";
import { toast } from "sonner";
import { MatchCard } from "./MatchCard";
import { MatchEditDialog } from "./MatchEditDialog";

interface Match {
  id: string;
  round_number: number;
  match_number: number;
  bracket_type: string;
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  loser_id: string | null;
  status: string;
  best_of: number;
  team1?: { name: string; tag: string; logo_url: string | null };
  team2?: { name: string; tag: string; logo_url: string | null };
}

interface TournamentBracketProps {
  tournamentId: string;
  isOwner: boolean;
  bracketFormat: string;
  participants: any[];
}

export function TournamentBracket({ tournamentId, isOwner, bracketFormat, participants }: TournamentBracketProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round_number")
      .order("match_number");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Fetch team info
    const matchesWithTeams = await Promise.all(
      (data || []).map(async (match) => {
        const team1 = match.team1_id ? await getTeamInfo(match.team1_id) : null;
        const team2 = match.team2_id ? await getTeamInfo(match.team2_id) : null;
        return { ...match, team1, team2 };
      })
    );

    setMatches(matchesWithTeams);
    setLoading(false);
  };

  const getTeamInfo = async (teamId: string) => {
    const { data } = await supabase
      .from("teams")
      .select("name, tag, logo_url")
      .eq("id", teamId)
      .single();
    return data;
  };

  const generateBracket = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      // Delete existing matches
      await supabase.from("tournament_matches").delete().eq("tournament_id", tournamentId);

      const participantIds = participants.map((p) => p.user_id);
      const numRounds = Math.ceil(Math.log2(participantIds.length));

      if (bracketFormat === "single_elimination") {
        await generateSingleElimination(participantIds, numRounds);
      } else {
        await generateDoubleElimination(participantIds, numRounds);
      }

      // Mark bracket as generated
      await supabase
        .from("tournaments")
        .update({ bracket_generated: true })
        .eq("id", tournamentId);

      toast.success("Сетка создана");
      fetchMatches();
    } catch (error) {
      toast.error("Ошибка создания сетки");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateSingleElimination = async (participantIds: string[], numRounds: number) => {
    const matchesToCreate = [];
    const firstRoundMatches = Math.pow(2, numRounds - 1);

    // First round - используем team_id из участников
    for (let i = 0; i < firstRoundMatches; i++) {
      const participant1 = participants[i * 2];
      const participant2 = participants[i * 2 + 1];
      
      matchesToCreate.push({
        tournament_id: tournamentId,
        round_number: 1,
        match_number: i + 1,
        bracket_type: "upper",
        team1_id: participant1?.team_id || null,
        team2_id: participant2?.team_id || null,
        status: "pending",
        best_of: 1, // Default BO1 for first round
      });
    }

    // Subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        const isFinal = round === numRounds;
        matchesToCreate.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: i + 1,
          bracket_type: isFinal ? "final" : "upper",
          team1_id: null,
          team2_id: null,
          status: "pending",
          best_of: isFinal ? 5 : (round === numRounds - 1 ? 3 : 1), // BO5 for finals, BO3 for semis
        });
      }
    }

    // Third place match
    matchesToCreate.push({
      tournament_id: tournamentId,
      round_number: numRounds,
      match_number: 999,
      bracket_type: "third_place",
      team1_id: null,
      team2_id: null,
      status: "pending",
      best_of: 3,
    });

    await supabase.from("tournament_matches").insert(matchesToCreate);
  };

  const generateDoubleElimination = async (participantIds: string[], numRounds: number) => {
    const matchesToCreate = [];
    const firstRoundMatches = Math.pow(2, numRounds - 1);

    // Upper bracket - first round - используем team_id из участников
    for (let i = 0; i < firstRoundMatches; i++) {
      const participant1 = participants[i * 2];
      const participant2 = participants[i * 2 + 1];
      
      matchesToCreate.push({
        tournament_id: tournamentId,
        round_number: 1,
        match_number: i + 1,
        bracket_type: "upper",
        team1_id: participant1?.team_id || null,
        team2_id: participant2?.team_id || null,
        status: "pending",
        best_of: 1,
      });
    }

    // Upper bracket - subsequent rounds
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        matchesToCreate.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: i + 1,
          bracket_type: "upper",
          team1_id: null,
          team2_id: null,
          status: "pending",
          best_of: round === numRounds ? 3 : 1,
        });
      }
    }

    // Lower bracket
    const lowerRounds = numRounds * 2 - 2;
    for (let round = 1; round <= lowerRounds; round++) {
      const matchesInRound = Math.ceil(firstRoundMatches / Math.pow(2, Math.floor((round + 1) / 2)));
      for (let i = 0; i < matchesInRound; i++) {
        matchesToCreate.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: i + 1,
          bracket_type: "lower",
          team1_id: null,
          team2_id: null,
          status: "pending",
          best_of: round === lowerRounds ? 3 : 1,
        });
      }
    }

    // Grand final
    matchesToCreate.push({
      tournament_id: tournamentId,
      round_number: numRounds + 1,
      match_number: 1,
      bracket_type: "grand_final",
      team1_id: null,
      team2_id: null,
      status: "pending",
      best_of: 5,
    });

    await supabase.from("tournament_matches").insert(matchesToCreate);
  };

  const shuffleParticipants = async () => {
    if (!isOwner) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const firstRoundMatches = matches.filter((m) => m.round_number === 1 && m.bracket_type === "upper");

    for (let i = 0; i < firstRoundMatches.length; i++) {
      await supabase
        .from("tournament_matches")
        .update({
          team1_id: shuffled[i * 2]?.team_id || null,
          team2_id: shuffled[i * 2 + 1]?.team_id || null,
        })
        .eq("id", firstRoundMatches[i].id);
    }

    toast.success("Команды расставлены случайно");
    fetchMatches();
  };

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setEditDialogOpen(true);
  };

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка сетки...</p>;
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">Сетка ещё не создана</p>
        {isOwner && (
          <Button onClick={generateBracket}>
            Создать сетку
          </Button>
        )}
      </div>
    );
  }

  // Разделить матчи по типу сетки
  const upperMatches = matches.filter((m) => m.bracket_type === "upper" || m.bracket_type === "final");
  const lowerMatches = matches.filter((m) => m.bracket_type === "lower");
  const grandFinalMatch = matches.find((m) => m.bracket_type === "grand_final");
  const thirdPlaceMatch = matches.find((m) => m.bracket_type === "third_place");

  const upperRounds = Array.from(new Set(upperMatches.map((m) => m.round_number))).sort();
  const lowerRounds = Array.from(new Set(lowerMatches.map((m) => m.round_number))).sort();

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Финал";
    if (round === totalRounds - 1) return "Полуфинал";
    return `Раунд ${round}`;
  };

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex gap-3">
          <Button onClick={shuffleParticipants} variant="outline">
            <Shuffle className="h-4 w-4 mr-2" />
            Расставить команды случайно
          </Button>
          <Button onClick={generateBracket} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Пересоздать сетку
          </Button>
        </div>
      )}

      <div className="space-y-8">
        {/* Верхняя сетка */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            {bracketFormat === "double_elimination" ? "Верхняя сетка" : "Турнирная сетка"}
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-12 items-start relative min-h-[400px]">
              {upperRounds.map((round, roundIndex) => {
                const roundMatches = upperMatches.filter((m) => m.round_number === round);
                const spacing = Math.pow(2, roundIndex) * 80; // Увеличиваем расстояние между матчами
                
                return (
                  <div key={`upper-${round}`} className="relative flex flex-col justify-around" style={{ minHeight: `${roundMatches.length * spacing}px` }}>
                    <h3 className="font-semibold text-center text-sm mb-4 text-muted-foreground">
                      {getRoundLabel(round, upperRounds[upperRounds.length - 1])}
                    </h3>
                    <div className="flex flex-col justify-around h-full gap-4" style={{ gap: `${spacing - 120}px` }}>
                      {roundMatches.map((match, matchIndex) => (
                        <div key={match.id} className="relative" style={{ marginTop: matchIndex === 0 ? 0 : undefined }}>
                          <MatchCard
                            match={match}
                            isOwner={isOwner}
                            onEdit={() => handleEditMatch(match)}
                          />
                          {/* Линия к следующему раунду */}
                          {roundIndex < upperRounds.length - 1 && (
                            <div className="absolute left-full top-1/2 w-12 h-px bg-border" style={{ transform: 'translateY(-50%)' }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Нижняя сетка (только для Double Elimination) */}
        {bracketFormat === "double_elimination" && lowerMatches.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold mb-6">Нижняя сетка</h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-12 items-start relative min-h-[400px]">
                {lowerRounds.map((round, roundIndex) => {
                  const roundMatches = lowerMatches.filter((m) => m.round_number === round);
                  const spacing = Math.pow(2, roundIndex) * 80;
                  
                  return (
                    <div key={`lower-${round}`} className="relative flex flex-col justify-around" style={{ minHeight: `${roundMatches.length * spacing}px` }}>
                      <h3 className="font-semibold text-center text-sm mb-4 text-muted-foreground">
                        LB Раунд {round}
                      </h3>
                      <div className="flex flex-col justify-around h-full gap-4" style={{ gap: `${spacing - 120}px` }}>
                        {roundMatches.map((match, matchIndex) => (
                          <div key={match.id} className="relative" style={{ marginTop: matchIndex === 0 ? 0 : undefined }}>
                            <MatchCard
                              match={match}
                              isOwner={isOwner}
                              onEdit={() => handleEditMatch(match)}
                            />
                            {roundIndex < lowerRounds.length - 1 && (
                              <div className="absolute left-full top-1/2 w-12 h-px bg-border" style={{ transform: 'translateY(-50%)' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Гранд-финал (только для Double Elimination) */}
        {grandFinalMatch && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold mb-6 text-center">Гранд-финал</h2>
            <div className="flex justify-center">
              <MatchCard
                match={grandFinalMatch}
                isOwner={isOwner}
                onEdit={() => handleEditMatch(grandFinalMatch)}
              />
            </div>
          </div>
        )}

        {/* Матч за 3-е место */}
        {thirdPlaceMatch && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold mb-6 text-center">Матч за 3-е место</h2>
            <div className="flex justify-center">
              <MatchCard
                match={thirdPlaceMatch}
                isOwner={isOwner}
                onEdit={() => handleEditMatch(thirdPlaceMatch)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Диалог редактирования матча */}
      <MatchEditDialog
        match={selectedMatch}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchMatches}
      />
    </div>
  );
}
