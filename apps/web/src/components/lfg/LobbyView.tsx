import { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  LogOut,
  Trash2,
  Gamepad2,
  Loader2,
} from 'lucide-react';

// Type for LFG API exposed by Electron preload
interface LFGApiResult {
  success: boolean;
  error?: string;
}

interface LFGApi {
  joinPartyByCode: (code: string) => Promise<LFGApiResult>;
}

declare global {
  interface Window {
    lfgApi?: LFGApi;
  }
}
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LobbyChat } from './LobbyChat';
import { LobbyMembers } from './LobbyMembers';
import { useDesktopStatus } from '@/hooks/useDesktopStatus';
import { useLFGLobbies, type LFGLobbyWithMembers } from '@/hooks/useLFGLobbies';
import { toast } from 'sonner';

interface LobbyViewProps {
  lobby: LFGLobbyWithMembers;
  isOwner: boolean;
  onBack: () => void;
}

const GAME_MODE_LABELS: Record<string, string> = {
  competitive: 'Рейтинговый',
  unrated: 'Обычный',
  spike_rush: 'Spike Rush',
  deathmatch: 'Deathmatch',
  swiftplay: 'Swiftplay',
  custom: 'Кастом',
};

export function LobbyView({ lobby, isOwner, onBack }: LobbyViewProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isJoiningParty, setIsJoiningParty] = useState(false);

  const { status: desktopStatus, isConnected, isValorantRunning } = useDesktopStatus();
  const { leaveLobby } = useLFGLobbies();

  const handleCopyPartyCode = () => {
    if (lobby.party_code) {
      navigator.clipboard.writeText(lobby.party_code);
      toast.success('Код скопирован');
    }
  };

  const handleJoinParty = async () => {
    if (!lobby.party_code) {
      toast.error('Party code недоступен');
      return;
    }

    if (!isConnected || !isValorantRunning) {
      toast.error('Запустите Valorant и лаунчер ValoHub');
      return;
    }

    setIsJoiningParty(true);
    try {
      // This will be called via Electron IPC when running in desktop app
      const lfgApi = window.lfgApi;
      if (lfgApi) {
        const result = await lfgApi.joinPartyByCode(lobby.party_code);
        if (result.success) {
          toast.success('Вы присоединились к party!');
        } else {
          toast.error(result.error || 'Ошибка присоединения к party');
        }
      } else {
        toast.error('Запустите ValoHub Desktop для авто-присоединения');
      }
    } catch (error) {
      toast.error('Ошибка присоединения к party');
    } finally {
      setIsJoiningParty(false);
    }
  };

  const handleLeave = async () => {
    await leaveLobby.mutateAsync(lobby.id);
    setShowLeaveDialog(false);
    onBack();
  };

  const handleDelete = async () => {
    await leaveLobby.mutateAsync(lobby.id); // Owner leaving = delete
    setShowDeleteDialog(false);
    onBack();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{lobby.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">
                {GAME_MODE_LABELS[lobby.game_mode] || lobby.game_mode}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {lobby.current_size}/{lobby.max_size} игроков
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveDialog(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Покинуть
            </Button>
          )}
        </div>
      </div>

      {/* Description & Discord */}
      {(lobby.description || lobby.discord_link) && (
        <Card>
          <CardContent className="pt-4">
            {lobby.description && (
              <p className="text-muted-foreground">{lobby.description}</p>
            )}
            {lobby.discord_link && (
              <a
                href={lobby.discord_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-4 w-4" />
                Discord
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Party Code & Join */}
      {lobby.party_code && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Party Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-lg">
                {lobby.party_code}
              </code>
              <Button variant="outline" size="icon" onClick={handleCopyPartyCode}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleJoinParty}
                disabled={isJoiningParty || !isConnected || !isValorantRunning}
              >
                {isJoiningParty ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gamepad2 className="h-4 w-4 mr-2" />
                )}
                {isJoiningParty ? 'Присоединение...' : 'Auto Join'}
              </Button>
            </div>
            {(!isConnected || !isValorantRunning) && (
              <p className="text-xs text-muted-foreground mt-2">
                Запустите ValoHub Desktop и Valorant для авто-присоединения
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Members */}
        <div className="md:col-span-1">
          <LobbyMembers
            members={lobby.lfg_lobby_members || []}
            ownerId={lobby.owner_id}
            isOwner={isOwner}
            partyCode={lobby.party_code}
          />
        </div>

        {/* Chat */}
        <div className="md:col-span-2">
          <Card className="h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Чат лобби</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-60px)] p-0">
              <LobbyChat lobbyId={lobby.id} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Покинуть лобби?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите покинуть это лобби?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave}>Покинуть</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лобби?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лобби будет удалено, а все участники
              будут исключены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
