/**
 * CompleteTournamentDialog - Диалог завершения турнира
 * 
 * Основные функции:
 * - Автоматическое определение победителей из турнирной сетки
 * - Ручной выбор призёров
 * - Начисление медалей всем участникам команд-победителей
 * - Сохранение результатов турнира
 * - Очистка фантомных данных
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cleanupTournamentPhantoms } from "@/lib/phantomData";

/**
 * Участник турнира (команда)
 */
interface Participant {
  id: string;           // ID регистрации
  user_id: string;      // Не используется для командных турниров
  team_id: string;      // ID команды
  team: {
    name: string;
  } | null;
}

interface CompleteTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: Participant[];
  onSuccess?: () => void;
}


export function CompleteTournamentDialog({
  open,
  onOpenChange,
  tournamentId,
  participants,
  onSuccess,
}: CompleteTournamentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [firstPlace, setFirstPlace] = useState("");   // team_id
  const [secondPlace, setSecondPlace] = useState(""); // team_id
  const [thirdPlace, setThirdPlace] = useState("");   // team_id

  useEffect(() => {
    /**
     * Определяет победителей автоматически из турнирной сетки
     */
    const detectWinnersFromBracket = async () => {
      try {
        // Получаем информацию о турнире
        const { data: tournament } = await supabase
          .from("tournaments")
          .select("format")
          .eq("id", tournamentId)
          .single();

        // Получаем все завершённые матчи
        const { data: matches } = await supabase
          .from("tournament_matches")
          .select("*")
          .eq("tournament_id", tournamentId)
          .eq("status", "completed");

        if (!matches || matches.length === 0) {
          toast.info("Сетка пустая. Выберите призёров вручную.");
          setAutoDetect(false);
          return;
        }

        // Ищем финальный матч (для single elimination) или гранд-финал (для double elimination)
        let finalMatch = matches.find((m) => m.bracket_type === "grand_final");
        if (!finalMatch) {
          finalMatch = matches.find((m) => m.bracket_type === "final");
        }

        if (finalMatch?.winner_id) {
          setFirstPlace(finalMatch.winner_id);

          // Второе место - проигравший финала
          const secondPlaceId = finalMatch.team1_id === finalMatch.winner_id
            ? finalMatch.team2_id
            : finalMatch.team1_id;
          setSecondPlace(secondPlaceId || "");
        }

        // Определяем 3-е место в зависимости от формата
        if (tournament?.format === "double_elimination") {
          // Для DE: 3-е место = проигравший финала нижней сетки
          const lowerMatches = matches.filter(m => m.bracket_type === "lower");
          if (lowerMatches.length > 0) {
            // Находим финал нижней сетки (последний раунд)
            const maxLowerRound = Math.max(...lowerMatches.map(m => m.round_number));
            const lowerFinalMatch = lowerMatches.find(m => m.round_number === maxLowerRound);

            if (lowerFinalMatch?.winner_id) {
              // 3-е место = loser of LB Final
              const thirdPlaceId = lowerFinalMatch.team1_id === lowerFinalMatch.winner_id
                ? lowerFinalMatch.team2_id
                : lowerFinalMatch.team1_id;
              setThirdPlace(thirdPlaceId || "");
            }
          }
        } else {
          // Для SE: ищем матч за 3-е место
          const thirdPlaceMatch = matches.find((m) => m.bracket_type === "third_place");
          if (thirdPlaceMatch?.winner_id) {
            setThirdPlace(thirdPlaceMatch.winner_id);
          }
        }

        if (finalMatch?.winner_id) {
          toast.success("Призёры определены автоматически по сетке");
        } else {
          toast.info("Не удалось определить призёров. Выберите вручную.");
          setAutoDetect(false);
        }
      } catch {
        toast.error("Ошибка определения призёров");
        setAutoDetect(false);
      }
    };

    if (open && autoDetect) {
      detectWinnersFromBracket();
    }
  }, [open, autoDetect, tournamentId]);

  /**
   * Завершает турнир и начисляет награды
   */
  const handleComplete = async () => {
    if (!firstPlace) {
      toast.error("Выберите победителя (1 место)");
      return;
    }

    setLoading(true);

    try {

      // Начисляем медали (используем RPC для обхода RLS)
      if (firstPlace) {
        await supabase.rpc("award_tournament_medals", {
          p_tournament_id: tournamentId,
          p_team_id: firstPlace,
          p_medal_type: "gold",
        });
      }

      if (secondPlace) {
        await supabase.rpc("award_tournament_medals", {
          p_tournament_id: tournamentId,
          p_team_id: secondPlace,
          p_medal_type: "silver",
        });
      }

      if (thirdPlace) {
        await supabase.rpc("award_tournament_medals", {
          p_tournament_id: tournamentId,
          p_team_id: thirdPlace,
          p_medal_type: "bronze",
        });
      }

      // Distribute prize pool coins
      try {
        const { data: distResult, error: distError } = await supabase.rpc("distribute_tournament_prizes", {
          p_tournament_id: tournamentId,
          p_first_place_team_id: firstPlace,
          p_second_place_team_id: secondPlace || null,
          p_third_place_team_id: thirdPlace || null,
        });

        if (distError) {
          toast.error("Ошибка распределения призового фонда");
        } else {
          toast.success("Призовой фонд распределен!");
        }
      } catch {
      }

      // Сохраняем результаты турнира
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("tournament_results" as any).insert([
        {
          tournament_id: tournamentId,
          first_place_team_ids: firstPlace ? [firstPlace] : [],
          second_place_team_ids: secondPlace ? [secondPlace] : [],
          third_place_team_ids: thirdPlace ? [thirdPlace] : [],
        },
      ]);

      // Обновляем статус турнира
      await supabase
        .from("tournaments")
        .update({ status: "completed" })
        .eq("id", tournamentId);

      try {
        await cleanupTournamentPhantoms(tournamentId);
      } catch {
      }

      toast.success("Турнир завершён. Медали начислены командам и всем участникам!");
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Ошибка завершения турнира");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Завершить турнир</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {autoDetect ? (
            <div className="bg-accent/10 border border-accent/20 rounded-md p-3 text-sm">
              ✅ Призёры определены автоматически по сетке. Проверьте правильность.
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Выберите команды-победители. Всем участникам команд будут начислены медали.
            </p>
          )}

          {/* Первое место */}
          <div className="space-y-2">
            <Label>🥇 1-е место (обязательно)</Label>
            <Select value={firstPlace} onValueChange={setFirstPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.team_id} value={p.team_id}>
                    {p.team?.name || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Второе место */}
          <div className="space-y-2">
            <Label>🥈 2-е место</Label>
            <Select value={secondPlace} onValueChange={setSecondPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                {participants
                  .filter((p) => p.team_id !== firstPlace)
                  .map((p) => (
                    <SelectItem key={p.team_id} value={p.team_id}>
                      {p.team?.name || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Третье место */}
          <div className="space-y-2">
            <Label>🥉 3-е место</Label>
            <Select value={thirdPlace} onValueChange={setThirdPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите команду" />
              </SelectTrigger>
              <SelectContent>
                {participants
                  .filter((p) => p.team_id !== firstPlace && p.team_id !== secondPlace)
                  .map((p) => (
                    <SelectItem key={p.team_id} value={p.team_id}>
                      {p.team?.name || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleComplete}
              disabled={loading || !firstPlace}
              className="flex-1"
            >
              {loading ? "Завершение..." : "Завершить турнир"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
