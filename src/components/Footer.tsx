import { MessageCircle, Youtube, Twitch } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              VTP CIS
            </div>
            <p className="text-muted-foreground text-sm">
              Платформа для проведения любительских и полупрофессиональных турниров по Valorant в СНГ.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#tournaments" className="text-muted-foreground hover:text-accent transition-colors">
                  Tournaments
                </a>
              </li>
              <li>
                <a href="#leaderboard" className="text-muted-foreground hover:text-accent transition-colors">
                  Leaderboard
                </a>
              </li>
              <li>
                <a href="#faq" className="text-muted-foreground hover:text-accent transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 Valorant Tournament Platform CIS. All rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label="Discord"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label="Twitch"
            >
              <Twitch className="h-5 w-5" />
            </a>
            <a 
              href="#" 
              className="text-muted-foreground hover:text-accent transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
