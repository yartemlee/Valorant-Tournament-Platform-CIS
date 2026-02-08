import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const riotName = searchParams.get("riot_name") || "";
  const { session } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    username: riotName,
    fullName: "",
    dateOfBirth: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      navigate("/login");
    }
  }, [session, navigate]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Необходимо принять правила платформы");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(formData.username)) {
      toast.error(
        "Юзернейм должен содержать 3-16 символов (латиница, цифры, _)"
      );
      return;
    }

    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    if (age < 16) {
      toast.error("Регистрация доступна только с 16 лет");
      return;
    }

    setLoading(true);

    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", formData.username)
        .neq("id", session?.user?.id ?? "")
        .single();

      if (existingUser) {
        toast.error("Этот юзернейм уже занят");
        setLoading(false);
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          full_name: formData.fullName || null,
        })
        .eq("id", session!.user.id);

      if (profileError) {
        toast.error("Ошибка обновления профиля: " + profileError.message);
        return;
      }

      // Update email if provided and different from current
      if (formData.email && formData.email !== session?.user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) {
          console.warn("Email update failed:", emailError.message);
        }
      }

      toast.success("Профиль заполнен! Добро пожаловать в ValoHub!");
      navigate("/");
    } catch {
      toast.error("Произошла ошибка при сохранении профиля");
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh p-4 py-12">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="glass rounded-2xl p-8 shadow-card border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
              Завершение регистрации
            </h1>
            <p className="text-muted-foreground">
              Заполни профиль, чтобы начать играть
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email (для уведомлений)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={loading}
                  pattern="[a-zA-Z0-9_]{3,16}"
                  title="3-16 символов, латиница, цифры, _"
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
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Дата рождения * (16+)</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  required
                  disabled={loading}
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 16)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                />
              </div>
            </div>

            {/* Terms and Newsletter */}
            <div className="space-y-3 pt-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) =>
                    setAgreedToTerms(checked as boolean)
                  }
                  required
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

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletter}
                  onCheckedChange={(checked) =>
                    setNewsletter(checked as boolean)
                  }
                />
                <Label
                  htmlFor="newsletter"
                  className="text-sm font-normal cursor-pointer"
                >
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
              {loading ? "Сохранение..." : "Завершить регистрацию"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
