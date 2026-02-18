import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Unlink,
  AlertTriangle,
  Gamepad2,
  Loader2,
} from 'lucide-react';
import { useRiotAccount } from '@/hooks/useRiotAccount';
import { toast } from 'sonner';
import type { Profile } from '@/types/common.types';

interface RiotAccountSectionProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
}

export function RiotAccountSection({ profile, onProfileUpdate }: RiotAccountSectionProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    riotAccount,
    linkStatus,
    isLoading,
    linkDemo,
    unlink,
    isLinking,
    isUnlinking,
  } = useRiotAccount();

  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [riotIdInput, setRiotIdInput] = useState('');

  const isValidRiotId = /^.+#.+$/.test(riotIdInput.trim());

  const handleDemoLink = async () => {
    const trimmed = riotIdInput.trim();
    const hashIndex = trimmed.indexOf('#');
    const gameName = trimmed.slice(0, hashIndex);
    const tagLine = trimmed.slice(hashIndex + 1);

    await linkDemo(gameName, tagLine);
    onProfileUpdate({
      ...profile,
      riot_id: `${gameName}#${tagLine}`,
      riot_id_name: gameName,
      riot_id_tag: tagLine,
      riot_verified: true,
      riot_verified_at: new Date().toISOString(),
    });
    setDemoDialogOpen(false);
    setRiotIdInput('');
  };

  // Handle URL params from OAuth callback
  useEffect(() => {
    const riotLinked = searchParams.get('riot_linked');
    const riotError = searchParams.get('riot_error');

    if (riotLinked === 'true') {
      toast.success('Riot аккаунт успешно привязан!');
      searchParams.delete('riot_linked');
      setSearchParams(searchParams, { replace: true });
    }

    if (riotError) {
      toast.error(`Ошибка привязки: ${riotError}`);
      searchParams.delete('riot_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Riot Sign On
            </CardTitle>
            <CardDescription>Привязка аккаунта Valorant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      );
    }

    if (linkStatus === 'not_linked') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Riot Sign On
            </CardTitle>
            <CardDescription>Привязка аккаунта Valorant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Привяжите ваш Riot аккаунт для подтверждения личности и отображения официального ранга.
              Это необходимо для участия в турнирах с верифицированными игроками.
            </p>

            <Button
              onClick={() => setDemoDialogOpen(true)}
              className="w-full gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Войти через Riot Games
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (linkStatus === 'verified' && riotAccount) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Riot Sign On
            </CardTitle>
            <CardDescription>Привязка аккаунта Valorant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-semibold">Аккаунт привязан</span>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Riot ID</span>
              <p className="font-medium">
                {riotAccount.riot_id_name}#{riotAccount.riot_id_tag}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (confirm('Вы уверены, что хотите отвязать Riot аккаунт?')) {
                  await unlink();
                  onProfileUpdate({
                    ...profile,
                    riot_id: null,
                    riot_id_name: null,
                    riot_id_tag: null,
                    riot_puuid: null,
                    riot_verified: false,
                    riot_verified_at: null,
                    official_rank: null,
                    official_rank_tier: null,
                    rank_last_updated: null,
                  });
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
          </CardContent>
        </Card>
      );
    }

    if (linkStatus === 'expired' || linkStatus === 'revoked') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Riot Sign On
            </CardTitle>
            <CardDescription>Привязка аккаунта Valorant</CardDescription>
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
              onClick={() => setDemoDialogOpen(true)}
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
          <CardDescription>Привязка аккаунта Valorant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">Произошла ошибка. Попробуйте позже.</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {renderContent()}

      <Dialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Привязка Riot аккаунта</DialogTitle>
            <DialogDescription>
              Укажите ваш Riot ID для привязки к профилю
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
            <strong>Demo режим</strong> — в будущем здесь будет авторизация через Riot Sign On (RSO).
            Сейчас вы можете указать свой Riot ID вручную.
          </div>

          <div className="space-y-2">
            <Label htmlFor="riot-id-input">Riot ID</Label>
            <Input
              id="riot-id-input"
              placeholder="Name#Tag"
              value={riotIdInput}
              onChange={(e) => setRiotIdInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Введите ваш Riot ID в формате Name#Tag
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDemoDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleDemoLink}
              disabled={!isValidRiotId || isLinking}
            >
              {isLinking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Привязать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
