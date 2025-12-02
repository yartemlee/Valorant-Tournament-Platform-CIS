import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Chrome, MessageCircle } from "lucide-react";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    dateOfBirth: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!agreedToTerms) {
      toast.error("Необходимо принять правила платформы");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Пароль должен содержать минимум 8 символов");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(formData.username)) {
      toast.error("Юзернейм должен содержать 3-16 символов (латиница, цифры, _)");
      return;
    }

    // Check age
    const birthDate = new Date(formData.dateOfBirth);
    const age = new Date().getFullYear() - birthDate.getFullYear();
    if (age < 16) {
      toast.error("Регистрация доступна только с 16 лет");
      return;
    }

    setLoading(true);

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", formData.username)
      .single();

    if (existingUser) {
      toast.error("Этот юзернейм уже занят");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: formData.username,
            full_name: formData.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Email уже зарегистрирован");
        } else if (error.message.includes("duplicate key")) {
          toast.error("Этот юзернейм уже занят");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Аккаунт создан! Добро пожаловать в ValoHub!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error("Ошибка регистрации через Google");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordSignup = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast.error("Ошибка регистрации через Discord");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Создать аккаунт
            </h1>
            <p className="text-muted-foreground">
              Присоединяйся к СНГ-хабу Valorant
            </p>
          </div>

          {/* OAuth Buttons */}
          {/* <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <Chrome className="mr-2 h-5 w-5" />
              Регистрация через Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleDiscordSignup}
              disabled={loading}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Регистрация через Discord
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground">или</span>
            </div>
          </div> */}

          {/* Registration Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Юзернейм *</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username123"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={loading}
                  pattern="[a-zA-Z0-9_]{3,16}"
                  title="3-16 символов, латиница, цифры, _"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтверждение пароля *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Повторите пароль"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Имя и Фамилия</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Иван Иванов"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Дата рождения * (16+)</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  disabled={loading}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                    .toISOString()
                    .split("T")[0]}
                />
              </div>
            </div>

            {/* Terms and Newsletter */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  required
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
                  Мне 16+ и я принимаю{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Правила платформы
                  </Link>{" "}
                  и{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Политику конфиденциальности
                  </Link>
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletter}
                  onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                />
                <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer">
                  Получать новости о турнирах и обновлениях
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading || !agreedToTerms}
              variant="hero"
            >
              {loading ? "Создание аккаунта..." : "Создать аккаунт"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
