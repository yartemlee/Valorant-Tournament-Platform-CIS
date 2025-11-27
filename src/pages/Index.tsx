import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import NewsCard from "@/components/home/NewsCard";
import { TournamentCard } from "@/components/tournaments/TournamentCard";
import { Button } from "@/components/ui/button";
import { Trophy, Plus } from "lucide-react";

interface Tournament {
  id: string;
  title: string;
  description: string | null;
  format: string;
  start_time: string;
  prize_pool: string | null;
  status: string;
  banner_url: string | null;
  max_teams: number | null;
  organizer_id: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [featuredTournament, setFeaturedTournament] = useState<Tournament | null>(null);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);

    // Fetch open tournaments sorted by date
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["registration", "active"])
      .order("start_time", { ascending: true })
      .limit(4);

    if (!error && data) {
      // First tournament is featured
      setFeaturedTournament(data[0] || null);
      // Rest are active tournaments
      setActiveTournaments(data.slice(1));
    }

    setLoading(false);
  };

  const news = [
    {
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
      title: "Новый патч Valorant: что изменилось",
      date: "15 января 2025",
      description: "Разбираем все изменения нового патча и как они повлияют на мету"
    },
    {
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      title: "Анонс январских турниров",
      date: "12 января 2025",
      description: "Календарь всех предстоящих турниров на январь 2025 года"
    },
    {
      image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80",
      title: "Топ-5 стратегий для Haven",
      date: "10 января 2025",
      description: "Лучшие стратегии для карты Haven от профессиональных игроков"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopBar />

        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Featured Tournament */}
            <section className="mb-12">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Загрузка турниров...</p>
                </div>
              ) : featuredTournament ? (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border p-8">
                  {featuredTournament.banner_url && (
                    <div className="absolute inset-0 opacity-20">
                      <img
                        src={featuredTournament.banner_url}
                        alt={featuredTournament.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="h-6 w-6 text-primary" />
                      <span className="text-sm font-semibold text-primary">Избранный турнир</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">{featuredTournament.title}</h2>
                    {featuredTournament.description && (
                      <p className="text-lg text-muted-foreground mb-6">{featuredTournament.description}</p>
                    )}
                    <div className="flex gap-4">
                      <Button onClick={() => navigate(`/tournaments/${featuredTournament.id}`)}>
                        Подробнее
                      </Button>
                      {featuredTournament.status === "registration" && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/tournaments/${featuredTournament.id}?action=join`)}
                        >
                          Участвовать
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-border rounded-xl">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Сейчас турниров нет</h3>
                  <p className="text-muted-foreground mb-6">
                    Следите за обновлениями или создайте свой турнир
                  </p>
                  <Button onClick={() => navigate("/tournaments?create=true")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать турнир
                  </Button>
                </div>
              )}
            </section>

            {/* News Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                Последние новости(в разработке)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                  <NewsCard key={index} {...item} />
                ))}
              </div>
            </section>

            {/* Active Tournaments */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  🔥 Активные турниры
                </h2>
                <Button variant="outline" onClick={() => navigate("/tournaments")}>
                  Все турниры
                </Button>
              </div>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Загрузка...</p>
                </div>
              ) : activeTournaments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTournaments.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">Нет активных турниров</p>
                  <Button onClick={() => navigate("/tournaments?create=true")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать турнир
                  </Button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
