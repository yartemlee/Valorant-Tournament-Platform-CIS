import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Chrome, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    country: "",
    countryCode: "",
    phone: "",
    dateOfBirth: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithDiscord } = useAuth();

  const countries = [
    // СНГ страны
    { name: "Россия", code: "+7" },
    { name: "Азербайджан", code: "+994" },
    { name: "Армения", code: "+374" },
    { name: "Беларусь", code: "+375" },
    { name: "Грузия", code: "+995" },
    { name: "Казахстан", code: "+7" },
    { name: "Кыргызстан", code: "+996" },
    { name: "Молдова", code: "+373" },
    { name: "Таджикистан", code: "+992" },
    { name: "Туркменистан", code: "+993" },
    { name: "Узбекистан", code: "+998" },
    { name: "Украина", code: "+380" },
    // Остальные страны по алфавиту
    { name: "Австралия", code: "+61" },
    { name: "Австрия", code: "+43" },
    { name: "Албания", code: "+355" },
    { name: "Алжир", code: "+213" },
    { name: "Ангола", code: "+244" },
    { name: "Андорра", code: "+376" },
    { name: "Аргентина", code: "+54" },
    { name: "Афганистан", code: "+93" },
    { name: "Багамы", code: "+1-242" },
    { name: "Бангладеш", code: "+880" },
    { name: "Барбадос", code: "+1-246" },
    { name: "Бахрейн", code: "+973" },
    { name: "Белиз", code: "+501" },
    { name: "Бельгия", code: "+32" },
    { name: "Бенин", code: "+229" },
    { name: "Болгария", code: "+359" },
    { name: "Боливия", code: "+591" },
    { name: "Босния и Герцеговина", code: "+387" },
    { name: "Ботсвана", code: "+267" },
    { name: "Бразилия", code: "+55" },
    { name: "Бруней", code: "+673" },
    { name: "Буркина-Фасо", code: "+226" },
    { name: "Бурundi", code: "+257" },
    { name: "Бутан", code: "+975" },
    { name: "Вануату", code: "+678" },
    { name: "Ватикан", code: "+379" },
    { name: "Великобритания", code: "+44" },
    { name: "Венгрия", code: "+36" },
    { name: "Венесуэла", code: "+58" },
    { name: "Вьетнам", code: "+84" },
    { name: "Габон", code: "+241" },
    { name: "Гаити", code: "+509" },
    { name: "Гайана", code: "+592" },
    { name: "Гамбия", code: "+220" },
    { name: "Гана", code: "+233" },
    { name: "Гватемала", code: "+502" },
    { name: "Гвинея", code: "+224" },
    { name: "Гвинея-Бисау", code: "+245" },
    { name: "Германия", code: "+49" },
    { name: "Гондурас", code: "+504" },
    { name: "Гренада", code: "+1-473" },
    { name: "Греция", code: "+30" },
    { name: "Дания", code: "+45" },
    { name: "Джибути", code: "+253" },
    { name: "Доминика", code: "+1-767" },
    { name: "Доминиканская Республика", code: "+1-809" },
    { name: "Египет", code: "+20" },
    { name: "Замбия", code: "+260" },
    { name: "Зимбабве", code: "+263" },
    { name: "Израиль", code: "+972" },
    { name: "Индия", code: "+91" },
    { name: "Индонезия", code: "+62" },
    { name: "Иордания", code: "+962" },
    { name: "Ирак", code: "+964" },
    { name: "Иран", code: "+98" },
    { name: "Ирландия", code: "+353" },
    { name: "Исландия", code: "+354" },
    { name: "Испания", code: "+34" },
    { name: "Италия", code: "+39" },
    { name: "Йемен", code: "+967" },
    { name: "Кабо-Верде", code: "+238" },
    { name: "Камбоджа", code: "+855" },
    { name: "Камерун", code: "+237" },
    { name: "Канада", code: "+1" },
    { name: "Катар", code: "+974" },
    { name: "Кения", code: "+254" },
    { name: "Кипр", code: "+357" },
    { name: "Китай", code: "+86" },
    { name: "Колумбия", code: "+57" },
    { name: "Коморы", code: "+269" },
    { name: "Конго", code: "+242" },
    { name: "Корея Северная", code: "+850" },
    { name: "Корея Южная", code: "+82" },
    { name: "Коста-Рика", code: "+506" },
    { name: "Кот-д'Ивуар", code: "+225" },
    { name: "Куба", code: "+53" },
    { name: "Кувейт", code: "+965" },
    { name: "Лаос", code: "+856" },
    { name: "Латвия", code: "+371" },
    { name: "Лесото", code: "+266" },
    { name: "Либерия", code: "+231" },
    { name: "Ливан", code: "+961" },
    { name: "Ливия", code: "+218" },
    { name: "Литва", code: "+370" },
    { name: "Лихтенштейн", code: "+423" },
    { name: "Люксембург", code: "+352" },
    { name: "Маврикий", code: "+230" },
    { name: "Мавритания", code: "+222" },
    { name: "Мадагаскар", code: "+261" },
    { name: "Малави", code: "+265" },
    { name: "Малайзия", code: "+60" },
    { name: "Мали", code: "+223" },
    { name: "Мальдивы", code: "+960" },
    { name: "Мальта", code: "+356" },
    { name: "Марокко", code: "+212" },
    { name: "Мексика", code: "+52" },
    { name: "Мозамбик", code: "+258" },
    { name: "Монако", code: "+377" },
    { name: "Монголия", code: "+976" },
    { name: "Мьянма", code: "+95" },
    { name: "Намибия", code: "+264" },
    { name: "Непал", code: "+977" },
    { name: "Нигер", code: "+227" },
    { name: "Нигерия", code: "+234" },
    { name: "Нидерланды", code: "+31" },
    { name: "Никарагуа", code: "+505" },
    { name: "Новая Зеландия", code: "+64" },
    { name: "Норвегия", code: "+47" },
    { name: "ОАЭ", code: "+971" },
    { name: "Оман", code: "+968" },
    { name: "Пакистан", code: "+92" },
    { name: "Палау", code: "+680" },
    { name: "Панама", code: "+507" },
    { name: "Папуа - Новая Гвинея", code: "+675" },
    { name: "Парагвай", code: "+595" },
    { name: "Перу", code: "+51" },
    { name: "Польша", code: "+48" },
    { name: "Португалия", code: "+351" },
    { name: "Руанда", code: "+250" },
    { name: "Румыния", code: "+40" },
    { name: "Сальвадор", code: "+503" },
    { name: "Самоа", code: "+685" },
    { name: "Сан-Марино", code: "+378" },
    { name: "Сан-Томе и Принсипи", code: "+239" },
    { name: "Саудовская Аравия", code: "+966" },
    { name: "Северная Македония", code: "+389" },
    { name: "Сейшелы", code: "+248" },
    { name: "Сенегал", code: "+221" },
    { name: "Сербия", code: "+381" },
    { name: "Сингапур", code: "+65" },
    { name: "Сирия", code: "+963" },
    { name: "Словакия", code: "+421" },
    { name: "Словения", code: "+386" },
    { name: "Соломоновы Острова", code: "+677" },
    { name: "Сомали", code: "+252" },
    { name: "Судан", code: "+249" },
    { name: "Суринам", code: "+597" },
    { name: "США", code: "+1" },
    { name: "Сьерра-Леоне", code: "+232" },
    { name: "Таиланд", code: "+66" },
    { name: "Танзания", code: "+255" },
    { name: "Того", code: "+228" },
    { name: "Тонга", code: "+676" },
    { name: "Тринидад и Тобаго", code: "+1-868" },
    { name: "Тувалу", code: "+688" },
    { name: "Тунис", code: "+216" },
    { name: "Турция", code: "+90" },
    { name: "Уганда", code: "+256" },
    { name: "Уругвай", code: "+598" },
    { name: "Фиджи", code: "+679" },
    { name: "Филиппины", code: "+63" },
    { name: "Финляндия", code: "+358" },
    { name: "Франция", code: "+33" },
    { name: "Хорватия", code: "+385" },
    { name: "ЦАР", code: "+236" },
    { name: "Чад", code: "+235" },
    { name: "Черногория", code: "+382" },
    { name: "Чехия", code: "+420" },
    { name: "Чили", code: "+56" },
    { name: "Швейцария", code: "+41" },
    { name: "Швеция", code: "+46" },
    { name: "Шри-Ланка", code: "+94" },
    { name: "Эквадор", code: "+593" },
    { name: "Экваториальная Гвинея", code: "+240" },
    { name: "Эритрея", code: "+291" },
    { name: "Эсватини", code: "+268" },
    { name: "Эстония", code: "+372" },
    { name: "Эфиопия", code: "+251" },
    { name: "ЮАР", code: "+27" },
    { name: "Южный Судан", code: "+211" },
    { name: "Ямайка", code: "+1-876" },
    { name: "Япония", code: "+81" },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

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

    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 16) {
        toast.error("Регистрация доступна только с 16 лет");
        return;
      }
    }

    setLoading(true);

    const fullPhoneNumber = formData.phone 
      ? `${formData.countryCode}${formData.phone}`
      : null;

    const success = await signUp(
      formData.email,
      formData.password,
      formData.username,
      {
        full_name: formData.fullName,
        country: formData.country,
        phone_number: fullPhoneNumber,
        date_of_birth: formData.dateOfBirth,
        newsletter_subscribed: newsletter,
      }
    );

    setLoading(false);

    if (success) {
      if (formData.country || fullPhoneNumber || formData.dateOfBirth) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({
              country: formData.country || null,
              phone_number: fullPhoneNumber,
              date_of_birth: formData.dateOfBirth || null,
              newsletter_subscribed: newsletter,
            })
            .eq("id", user.id);
        }
      }
      navigate("/");
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleDiscordSignup = async () => {
    setLoading(true);
    await signInWithDiscord();
    setLoading(false);
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
          <div className="space-y-3 mb-6">
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
          </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Страна</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => {
                    const selectedCountry = countries.find(c => c.name === value);
                    setFormData({ 
                      ...formData, 
                      country: value,
                      countryCode: selectedCountry?.code || ""
                    });
                  }}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.name} value={country.name}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Номер телефона</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 h-10 rounded-md border border-input bg-muted text-muted-foreground min-w-[70px]">
                    {formData.countryCode || "+X"}
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>
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
