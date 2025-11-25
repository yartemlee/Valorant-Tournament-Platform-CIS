import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
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

  /**
   * Продвигает команды в следующие матчи после завершения текущего
   * Обрабатывает все сценарии: обычные раунды, полуфиналы, финалы
   */
  const advanceWinner = async (currentMatch: any, winnerId: string, loserId: string | null) => {
    try {
      // Получить информацию о турнире
      const { data: tournament } = await supabase
        .from("tournaments")
        .select("format")
        .eq("id", currentMatch.tournament_id)
        .single();

      if (!tournament) return;

      // Получить все матчи турнира для определения структуры
      const { data: allMatches } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", currentMatch.tournament_id)
        .order("round_number")
        .order("match_number");

      if (!allMatches) return;

      // Определить максимальный раунд в верхней сетке
      const upperMatches = allMatches.filter(m => m.bracket_type === "upper" || m.bracket_type === "final");
      const maxUpperRound = Math.max(...upperMatches.map(m => m.round_number));

      // Проверяем, является ли текущий матч полуфиналом
      const isSemifinal = currentMatch.bracket_type === "upper" &&
        currentMatch.round_number === maxUpperRound - 1;

      // Проверяем, является ли текущий матч финалом верхней сетки (для double elimination)
      const isUpperFinal = currentMatch.bracket_type === "upper" &&
        currentMatch.round_number === maxUpperRound &&
        tournament.format === "double_elimination";

      // ========== СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ ПОЛУФИНАЛА ==========
      if (isSemifinal && tournament.format === "single_elimination") {
        // Победитель полуфинала → Финал
        const finalMatch = allMatches.find(m => m.bracket_type === "final");
        if (finalMatch) {
          const isTeam1Slot = currentMatch.match_number % 2 === 1;
          await supabase
            .from("tournament_matches")
            .update(isTeam1Slot ? { team1_id: winnerId } : { team2_id: winnerId })
            .eq("id", finalMatch.id);
        }

        // Проигравший полуфинала → Матч за 3-е место
        if (loserId) {
          const thirdPlaceMatch = allMatches.find(m => m.bracket_type === "third_place");
          if (thirdPlaceMatch) {
            const isTeam1SlotThird = currentMatch.match_number % 2 === 1;
            await supabase
              .from("tournament_matches")
              .update(isTeam1SlotThird ? { team1_id: loserId } : { team2_id: loserId })
              .eq("id", thirdPlaceMatch.id);
          }
        }
        return; // Выходим, т.к. обработали полуфинал специально
      }

      // ========== СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ ФИНАЛА ВЕРХНЕЙ СЕТКИ (DOUBLE ELIMINATION) ==========
      if (isUpperFinal) {
        // Победитель финала верхней сетки → Гранд-финал (слот team1)
        const grandFinalMatch = allMatches.find(m => m.bracket_type === "grand_final");
        if (grandFinalMatch) {
          await supabase
            .from("tournament_matches")
            .update({ team1_id: winnerId })
            .eq("id", grandFinalMatch.id);
        }

        // Проигравший финала верхней сетки → Нижняя сетка (последний раунд)
        if (loserId) {
          const lowerMatches = allMatches.filter(m => m.bracket_type === "lower");
          const maxLowerRound = Math.max(...lowerMatches.map(m => m.round_number));
          const lowerFinalMatch = lowerMatches.find(m => m.round_number === maxLowerRound);

          if (lowerFinalMatch) {
            // Определяем свободный слот в финале нижней сетки
            if (!lowerFinalMatch.team1_id) {
              await supabase
                .from("tournament_matches")
                .update({ team1_id: loserId })
                .eq("id", lowerFinalMatch.id);
            } else if (!lowerFinalMatch.team2_id) {
              await supabase
                .from("tournament_matches")
                .update({ team2_id: loserId })
                .eq("id", lowerFinalMatch.id);
            }
          }
        }
        return; // Выходим, т.к. обработали финал верхней сетки
      }

      // ========== СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ ФИНАЛА НИЖНЕЙ СЕТКИ ==========
      if (currentMatch.bracket_type === "lower") {
        const lowerMatches = allMatches.filter(m => m.bracket_type === "lower");
        const maxLowerRound = Math.max(...lowerMatches.map(m => m.round_number));
        const isLowerFinal = currentMatch.round_number === maxLowerRound;

        if (isLowerFinal) {
          // Победитель финала нижней сетки → Гранд-финал (слот team2)
          const grandFinalMatch = allMatches.find(m => m.bracket_type === "grand_final");
          if (grandFinalMatch) {
            await supabase
              .from("tournament_matches")
              .update({ team2_id: winnerId })
              .eq("id", grandFinalMatch.id);
          }
          return; // Проигравший финала нижней сетки выбывает
        }
      }

      // ========== ОБЫЧНАЯ ЛОГИКА ПРОДВИЖЕНИЯ В СЛЕДУЮЩИЙ РАУНД ==========
      const nextRound = currentMatch.round_number + 1;
      const nextMatchNumber = Math.ceil(currentMatch.match_number / 2);

      const { data: nextMatches } = await supabase
        .from("tournament_matches")
        .select("*")
        .eq("tournament_id", currentMatch.tournament_id)
        .eq("round_number", nextRound)
        .eq("match_number", nextMatchNumber)
        .eq("bracket_type", currentMatch.bracket_type);

      if (nextMatches && nextMatches.length > 0) {
        const nextMatch = nextMatches[0];
        const isTeam1Slot = currentMatch.match_number % 2 === 1;

        await supabase
          .from("tournament_matches")
          .update(isTeam1Slot ? { team1_id: winnerId } : { team2_id: winnerId })
          .eq("id", nextMatch.id);
      }

      // ========== DOUBLE ELIMINATION: ПРОИГРАВШИЙ ИЗ ВЕРХНЕЙ СЕТКИ → НИЖНЯЯ СЕТКА ==========
      if (tournament.format === "double_elimination" &&
        loserId &&
        currentMatch.bracket_type === "upper" &&
        !isSemifinal && // Полуфинал уже обработан выше
        !isUpperFinal) { // Финал верхней сетки уже обработан выше

        // Вычисляем, в какой раунд нижней сетки должен попасть проигравший
        // Это зависит от раунда верхней сетки
        const lowerRoundTarget = (currentMatch.round_number - 1) * 2 + 1;

        const { data: lowerMatches } = await supabase
          .from("tournament_matches")
          .select("*")
          .eq("tournament_id", currentMatch.tournament_id)
          .eq("bracket_type", "lower")
          .eq("round_number", lowerRoundTarget)
          .order("match_number");

        if (lowerMatches && lowerMatches.length > 0) {
          // Найти первый свободный слот в целевом раунде нижней сетки
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
      // Показываем ошибку пользователю, но не блокируем сохранение матча
      toast.error("Команды продвинуты в следующий раунд с ошибками");
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
