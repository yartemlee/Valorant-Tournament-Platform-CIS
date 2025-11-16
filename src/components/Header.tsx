import { Button } from "@/components/ui/button";
import { Trophy, Users, MessageCircle, HelpCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              VALHUB
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#tournaments" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Tournaments
              </span>
            </a>
            <a href="#leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Leaderboard
            </a>
            <a href="#community" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Community
              </span>
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">Login</Button>
            <Button variant="hero" size="sm">Register</Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
