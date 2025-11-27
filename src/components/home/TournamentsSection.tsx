// @deprecated This component is currently unused. Logic is inline in Index.tsx.
import { Button } from "@/components/ui/button";
import { TournamentCard } from "@/components/tournaments/TournamentCard";

const TournamentsSection = () => {
  const tournaments = [
    {
      name: "CIS Masters Cup",
      format: "5v5 Team",
      prize: "$500",
      date: "Jan 20 - Jan 27",
      status: "open" as const,
      participants: 24,
    },
    {
      name: "Solo Ranked Challenge",
      format: "1v1 Solo",
      prize: "$200",
      date: "Jan 22 - Jan 25",
      status: "open" as const,
      participants: 67,
    },
    {
      name: "Weekly Qualifier #3",
      format: "5v5 Team",
      prize: "$150",
      date: "Jan 25",
      status: "upcoming" as const,
    },
    {
      name: "New Year Championship",
      format: "5v5 Team",
      prize: "$1000",
      date: "Live Now",
      status: "ongoing" as const,
      participants: 32,
    },
  ];

  return (
    <section id="tournaments" className="py-20 bg-gradient-to-b from-background to-background/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            🔥 Current & Upcoming Tournaments
          </h2>
          <p className="text-muted-foreground text-lg">
            Join competitive tournaments and prove your skills
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tournaments.map((tournament, index) => (
            <TournamentCard key={index} tournament={tournament as unknown as never} />
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero-outline" size="lg">
            See All Tournaments
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TournamentsSection;
