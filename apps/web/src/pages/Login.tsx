import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    try {
      let loginEmail = email;

      // Allow login by username (resolve to email via RPC)
      if (!email.includes("@")) {
        const { data: emailData, error: emailError } = await supabase.rpc(
          "get_email_by_username",
          { username_input: email }
        );

        if (emailError || !emailData) {
          toast.error("Пользователь с таким никнеймом не найден");
          setLoading(false);
          return;
        }

        loginEmail = emailData;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Неверный email/username или пароль");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Добро пожаловать!");
      navigate("/");
    } catch {
      toast.error("Произошла ошибка при входе");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="glass rounded-2xl p-8 shadow-card border border-border/50">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                ValoHub
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Войди, чтобы продолжить
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email или Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="email@example.com или username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Забыли пароль?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !email || !password}
              variant="hero"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>

          {/* Signup link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Нет аккаунта?{" "}
            <Link
              to="/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Создать аккаунт
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
