import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar } from "lucide-react";

interface TournamentCardProps {
  name: string;
  format: string;
  prize: string;
  date: string;
  status: "open" | "ongoing" | "upcoming";
  participants?: number;
}

const TournamentCard = ({ name, format, prize, date, status, participants }: TournamentCardProps) => {
  const statusColors = {
    open: "bg-accent text-accent-foreground",
    ongoing: "bg-primary text-primary-foreground",
    upcoming: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="group relative overflow-hidden border-border bg-card shadow-card hover:shadow-glow-primary hover:border-primary/50 transition-all duration-300 hover:scale-105">
      <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="relative p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
          </div>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{format}</span>
            {participants && <span className="text-accent">• {participants} joined</span>}
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
          </div>

          <div className="pt-2">
            <div className="text-xs text-muted-foreground">Prize Pool</div>
            <div className="text-xl font-bold text-accent">{prize}</div>
          </div>
        </div>

        <Button variant="default" className="w-full" size="lg">
          Join Tournament
        </Button>
      </div>
    </Card>
  );
};

export default TournamentCard;
