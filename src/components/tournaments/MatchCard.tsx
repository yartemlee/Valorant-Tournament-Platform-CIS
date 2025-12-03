import { Match, Tournament, BracketMatch } from '@/types/common.types';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Edit3, Clock, Play, CheckCircle } from "lucide-react";

interface MatchCardProps {
  match: BracketMatch;
  isOwner: boolean;
  onEdit: () => void;
}

export function MatchCard({ match, isOwner, onEdit }: MatchCardProps) {
  const getTeamRowClass = (teamId: string | null) => {
    if (!match.winner_id) return "bg-card border border-border";
    return match.winner_id === teamId
      ? "bg-green-500/10 border-green-500/50 border"
      : "bg-card border border-border opacity-60";
  };

  const getBestOfLabel = () => {
    switch (match.best_of) {
      case 1: return "BO1";
      case 3: return "BO3";
      case 5: return "BO5";
      default: return `BO${match.best_of}`;
    }
  };

  const getStatusIcon = () => {
    switch (match.status) {
      case "pending":
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
      case "in_progress":
        return <Play className="h-3.5 w-3.5 text-orange-500" />;
      case "completed":
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    switch (match.status) {
      case "pending":
        return "Не началась";
      case "in_progress":
        return "В процессе";
      case "completed":
        return "Завершена";
      default:
        return "—";
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative">
        <Card className="w-[260px] p-0 overflow-hidden bg-background/50 backdrop-blur">
          {/* Заголовок матча */}
          <div className="bg-muted/30 px-3 py-2 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                {getBestOfLabel()}
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    {getStatusIcon()}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{getStatusLabel()}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="h-6 w-6 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Команда 1 */}
          <div className={`flex items-center justify-between px-3 py-2.5 transition-all ${getTeamRowClass(match.team1_id)}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={match.team1?.logo_url || ""} />
                <AvatarFallback className="text-xs">
                  {match.team1?.tag || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">
                  {match.team1?.tag || "TBD"}
                </span>
              </div>
            </div>
            {match.team1 && (
              <Badge
                variant={match.winner_id === match.team1_id ? "default" : "outline"}
                className="ml-2 min-w-[2rem] justify-center font-bold"
              >
                {match.team1_score}
              </Badge>
            )}
          </div>

          {/* Разделитель */}
          <div className="h-px bg-border" />

          {/* Команда 2 */}
          <div className={`flex items-center justify-between px-3 py-2.5 transition-all ${getTeamRowClass(match.team2_id)}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Avatar className="h-6 w-6">
                <AvatarImage src={match.team2?.logo_url || ""} />
                <AvatarFallback className="text-xs">
                  {match.team2?.tag || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate">
                  {match.team2?.tag || "TBD"}
                </span>
              </div>
            </div>
            {match.team2 && (
              <Badge
                variant={match.winner_id === match.team2_id ? "default" : "outline"}
                className="ml-2 min-w-[2rem] justify-center font-bold"
              >
                {match.team2_score}
              </Badge>
            )}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
