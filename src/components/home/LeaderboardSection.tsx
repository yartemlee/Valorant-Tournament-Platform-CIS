// @deprecated This component is currently unused.
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";

const LeaderboardSection = () => {
  const topPlayers = [
    { rank: 1, name: "ShadowStrike", country: "🇷🇺", points: 2456 },
    { rank: 2, name: "VortexGaming", country: "🇺🇦", points: 2298 },
    { rank: 3, name: "PhoenixRise", country: "🇰🇿", points: 2145 },
    { rank: 4, name: "FrostByte", country: "🇷🇺", points: 2089 },
    { rank: 5, name: "NightHawk", country: "🇺🇦", points: 1976 },
  ];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400";
      case 2:
        return "text-gray-300";
      case 3:
        return "text-amber-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <section id="leaderboard" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            🏆 Top Players This Week
          </h2>
          <p className="text-muted-foreground text-lg">
            The best competitors in the CIS region
          </p>
        </div>

        <Card className="max-w-3xl mx-auto border-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-muted-foreground font-medium">Rank</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Player</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Country</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player) => (
                  <tr
                    key={player.rank}
                    className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {player.rank <= 3 ? (
                          <Medal className={`h-5 w-5 ${getRankColor(player.rank)}`} />
                        ) : (
                          <span className="text-muted-foreground font-bold">#{player.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-foreground">{player.name}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-2xl">{player.country}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-accent">{player.points.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="text-center mt-8">
          <Button variant="hero-outline" size="lg">
            Full Leaderboard
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
