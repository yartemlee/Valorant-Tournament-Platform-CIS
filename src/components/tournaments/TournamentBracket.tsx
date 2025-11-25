import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
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
      .from("tournament_matches" as any)
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
      ((data as any[]) || []).map(async (match) => {
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
      await supabase.from("tournament_matches" as any).delete().eq("tournament_id", tournamentId);

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
        .update({ bracket_generated: true } as any)
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

    // First round
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
          best_of: isFinal ? 5 : (round === numRounds - 1 ? 3 : 1),
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

    await supabase.from("tournament_matches" as any).insert(matchesToCreate);
  };

  const generateDoubleElimination = async (participantIds: string[], numRounds: number) => {
    const matchesToCreate = [];
    const firstRoundMatches = Math.pow(2, numRounds - 1);

    // Upper bracket - first round
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

    await supabase.from("tournament_matches" as any).insert(matchesToCreate);
  };

  const shuffleParticipants = async () => {
    if (!isOwner) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const firstRoundMatches = matches.filter((m) => m.round_number === 1 && m.bracket_type === "upper");

    for (let i = 0; i < firstRoundMatches.length; i++) {
      await supabase
        .from("tournament_matches" as any)
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

  // Group matches
  const upperMatches = matches.filter((m) => m.bracket_type === "upper" || m.bracket_type === "final");
  const lowerMatches = matches.filter((m) => m.bracket_type === "lower");
  const grandFinalMatch = matches.find((m) => m.bracket_type === "grand_final");
  const thirdPlaceMatch = matches.find((m) => m.bracket_type === "third_place");

  const upperRounds = Array.from(new Set(upperMatches.map((m) => m.round_number))).sort((a, b) => a - b);
  const lowerRounds = Array.from(new Set(lowerMatches.map((m) => m.round_number))).sort((a, b) => a - b);

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Финал";
    if (round === totalRounds - 1) return "Полуфинал";
    return `Раунд ${round}`;
  };

  // Custom Bracket Rendering
  const renderBracketSection = (rounds: number[], matchesList: Match[], title: string) => (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-8 min-w-max px-4">
          {rounds.map((round, roundIndex) => {
            const roundMatches = matchesList
              .filter((m) => m.round_number === round)
              .sort((a, b) => a.match_number - b.match_number);

            return (
              <div key={round} className="flex flex-col min-w-[280px]">
                <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
                  {getRoundLabel(round, rounds[rounds.length - 1])}
                </h3>
                <div className="flex flex-col justify-around flex-grow gap-8 relative">
                  {roundMatches.map((match, index) => (
                    <div key={match.id} className="relative flex items-center">
                      {/* Connector Line to previous round (if not first round) */}
                      {roundIndex > 0 && (
                        <div className="absolute -left-4 w-4 h-px bg-border" />
                      )}

                      <div className="w-full z-10">
                        <MatchCard
                          match={match}
                          isOwner={isOwner}
                          onEdit={() => handleEditMatch(match)}
                        />
                      </div>

                      {/* Connector Line to next round */}
                      {roundIndex < rounds.length - 1 && (
                        <div className={`absolute -right-4 w-4 h-px bg-border ${
                          // Logic to draw vertical lines for bracket tree structure
                          // This is a simplified visual connector. 
                          // For perfect trees, we'd need SVG or complex pseudo-elements based on match index.
                          // For now, simple horizontal connectors are better than "crooked" layout.
                          ""
                          }`} />
                      )}

                      {/* Vertical Bracket Lines (Simplified approach) */}
                      {roundIndex < rounds.length - 1 && index % 2 === 0 && (
                        <div
                          className="absolute -right-4 w-px bg-border"
                          style={{
                            top: '50%',
                            height: 'calc(100% + 2rem)', // Approximate height to next sibling
                            // This is tricky without knowing exact pixel distance. 
                            // Flexbox 'justify-around' makes pixel math hard.
                            // Better to stick to simple horizontal connectors for MVP stability 
                            // or use a library if perfect lines are needed (which we just removed).
                            // Let's hide vertical lines for now to ensure cleanness.
                            display: 'none'
                          }}
                        />
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
  );

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

      {renderBracketSection(upperRounds, upperMatches, bracketFormat === "double_elimination" ? "Верхняя сетка" : "Турнирная сетка")}

      {bracketFormat === "double_elimination" && lowerMatches.length > 0 &&
        renderBracketSection(lowerRounds, lowerMatches, "Нижняя сетка")
      }

      {/* Finals Section */}
      {(grandFinalMatch || thirdPlaceMatch) && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold mb-6 text-center">Финалы</h2>
          <div className="flex flex-wrap justify-center gap-12">
            {grandFinalMatch && (
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">Гранд-финал</h3>
                <MatchCard
                  match={grandFinalMatch}
                  isOwner={isOwner}
                  onEdit={() => handleEditMatch(grandFinalMatch)}
                />
              </div>
            )}
            {thirdPlaceMatch && (
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">Матч за 3-е место</h3>
                <MatchCard
                  match={thirdPlaceMatch}
                  isOwner={isOwner}
                  onEdit={() => handleEditMatch(thirdPlaceMatch)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <MatchEditDialog
        match={selectedMatch}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchMatches}
      />
    </div>
  );
}
