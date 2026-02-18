import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    dateOfBirth: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateAge = (dateStr: string): boolean => {
    const birthDate = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 16;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Необходимо принять правила платформы");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(formData.username)) {
      toast.error("Юзернейм: 3-16 символов (латиница, цифры, _)");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (!formData.dateOfBirth || !validateAge(formData.dateOfBirth)) {
      toast.error("Регистрация доступна только с 16 лет");
      return;
    }

    setLoading(true);

    try {
      // Check username uniqueness
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", formData.username)
        .maybeSingle();

      if (existingUser) {
        toast.error("Этот юзернейм уже занят");
        setLoading(false);
        return;
      }

      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { username: formData.username },
        },
      });

      if (signUpError) {
        toast.error(signUpError.message);
        return;
      }

      const userId = signUpData.user?.id;
      if (!userId) {
        toast.error("Ошибка создания аккаунта");
        return;
      }

      toast.success("Регистрация успешна! Добро пожаловать в ValoHub!");
      navigate("/");
    } catch {
      toast.error("Произошла ошибка при регистрации");
    } finally {
      setLoading(false);
    }
  };

  const maxBirthDate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 16)
  )
    .toISOString()
    .split("T")[0];

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-4 py-8">
      <div className="w-full max-w-lg animate-fade-in-up">
        <div className="glass rounded-2xl p-8 shadow-card border border-border/50">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-display font-bold tracking-tight mb-1">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Создать аккаунт
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Зарегистрируйся и присоединяйся к турнирам
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Username & Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
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
                  autoComplete="username"
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
                  max={maxBirthDate}
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label
                htmlFor="terms"
                className="text-sm font-normal cursor-pointer leading-tight"
              >
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

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loading || !agreedToTerms}
              variant="hero"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {loading ? "Регистрация..." : "Создать аккаунт"}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Уже есть аккаунт?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
