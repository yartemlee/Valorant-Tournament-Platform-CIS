/**
 * TournamentBracket Component
 * 
 * Компонент для отображения и управления турнирной сеткой.
 * Поддерживает два формата: single_elimination (одиночное выбывание) 
 * и double_elimination (двойное выбывание).
 * 
 * Основные возможности:
 * - Генерация турнирной сетки на основе участников
 * - Отображение матчей с кастомными карточками
 * - Редактирование результатов матчей (для владельца турнира)
 * - Случайная расстановка команд
 * - Разделение на верхнюю/нижнюю сетки для double elimination
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Shuffle, Zap } from "lucide-react";
import { toast } from "sonner";
import { MatchCard } from "./MatchCard";
import { MatchEditDialog } from "./MatchEditDialog";

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

/**
 * Интерфейс для матча турнира
 */
interface Match {
  id: string;
  round_number: number;         // Номер раунда
  match_number: number;          // Номер матча в раунде
  bracket_type: string;          // Тип: upper, lower, final, grand_final, third_place
  team1_id: string | null;
  team2_id: string | null;
  team1_score: number;
  team2_score: number;
  winner_id: string | null;
  loser_id: string | null;
  status: string;                // pending, completed
  best_of: number;               // Best of N (1, 3, 5)
  team1?: {
    name: string;
    tag: string;
    logo_url: string | null
  };
  team2?: {
    name: string;
    tag: string;
    logo_url: string | null
  };
}

/**
 * Пропсы компонента турнирной сетки
 */
interface TournamentBracketProps {
  tournamentId: string;          // ID турнира
  isOwner: boolean;              // Является ли пользователь владельцем турнира
  bracketFormat: string;         // single_elimination или double_elimination
  participants: any[];           // Массив участников турнира
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export function TournamentBracket({
  tournamentId,
  isOwner,
  bracketFormat,
  participants
}: TournamentBracketProps) {

  // ============================================================================
  // STATE
  // ============================================================================

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // ============================================================================
  // ЭФФЕКТЫ
  // ============================================================================

  /**
   * Загружаем матчи при монтировании компонента или изменении tournamentId
   */
  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  // ============================================================================
  // API ФУНКЦИИ
  // ============================================================================

  /**
   * Загружает матчи из базы данных и дополняет их информацией о командах
   */
  const fetchMatches = useCallback(async () => {
    const { data, error } = await supabase
      .from("tournament_matches" as any)
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("round_number")
      .order("match_number");

    if (error) {
      console.error("Ошибка загрузки матчей:", error);
      setLoading(false);
      return;
    }

    // Загружаем информацию о командах для каждого матча
    const matchesWithTeams = await Promise.all(
      ((data as any[]) || []).map(async (match) => {
        const team1 = match.team1_id ? await getTeamInfo(match.team1_id) : null;
        const team2 = match.team2_id ? await getTeamInfo(match.team2_id) : null;
        return { ...match, team1, team2 };
      })
    );

    setMatches(matchesWithTeams);
    setLoading(false);
  }, [tournamentId]);

  /**
   * Получает информацию о команде по её ID
   */
  const getTeamInfo = async (teamId: string) => {
    const { data } = await supabase
      .from("teams")
      .select("name, tag, logo_url")
      .eq("id", teamId)
      .single();
    return data;
  };

  // ============================================================================
  // ГЕНЕРАЦИЯ ТУРНИРНОЙ СЕТКИ
  // ============================================================================

  /**
   * Генерирует турнирную сетку на основе участников
   * Вызывается только владельцем турнира
   */
  const generateBracket = async () => {
    if (!isOwner) return;

    setLoading(true);
    try {
      // Удаляем старую сетку
      await supabase
        .from("tournament_matches" as any)
        .delete()
        .eq("tournament_id", tournamentId);

      // Вычисляем количество раундов на основе количества участников
      // Например, для 8 команд: log2(8) = 3 раунда
      const numRounds = Math.ceil(Math.log2(participants.length));

      // Генерируем сетку в зависимости от формата
      if (bracketFormat === "single_elimination") {
        await generateSingleElimination(numRounds);
      } else {
        await generateDoubleElimination(numRounds);
      }

      // Помечаем турнир как имеющий сгенерированную сетку
      await supabase
        .from("tournaments")
        .update({ bracket_generated: true } as any)
        .eq("id", tournamentId);

      toast.success("Сетка создана");
      fetchMatches();
    } catch (error) {
      toast.error("Ошибка создания сетки");
      console.error("Ошибка генерации сетки:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Генерирует сетку одиночного выбывания
   * 
   * Структура:
   * - Первый раунд: все участники распределены по парам
   * - Последующие раунды: победители предыдущего раунда
   * - Финал: последний матч
   * - Матч за 3-е место: между проигравшими в полуфинале
   * 
   * @param numRounds - Количество раундов
   */
  const generateSingleElimination = async (numRounds: number) => {
    const matchesToCreate = [];

    // Количество матчей в первом раунде = половина участников
    // Например, для 8 команд: 2^(3-1) = 4 матча
    const firstRoundMatches = Math.pow(2, numRounds - 1);

    // ========== ПЕРВЫЙ РАУНД ==========
    // Распределяем участников по парам
    for (let i = 0; i < firstRoundMatches; i++) {
      const participant1 = participants[i * 2];        // Участник 0, 2, 4, ...
      const participant2 = participants[i * 2 + 1];    // Участник 1, 3, 5, ...

      matchesToCreate.push({
        tournament_id: tournamentId,
        round_number: 1,
        match_number: i + 1,
        bracket_type: "upper",
        team1_id: participant1?.team_id || null,
        team2_id: participant2?.team_id || null,
        status: "pending",
        best_of: 1,  // BO1 для первых раундов
      });
    }

    // ========== ПОСЛЕДУЮЩИЕ РАУНДЫ ==========
    // С каждым раундом количество матчей уменьшается вдвое
    for (let round = 2; round <= numRounds; round++) {
      const matchesInRound = Math.pow(2, numRounds - round);

      for (let i = 0; i < matchesInRound; i++) {
        const isFinal = round === numRounds;

        matchesToCreate.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: i + 1,
          bracket_type: isFinal ? "final" : "upper",
          team1_id: null,  // Победители заполнятся после матчей
          team2_id: null,
          status: "pending",
          // BO5 для финала, BO3 для полуфинала, BO1 для остальных
          best_of: isFinal ? 5 : (round === numRounds - 1 ? 3 : 1),
        });
      }
    }

    // ========== МАТЧ ЗА 3-Е МЕСТО ==========
    // Специальный матч между проигравшими в полуфинале
    matchesToCreate.push({
      tournament_id: tournamentId,
      round_number: numRounds,
      match_number: 999,  // Специальный номер для отличия
      bracket_type: "third_place",
      team1_id: null,
      team2_id: null,
      status: "pending",
      best_of: 3,
    });

    // Сохраняем все матчи в базу данных
    await supabase.from("tournament_matches" as any).insert(matchesToCreate);
  };

  /**
   * Генерирует сетку двойного выбывания
   * 
   * Структура:
   * - Верхняя сетка (upper bracket): как в single elimination
   * - Нижняя сетка (lower bracket): для проигравших из верхней сетки
   * - Гранд-финал: победитель верхней vs победитель нижней сетки
   * 
   * @param numRounds - Количество раундов в верхней сетке
   */
  const generateDoubleElimination = async (numRounds: number) => {
    const matchesToCreate = [];
    const firstRoundMatches = Math.pow(2, numRounds - 1);

    // ========== ВЕРХНЯЯ СЕТКА - ПЕРВЫЙ РАУНД ==========
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

    // ========== ВЕРХНЯЯ СЕТКА - ПОСЛЕДУЮЩИЕ РАУНДЫ ==========
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
          // BO3 для финала верхней сетки, BO1 для остальных
          best_of: round === numRounds ? 3 : 1,
        });
      }
    }

    // ========== НИЖНЯЯ СЕТКА ==========
    // В нижней сетке раундов примерно в 2 раза больше, чем в верхней
    // Это нужно, чтобы проигравшие команды могли пройти полный путь
    const lowerRounds = numRounds * 2 - 2;

    for (let round = 1; round <= lowerRounds; round++) {
      // Количество матчей в нижней сетке вычисляется по специальной формуле
      // Она учитывает, что команды добавляются из верхней сетки постепенно
      const matchesInRound = Math.ceil(
        firstRoundMatches / Math.pow(2, Math.floor((round + 1) / 2))
      );

      for (let i = 0; i < matchesInRound; i++) {
        matchesToCreate.push({
          tournament_id: tournamentId,
          round_number: round,
          match_number: i + 1,
          bracket_type: "lower",
          team1_id: null,
          team2_id: null,
          status: "pending",
          // BO3 для финала нижней сетки, BO1 для остальных
          best_of: round === lowerRounds ? 3 : 1,
        });
      }
    }

    // ========== ГРАНД-ФИНАЛ ==========
    // Победитель верхней сетки против победителя нижней сетки
    matchesToCreate.push({
      tournament_id: tournamentId,
      round_number: numRounds + 1,
      match_number: 1,
      bracket_type: "grand_final",
      team1_id: null,
      team2_id: null,
      status: "pending",
      best_of: 5,  // Гранд-финал всегда BO5
    });

    await supabase.from("tournament_matches" as any).insert(matchesToCreate);
  };

  // ============================================================================
  // УПРАВЛЕНИЕ КОМАНДАМИ
  // ============================================================================

  /**
   * Случайная расстановка команд в первом раунде
   * Полезно для "жеребьёвки"
   */
  const shuffleParticipants = async () => {
    if (!isOwner) return;

    // Перемешиваем участников
    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // Находим все матчи первого раунда
    const firstRoundMatches = matches.filter(
      (m) => m.round_number === 1 && m.bracket_type === "upper"
    );

    // Обновляем команды в каждом матче
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

  /**
   * Открывает диалог редактирования матча
   */
  const handleEditMatch = useCallback((match: Match) => {
    setSelectedMatch(match);
    setEditDialogOpen(true);
  }, []);

  // ============================================================================
  // ОБРАБОТКА ДАННЫХ ДЛЯ ОТОБРАЖЕНИЯ
  // ============================================================================

  /**
   * Мемоизированные группы матчей для оптимизации производительности
   */
  const { upperMatches, lowerMatches, grandFinalMatch, thirdPlaceMatch, upperRounds, lowerRounds } = useMemo(() => {
    // Группируем матчи по типам
    const upper = matches.filter((m) => m.bracket_type === "upper" || m.bracket_type === "final");
    const lower = matches.filter((m) => m.bracket_type === "lower");
    const grandFinal = matches.find((m) => m.bracket_type === "grand_final");
    const thirdPlace = matches.find((m) => m.bracket_type === "third_place");

    // Собираем уникальные номера раундов и сортируем
    const uRounds = Array.from(new Set(upper.map((m) => m.round_number))).sort((a, b) => a - b);
    const lRounds = Array.from(new Set(lower.map((m) => m.round_number))).sort((a, b) => a - b);

    return {
      upperMatches: upper,
      lowerMatches: lower,
      grandFinalMatch: grandFinal,
      thirdPlaceMatch: thirdPlace,
      upperRounds: uRounds,
      lowerRounds: lRounds,
    };
  }, [matches]);

  /**
   * Возвращает человекочитаемое название раунда
   */
  const getRoundLabel = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Финал";
    if (round === totalRounds - 1) return "Полуфинал";
    if (round === totalRounds - 2) return "Четвертьфинал";
    return `Раунд ${round}`;
  };

  // ============================================================================
  // РЕНДЕРИНГ СЕКЦИИ СЕТКИ
  // ============================================================================

  /**
   * Отрисовывает одну секцию турнирной сетки (верхнюю или нижнюю)
   * 
   * @param rounds - Массив номеров раундов
   * @param matchesList - Список матчей для отображения
   * @param title - Заголовок секции
   */
  const renderBracketSection = (rounds: number[], matchesList: Match[], title: string) => (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="overflow-x-auto pb-6">
        {/* Горизонтальный скролл для больших сеток */}
        <div className="flex gap-8 min-w-max px-4">
          {rounds.map((round, roundIndex) => {
            // Фильтруем матчи для текущего раунда
            const roundMatches = matchesList
              .filter((m) => m.round_number === round)
              .sort((a, b) => a.match_number - b.match_number);

            return (
              <div key={round} className="flex flex-col min-w-[280px]">
                {/* Заголовок раунда */}
                <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">
                  {getRoundLabel(round, rounds[rounds.length - 1])}
                </h3>

                {/* Матчи раунда с равномерным распределением по высоте */}
                <div className="flex flex-col justify-around flex-grow gap-8 relative">
                  {roundMatches.map((match, index) => (
                    <div key={match.id} className="relative flex items-center">
                      {/* Соединительная линия ОТ предыдущего раунда */}
                      {roundIndex > 0 && (
                        <div className="absolute -left-4 w-4 h-px bg-border" />
                      )}

                      {/* Карточка матча */}
                      <div className="w-full z-10">
                        <MatchCard
                          match={match}
                          isOwner={isOwner}
                          onEdit={() => handleEditMatch(match)}
                        />
                      </div>

                      {/* Соединительная линия К следующему раунду */}
                      {roundIndex < rounds.length - 1 && (
                        <div className="absolute -right-4 w-4 h-px bg-border" />
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

  // ============================================================================
  // РЕНДЕРИНГ КОМПОНЕНТА
  // ============================================================================

  // Состояние загрузки
  if (loading) {
    return <p className="text-center text-muted-foreground py-8">Загрузка сетки...</p>;
  }

  // Нет сгенерированной сетки
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

  // Основной интерфейс с турнирной сеткой
  return (
    <div className="space-y-6">
      {/* Кнопки управления (только для владельца) */}
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

      {/* Верхняя сетка (или основная для single elimination) */}
      {renderBracketSection(
        upperRounds,
        upperMatches,
        bracketFormat === "double_elimination" ? "Верхняя сетка" : "Турнирная сетка"
      )}

      {/* Нижняя сетка (только для double elimination) */}
      {bracketFormat === "double_elimination" && lowerMatches.length > 0 &&
        renderBracketSection(lowerRounds, lowerMatches, "Нижняя сетка")
      }

      {/* Секция финалов */}
      {(grandFinalMatch || thirdPlaceMatch) && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold mb-6 text-center">Финалы</h2>
          <div className="flex flex-wrap justify-center gap-12">
            {/* Гранд-финал (только для double elimination) */}
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

            {/* Матч за 3-е место */}
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
