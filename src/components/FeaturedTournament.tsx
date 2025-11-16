import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Users } from "lucide-react";

const FeaturedTournament = () => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-card border border-border/50 p-8 mb-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-accent" />
          <span className="text-accent font-bold text-sm uppercase tracking-wider">
            Избранный турнир
          </span>
        </div>

        <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          CIS Masters Cup 2025
        </h2>

        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span>20 - 27 января 2025</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>5v5 Team Format</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <span className="text-2xl font-bold bg-gradient-accent bg-clip-text text-transparent">
              $2,000
            </span>
          </div>
        </div>

        <p className="text-muted-foreground mb-6 max-w-3xl">
          Присоединяйтесь к крупнейшему турниру по Valorant в регионе СНГ. 
          Соревнуйтесь с лучшими командами, зарабатывайте токены и получайте призы!
        </p>

        <div className="flex gap-4">
          <Button size="lg" className="bg-gradient-primary shadow-glow-primary hover:shadow-glow-primary hover:scale-105">
            Присоединиться сейчас
          </Button>
          <Button variant="outline" size="lg">
            Подробности
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedTournament;
