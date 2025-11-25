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
    if (open && autoDetect) {
      detectWinnersFromBracket();
    }
  }, [open, autoDetect]);

  /**
   * Определяет победителей автоматически из турнирной сетки
   */
  const detectWinnersFromBracket = async () => {
    try {
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

      // Ищем матч за 3-е место
      const thirdPlaceMatch = matches.find((m) => m.bracket_type === "third_place");
      if (thirdPlaceMatch?.winner_id) {
        setThirdPlace(thirdPlaceMatch.winner_id);
      }

      if (finalMatch?.winner_id || thirdPlaceMatch?.winner_id) {
        toast.success("Призёры определены автоматически по сетке");
      } else {
        toast.info("Не удалось определить призёров. Выберите вручную.");
        setAutoDetect(false);
      }
    } catch (error) {
      console.error("Ошибка определения призёров:", error);
      toast.error("Ошибка определения призёров");
      setAutoDetect(false);
    }
  };

  /**
   * Получает всех игроков команды
   */
  const getTeamMembers = async (teamId: string): Promise<string[]> => {
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId);

    return members?.map(m => m.user_id) || [];
  };

  /**
   * Начисляет медали всем участникам команды
   */
  const awardMedalsToTeam = async (
    teamId: string,
    medalType: "medals_gold" | "medals_silver" | "medals_bronze"
  ) => {
    const memberIds = await getTeamMembers(teamId);

    for (const userId of memberIds) {
      try {
        // Получаем текущее количество медалей
        const { data: profile } = await supabase
          .from("profiles")
          .select(medalType)
          .eq("id", userId)
          .single();

        // Увеличиваем счётчик медалей
        await supabase
          .from("profiles")
          .update({ [medalType]: (profile?.[medalType] || 0) + 1 })
          .eq("id", userId);
      } catch (error) {
        console.error(`Ошибка начисления медали игроку ${userId}:`, error);
        // Продолжаем даже если для одного игрока не удалось
      }
    }
  };

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
      // Получаем ID всех участников команд-победителей
      const firstPlaceMembers = await getTeamMembers(firstPlace);
      const secondPlaceMembers = secondPlace ? await getTeamMembers(secondPlace) : [];
      const thirdPlaceMembers = thirdPlace ? await getTeamMembers(thirdPlace) : [];

      // Начисляем медали командам
      if (firstPlace) {
        await awardMedalsToTeam(firstPlace, "medals_gold");
      }

      if (secondPlace) {
        await awardMedalsToTeam(secondPlace, "medals_silver");
      }

      if (thirdPlace) {
        await awardMedalsToTeam(thirdPlace, "medals_bronze");
      }

      // Сохраняем результаты турнира
      // В базу данных сохраняем ID участников команд (user_id), а не team_id
      await supabase.from("tournament_results").insert([
        {
          tournament_id: tournamentId,
          first_place_team_ids: firstPlaceMembers,
          second_place_team_ids: secondPlaceMembers,
          third_place_team_ids: thirdPlaceMembers,
        },
      ]);

      // Обновляем статус турнира
      await supabase
        .from("tournaments")
        .update({ status: "completed" })
        .eq("id", tournamentId);

      // Очищаем фантомные данные после завершения турнира
      try {
        await cleanupTournamentPhantoms(tournamentId);
        console.log("Фантомные данные турнира очищены");
      } catch (error) {
        console.error("Ошибка очистки фантомных данных:", error);
        // Не блокируем завершение турнира если очистка не удалась
      }

      toast.success("Турнир завершён. Медали начислены всем участникам команд!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error("Ошибка завершения турнира");
      console.error("Ошибка завершения турнира:", error);
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
