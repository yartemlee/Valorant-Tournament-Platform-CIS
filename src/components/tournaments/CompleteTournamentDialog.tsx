import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cleanupTournamentPhantoms } from "@/lib/phantomData";

interface Participant {
  id: string;
  user_id: string;
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
  const [firstPlace, setFirstPlace] = useState("");
  const [secondPlace, setSecondPlace] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");

  useEffect(() => {
    if (open && autoDetect) {
      detectWinnersFromBracket();
    }
  }, [open, autoDetect]);

  const detectWinnersFromBracket = async () => {
    try {
      // Fetch all matches from bracket
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

      // Find final match
      const finalMatch = matches.find((m) => m.bracket_type === "final");
      if (finalMatch?.winner_id) {
        setFirstPlace(finalMatch.winner_id);
        // Second place is the loser of final
        const secondPlaceId = finalMatch.team1_id === finalMatch.winner_id 
          ? finalMatch.team2_id 
          : finalMatch.team1_id;
        setSecondPlace(secondPlaceId || "");
      }

      // Find third place match
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
      console.error(error);
      toast.error("Ошибка определения призёров");
      setAutoDetect(false);
    }
  };

  const handleComplete = async () => {
    if (!firstPlace) {
      toast.error("Выберите победителя (1 место)");
      return;
    }

    setLoading(true);

    try {
      // Award medals to winners
      if (firstPlace) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("medals_gold")
          .eq("id", firstPlace)
          .single();
        
        await supabase
          .from("profiles")
          .update({ medals_gold: (profile?.medals_gold || 0) + 1 })
          .eq("id", firstPlace);
      }

      if (secondPlace) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("medals_silver")
          .eq("id", secondPlace)
          .single();
        
        await supabase
          .from("profiles")
          .update({ medals_silver: (profile?.medals_silver || 0) + 1 })
          .eq("id", secondPlace);
      }

      if (thirdPlace) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("medals_bronze")
          .eq("id", thirdPlace)
          .single();
        
        await supabase
          .from("profiles")
          .update({ medals_bronze: (profile?.medals_bronze || 0) + 1 })
          .eq("id", thirdPlace);
      }

      // Save results
      await supabase.from("tournament_results").insert([
        {
          tournament_id: tournamentId,
          first_place_team_ids: firstPlace ? [firstPlace] : [],
          second_place_team_ids: secondPlace ? [secondPlace] : [],
          third_place_team_ids: thirdPlace ? [thirdPlace] : [],
        },
      ]);

      // Update tournament status
      await supabase
        .from("tournaments")
        .update({ status: "completed" })
        .eq("id", tournamentId);

      // Cleanup phantom data after tournament completion
      try {
        await cleanupTournamentPhantoms(tournamentId);
        console.log("Фантомные данные турнира очищены");
      } catch (error) {
        console.error("Ошибка очистки фантомных данных:", error);
        // Don't block tournament completion if cleanup fails
      }

      toast.success("Турнир завершён. Медали начислены!");
      onSuccess?.();
    } catch (error) {
      toast.error("Ошибка завершения турнира");
      console.error(error);
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
              Выберите победителей турнира. Им будут начислены медали:
            </p>
          )}

          <div className="space-y-2">
            <Label>🥇 1-е место (обязательно)</Label>
            <Select value={firstPlace} onValueChange={setFirstPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите игрока" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.user_id} value={p.user_id}>
                    {p.team?.name || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>🥈 2-е место</Label>
            <Select value={secondPlace} onValueChange={setSecondPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите игрока" />
              </SelectTrigger>
              <SelectContent>
                {participants
                  .filter((p) => p.user_id !== firstPlace)
                  .map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.team?.name || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>🥉 3-е место</Label>
            <Select value={thirdPlace} onValueChange={setThirdPlace}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите игрока" />
              </SelectTrigger>
              <SelectContent>
                {participants
                  .filter((p) => p.user_id !== firstPlace && p.user_id !== secondPlace)
                  .map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.team?.name || "Unknown"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button onClick={handleComplete} disabled={loading || !firstPlace} className="flex-1">
              {loading ? "Завершение..." : "Завершить турнир"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
