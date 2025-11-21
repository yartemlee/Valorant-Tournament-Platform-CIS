import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Zap } from "lucide-react";

const AboutSection = () => {
  const features = [
    {
      icon: Target,
      title: "Join official or community tournaments",
      description: "Compete in professionally organized events or create your own",
    },
    {
      icon: TrendingUp,
      title: "Track your progress and stats",
      description: "Monitor your performance with detailed analytics and rankings",
    },
    {
      icon: Zap,
      title: "Host your own Valorant events",
      description: "Organize tournaments with custom rules and prize pools",
    },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            О платформе
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The ultimate competitive platform for Valorant players in the CIS region
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="group p-6 rounded-lg border border-border bg-background hover:border-primary/50 hover:shadow-glow-primary transition-all duration-300"
              >
                <div className="mb-4 w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow-primary group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg">
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
