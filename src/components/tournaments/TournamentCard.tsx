import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TournamentCardProps {
  tournament: {
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
  };
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate();

  const statusColors = {
    open: "bg-accent text-accent-foreground",
    ongoing: "bg-primary text-primary-foreground",
    completed: "bg-muted text-muted-foreground",
  };

  const formatLabels = {
    single_elimination: "Single Elimination",
    double_elimination: "Double Elimination",
  };

  const statusLabels = {
    open: "Открыт",
    ongoing: "В процессе",
    completed: "Завершён",
  };

  return (
    <Card className="group relative overflow-hidden border-border bg-card shadow-card hover:shadow-glow-primary hover:border-primary/50 transition-all duration-300 hover:scale-105">
      {/* Banner */}
      {tournament.banner_url && (
        <div className="h-32 overflow-hidden">
          <img
            src={tournament.banner_url}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="h-5 w-5 text-primary shrink-0" />
            <h3 className="text-lg font-bold text-foreground line-clamp-1">{tournament.name}</h3>
          </div>
          <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
            {statusLabels[tournament.status as keyof typeof statusLabels]}
          </Badge>
        </div>

        {/* Description */}
        {tournament.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{tournament.description}</p>
        )}

        {/* Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(tournament.date_start), "d MMMM yyyy, HH:mm", { locale: ru })}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{formatLabels[tournament.bracket_format as keyof typeof formatLabels]}</span>
          </div>

          {tournament.prize && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground">Призовой фонд</div>
              <div className="text-xl font-bold text-accent">{tournament.prize}</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            size="sm"
            onClick={() => navigate(`/tournaments/${tournament.id}`)}
          >
            Подробнее
          </Button>
          {tournament.status === "open" && tournament.registration_open && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/tournaments/${tournament.id}?action=join`)}
            >
              Участвовать
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
