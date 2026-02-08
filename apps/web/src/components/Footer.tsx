import { MessageCircle, Youtube, Twitch } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              ValoHub
            </div>
            <p className="text-muted-foreground text-sm">
              Платформа для проведения любительских и полупрофессиональных турниров по Valorant в СНГ.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Навигация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tournaments" className="text-muted-foreground hover:text-accent transition-colors">
                  Турниры
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-muted-foreground hover:text-accent transition-colors">
                  Команды
                </Link>
              </li>
              <li>
                <Link to="/free-agents" className="text-muted-foreground hover:text-accent transition-colors">
                  Свободные агенты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Правовая информация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-accent transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-accent transition-colors">
                  Условия использования
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Riot Games Disclaimer */}
        <div className="border-t border-border pt-6 mb-6">
          <p className="text-xs text-muted-foreground/70 leading-relaxed text-center">
            ValoHub не аффилирован с Riot Games, Inc. или VALORANT Esports.
            Riot Games, VALORANT и все связанные логотипы являются товарными знаками
            или зарегистрированными товарными знаками Riot Games, Inc.
          </p>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ValoHub. Все права защищены.
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
