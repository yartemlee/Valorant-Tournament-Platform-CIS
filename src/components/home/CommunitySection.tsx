// @deprecated This component is currently unused.
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Users } from "lucide-react";

const CommunitySection = () => {
  return (
    <section id="community" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-2 border-accent/30 bg-gradient-to-br from-card to-card/50 shadow-glow-accent overflow-hidden">
          <div className="relative p-12 text-center">
            <div className="absolute inset-0 bg-gradient-accent opacity-5"></div>

            <div className="relative z-10">
              <MessageCircle className="h-16 w-16 text-accent mx-auto mb-6" />

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                💬 Join Our Discord Community
              </h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Find teammates, get tournament updates, and chat with other Valorant players from across the CIS region.
              </p>

              <div className="flex items-center justify-center gap-2 mb-8">
                <Users className="h-5 w-5 text-accent" />
                <span className="text-accent font-bold text-lg">Online now: 237 players</span>
              </div>

              <Button variant="hero" size="xl" className="shadow-glow-accent">
                Join Discord
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CommunitySection;
