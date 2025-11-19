import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Chrome, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, signInWithDiscord } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (formData.password.length < 8) {
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,16}$/.test(formData.username)) {
      return;
    }

    setLoading(true);

    const success = await signUp(
      formData.email,
      formData.password,
      formData.username
    );

    setLoading(false);

    if (success) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
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
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
          Создать аккаунт
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

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="h-12"
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
            className="h-12"
          />
        </div>

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
            className="h-12"
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
            className="h-12"
          />
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              required
            />
            <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
              Мне 16+ и я принимаю{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Правила платформы
              </Link>{' '}
              и{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Политику конфиденциальности
              </Link>
            </Label>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={loading || !agreedToTerms}
          variant="hero"
        >
          {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;

