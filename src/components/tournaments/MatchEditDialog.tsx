import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, CheckCircle, Edit3, Trophy } from "lucide-react";

interface MatchEditDialogProps {
  match: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MatchEditDialog({ match, open, onOpenChange, onSuccess }: MatchEditDialogProps) {
  const [bestOf, setBestOf] = useState(match?.best_of || 1);
  const [status, setStatus] = useState(match?.status || "pending");
  const [team1Score, setTeam1Score] = useState(match?.team1_score || 0);
  const [team2Score, setTeam2Score] = useState(match?.team2_score || 0);
  const [manualWinner, setManualWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setBestOf(match.best_of || 1);
      setStatus(match.status || "pending");
      setTeam1Score(match.team1_score || 0);
      setTeam2Score(match.team2_score || 0);
      setManualWinner(null);
    }
  }, [match]);

  const handleSave = async () => {
    if (!match) return;

    setLoading(true);
    try {
      // Определить победителя
      let winnerId = manualWinner;
      let loserId = null;

      if (!winnerId) {
        // Автоматическое определение по счету
        if (team1Score > team2Score) {
          winnerId = match.team1_id;
          loserId = match.team2_id;
        } else if (team2Score > team1Score) {
          winnerId = match.team2_id;
          loserId = match.team1_id;
        }
      } else {
        // Ручное определение
        loserId = winnerId === match.team1_id ? match.team2_id : match.team1_id;
      }

      const updates: any = {
        best_of: bestOf,
        status,
        team1_score: team1Score,
        team2_score: team2Score,
        winner_id: winnerId,
        loser_id: loserId,
      };

      const { error } = await supabase
        .from("tournament_matches")
        .update(updates)
        .eq("id", match.id);

      if (error) throw error;

      // Если матч завершен и есть победитель, продвинуть его в следующий раунд
      if (status === "completed" && winnerId) {
        await advanceWinner(match, winnerId, loserId);
      }

      toast.success("Матч обновлён");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating match:", error);
      toast.error("Ошибка обновления матча");
    } finally {
      setLoading(false);
    }
  };

  const advanceWinner = async (currentMatch: any, winnerId: string, loserId: string | null) => {
    try {
      // Получить информацию о турнире
      const { data: tournament } = await supabase
        .from("tournaments")
        .select("bracket_format")
        .eq("id", currentMatch.tournament_id)
        .single();

      if (!tournament) return;

      // Найти следующий матч в верхней сетке
      const nextRound = currentMatch.round_number + 1;
      const nextMatchNumber = Math.ceil(currentMatch.match_number / 2);

      const { data: nextMatches } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", currentMatch.tournament_id)
        .eq("round_number", nextRound)
        .eq("match_number", nextMatchNumber)
        .eq("bracket_type", currentMatch.bracket_type === "lower" ? "lower" : "upper");

      if (nextMatches && nextMatches.length > 0) {
        const nextMatch = nextMatches[0];
        const isTeam1Slot = currentMatch.match_number % 2 === 1;

        await supabase
          .from("tournament_matches")
          .update(isTeam1Slot ? { team1_id: winnerId } : { team2_id: winnerId })
          .eq("id", nextMatch.id);
      }

      // Для Double Elimination: проигравший идет в нижнюю сетку
      if (tournament.bracket_format === "double_elimination" && loserId && currentMatch.bracket_type === "upper") {
        // Найти соответствующий матч в нижней сетке
        const { data: lowerMatches } = await supabase
          .from("tournament_matches")
          .select("*")
          .eq("tournament_id", currentMatch.tournament_id)
          .eq("bracket_type", "lower")
          .order("round_number")
          .order("match_number");

        if (lowerMatches && lowerMatches.length > 0) {
          // Найти первый свободный слот в нижней сетке
          for (const lowerMatch of lowerMatches) {
            if (!lowerMatch.team1_id) {
              await supabase
                .from("tournament_matches")
                .update({ team1_id: loserId })
                .eq("id", lowerMatch.id);
              break;
            } else if (!lowerMatch.team2_id) {
              await supabase
                .from("tournament_matches")
                .update({ team2_id: loserId })
                .eq("id", lowerMatch.id);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error advancing winner:", error);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Не началась</Badge>;
      case "in_progress":
        return <Badge variant="secondary">В процессе</Badge>;
      case "completed":
        return <Badge>Завершена</Badge>;
      default:
        return null;
    }
  };

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Управление матчем
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Команды */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">{match.team1?.name || "TBD"}</span>
              <Input
                type="number"
                min="0"
                max="99"
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                className="w-16 text-center"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">{match.team2?.name || "TBD"}</span>
              <Input
                type="number"
                min="0"
                max="99"
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                className="w-16 text-center"
              />
            </div>
          </div>

          {/* Формат серии */}
          <div className="space-y-2">
            <Label>Формат серии</Label>
            <Select value={bestOf.toString()} onValueChange={(v) => setBestOf(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">BO1 (до 1 побед)</SelectItem>
                <SelectItem value="3">BO3 (до 2 побед)</SelectItem>
                <SelectItem value="5">BO5 (до 3 побед)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Статус */}
          <div className="space-y-2">
            <Label>Статус матча</Label>
            <div className="flex gap-2">
              <Button
                variant={status === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("pending")}
                className="flex-1"
              >
                Не началась
              </Button>
              <Button
                variant={status === "in_progress" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("in_progress")}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                В процессе
              </Button>
              <Button
                variant={status === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("completed")}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Завершена
              </Button>
            </div>
          </div>

          {/* Ручное определение победителя */}
          <div className="space-y-2">
            <Label>Победитель (ручное определение)</Label>
            <div className="flex gap-2">
              <Button
                variant={manualWinner === match.team1_id ? "default" : "outline"}
                size="sm"
                onClick={() => setManualWinner(manualWinner === match.team1_id ? null : match.team1_id)}
                className="flex-1"
                disabled={!match.team1_id}
              >
                {match.team1?.name || "TBD"}
              </Button>
              <Button
                variant={manualWinner === match.team2_id ? "default" : "outline"}
                size="sm"
                onClick={() => setManualWinner(manualWinner === match.team2_id ? null : match.team2_id)}
                className="flex-1"
                disabled={!match.team2_id}
              >
                {match.team2?.name || "TBD"}
              </Button>
            </div>
            {!manualWinner && (
              <p className="text-xs text-muted-foreground">
                Если не выбрано, победитель определяется автоматически по счету
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
