import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Chrome, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, signInWithDiscord } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await signIn(email, password);

    setLoading(false);

    if (success) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/");
      }
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleDiscordLogin = async () => {
    setLoading(true);
    await signInWithDiscord();
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Вход в VALHUB
        </h1>
        <p className="text-muted-foreground">
          Присоединяйся к киберспортивному сообществу
        </p>
      </div>

      <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <Chrome className="mr-2 h-5 w-5" />
          Войти через Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base"
          onClick={handleDiscordLogin}
          disabled={loading}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Войти через Discord
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">или</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email или никнейм</Label>
          <Input
            id="email"
            type="text"
            placeholder="Введите почту или никнейм"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="h-12"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              Запомнить меня
            </Label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Забыли пароль?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={loading}
          variant="hero"
        >
          {loading ? "Вход..." : "Войти"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;

