import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  RefreshCw,
  Unlink,
  AlertTriangle,
  Gamepad2,
  Loader2,
} from 'lucide-react';
import { useRiotAccount } from '@/hooks/useRiotAccount';
import { RankBadge } from '@/components/profile/RankBadge';
import { FEATURES } from '@/config/features';
import { toast } from 'sonner';

export function RiotAccountSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    riotAccount,
    linkStatus,
    rankInfo,
    isLoading,
    initLink,
    syncRank,
    unlink,
    isSyncing,
    isUnlinking,
  } = useRiotAccount();

  // Handle URL params from OAuth callback
  useEffect(() => {
    const riotLinked = searchParams.get('riot_linked');
    const riotError = searchParams.get('riot_error');

    if (riotLinked === 'true') {
      toast.success('Riot аккаунт успешно привязан!');
      // Clean URL
      searchParams.delete('riot_linked');
      setSearchParams(searchParams, { replace: true });
    }

    if (riotError) {
      toast.error(`Ошибка привязки: ${riotError}`);
      searchParams.delete('riot_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Feature not enabled
  if (!FEATURES.RSO_ENABLED) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Riot Sign On
          </CardTitle>
          <CardDescription>Верификация аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Функция верификации через Riot временно недоступна
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Riot Sign On
          </CardTitle>
          <CardDescription>Верификация аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  // Not linked state
  if (linkStatus === 'not_linked') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Riot Sign On
          </CardTitle>
          <CardDescription>Верификация аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Привяжите ваш Riot аккаунт для подтверждения личности и отображения официального ранга.
            Это необходимо для участия в турнирах с верифицированными игроками.
          </p>

          {FEATURES.RSO_DEMO_MODE && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
              <strong>Demo режим:</strong> Будет создан тестовый аккаунт с случайным рангом
            </div>
          )}

          <Button
            onClick={() => initLink()}
            className="w-full gap-2"
          >
            <Gamepad2 className="h-4 w-4" />
            Войти через Riot Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Verified state
  if (linkStatus === 'verified' && riotAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Riot Sign On
          </CardTitle>
          <CardDescription>Верификация аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Verified badge */}
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-semibold">Аккаунт подтверждён</span>
          </div>

          {/* Riot ID and Rank */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Riot ID</span>
              <p className="font-medium">
                {riotAccount.riot_id_name}#{riotAccount.riot_id_tag}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Официальный ранг</span>
              <div>
                {rankInfo ? (
                  <RankBadge rank={rankInfo.rank} isVerified size="sm" />
                ) : (
                  <span className="text-muted-foreground">Нет данных</span>
                )}
              </div>
            </div>
          </div>

          {/* Rank sync info */}
          {rankInfo?.expiresAt && (
            <p className="text-xs text-muted-foreground">
              {rankInfo.cached
                ? `Данные обновятся: ${new Date(rankInfo.expiresAt).toLocaleString('ru-RU')}`
                : 'Данные актуальны'}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncRank()}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Обновить ранг
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Вы уверены, что хотите отвязать Riot аккаунт?')) {
                  unlink();
                }
              }}
              disabled={isUnlinking}
              className="text-destructive hover:text-destructive"
            >
              {isUnlinking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Unlink className="h-4 w-4 mr-2" />
              )}
              Отвязать
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expired/revoked state
  if (linkStatus === 'expired' || linkStatus === 'revoked') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Riot Sign On
          </CardTitle>
          <CardDescription>Верификация аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              {linkStatus === 'expired'
                ? 'Сессия истекла'
                : 'Доступ отозван'}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Необходимо повторно авторизоваться через Riot Games.
          </p>

          <Button
            onClick={() => initLink()}
            className="w-full gap-2"
          >
            <Gamepad2 className="h-4 w-4" />
            Повторить авторизацию
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Error or unknown state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5" />
          Riot Sign On
        </CardTitle>
        <CardDescription>Верификация аккаунта Valorant</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">Произошла ошибка. Попробуйте позже.</span>
        </div>
      </CardContent>
    </Card>
  );
}
