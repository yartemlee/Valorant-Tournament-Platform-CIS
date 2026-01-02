import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  LogOut,
  Trash2,
  Gamepad2,
  Loader2,
  Users,
  Shield,
  Mic,
  RefreshCw,
  Check,
  X,
  Lock,
  Pencil,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { LobbyPlayerCard } from './LobbyPlayerCard';
import { EditLobbyDialog } from './EditLobbyDialog';
import { JoinRequestCard } from './JoinRequestCard';
import { useDesktopStatus } from '@/hooks/useDesktopStatus';
import { useLFGLobbies, useLobbyRequests, type LFGLobbyWithMembers } from '@/hooks/useLFGLobbies';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LobbyViewProps {
  lobby: LFGLobbyWithMembers;
  isOwner: boolean;
  onBack: () => void;
}

const GAME_MODE_LABELS: Record<string, string> = {
  competitive: 'Рейтинговый',
  unrated: 'Без рейтинга',
  spike_rush: 'Спайк-раш',
  deathmatch: 'Десматч',
  swiftplay: 'Свифтплей',
  custom: 'Кастом',
};



export function LobbyView({ lobby, isOwner, onBack }: LobbyViewProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isJoiningParty, setIsJoiningParty] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState(lobby.party_code || '');

  const [currentPartyCode, setCurrentPartyCode] = useState(lobby.party_code || '');

  const { isConnected, isValorantRunning } = useDesktopStatus();
  const { leaveLobby, updateLobbyPartyCode, updateLobby, handleRequest } = useLFGLobbies();
  const { requests: lobbyRequests } = useLobbyRequests(
    isOwner && lobby.is_private ? lobby.id : undefined
  );
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const [isDesktopAvailable, setIsDesktopAvailable] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      const available = typeof window !== 'undefined' && typeof window.lfgApi !== 'undefined';
      setIsDesktopAvailable(available);
    };
    checkDesktop();
    const timeout = setTimeout(checkDesktop, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const isDesktopReady = isDesktopAvailable && (isConnected || isValorantRunning || isDesktopAvailable);

  useEffect(() => {
    const channel = supabase
      .channel(`lobby-${lobby.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lfg_lobbies',
          filter: `id=eq.${lobby.id}`,
        },
        (payload) => {
          const newPartyCode = (payload.new as { party_code?: string })?.party_code;
          if (newPartyCode !== undefined) {
            setCurrentPartyCode(newPartyCode || '');
            setEditedCode(newPartyCode || '');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobby.id]);

  useEffect(() => {
    setCurrentPartyCode(lobby.party_code || '');
    setEditedCode(lobby.party_code || '');
  }, [lobby.party_code]);

  const handleCopyPartyCode = () => {
    if (currentPartyCode) {
      navigator.clipboard.writeText(currentPartyCode);
      toast.success('Код скопирован');
    }
  };

  const handleGenerateCode = async () => {
    if (!isDesktopReady) {
      toast.error('Запустите ValoHub Desktop и Valorant');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const lfgApi = window.lfgApi;
      if (lfgApi?.generatePartyCode) {
        const result = await lfgApi.generatePartyCode();
        if (result.success && result.code) {
          await updateLobbyPartyCode?.mutateAsync({
            lobbyId: lobby.id,
            partyCode: result.code,
          });
          toast.success('Код сгенерирован и сохранён');
        } else {
          toast.error(result.error || 'Ошибка генерации кода');
        }
      } else {
        toast.error('API недоступен');
      }
    } catch {
      toast.error('Ошибка генерации кода');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSaveCode = async () => {
    if (!editedCode.trim()) {
      toast.error('Введите код');
      return;
    }

    try {
      await updateLobbyPartyCode?.mutateAsync({
        lobbyId: lobby.id,
        partyCode: editedCode.trim(),
      });
      setIsEditingCode(false);
      toast.success('Код сохранён');
    } catch {
      toast.error('Ошибка сохранения кода');
    }
  };

  const handleJoinParty = async () => {
    if (!currentPartyCode) {
      toast.error('Party code недоступен');
      return;
    }

    if (!isDesktopReady) {
      toast.error('Запустите ValoHub Desktop и Valorant');
      return;
    }

    setIsJoiningParty(true);
    try {
      const lfgApi = window.lfgApi;
      if (lfgApi) {
        const result = await lfgApi.joinPartyByCode(currentPartyCode);
        if (result.success) {
          toast.success('Вы присоединились к party!');
        } else {
          toast.error(result.error || 'Ошибка присоединения к party');
        }
      } else {
        toast.error('Запустите ValoHub Desktop');
      }
    } catch {
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
    await leaveLobby.mutateAsync(lobby.id);
    setShowDeleteDialog(false);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Back Button - Above Title */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">К списку лобби</span>
      </Button>

      {/* Header Row: Title Left + Buttons Right */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-foreground break-words overflow-wrap-anywhere flex-1 min-w-0">
          {lobby.title}
        </h1>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {isOwner && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={() => setShowEditDialog(true)}
            >
              <Pencil className="h-4 w-4" />
              Редактировать
            </Button>
          )}
          {isOwner ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Удалить лобби
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeaveDialog(true)}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Покинуть
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Info (larger) + Invite Code (smaller) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Block: Lobby Info - Takes 2 columns */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border">
          {/* Description */}
          {lobby.description && (
            <div className="mb-5">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Описание</span>
              <p className="text-sm text-foreground mt-1 break-words overflow-wrap-anywhere">{lobby.description}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Game Mode */}
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                Режим
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {GAME_MODE_LABELS[lobby.game_mode] || lobby.game_mode}
              </p>
            </div>

            {/* Voice */}
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                <Mic className="h-3 w-3" />
                Голосовой чат
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {lobby.voice_required ? 'Обязателен' : 'Не требуется'}
              </p>
            </div>

            {/* Private */}
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Приватное
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {lobby.is_private ? 'Да' : 'Нет'}
              </p>
            </div>

            {/* Rank Range */}
            <div className="p-3 rounded-lg bg-muted/50">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Ранг
              </span>
              <p className="text-sm font-semibold text-foreground mt-1">
                {lobby.min_rank && lobby.max_rank
                  ? `${lobby.min_rank} — ${lobby.max_rank}`
                  : lobby.min_rank
                    ? `от ${lobby.min_rank}`
                    : lobby.max_rank
                      ? `до ${lobby.max_rank}`
                      : 'Любой'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Block: Invite Code - Compact */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="mb-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
              Код приглашения
            </span>
          </div>

          {isEditingCode && isOwner ? (
            <div className="flex items-center gap-2 mb-3">
              <Input
                value={editedCode}
                onChange={(e) => {
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 6);
                  setEditedCode(value);
                }}
                placeholder="Введите код"
                className="font-mono uppercase text-lg tracking-widest text-center"
                maxLength={6}
              />
              <Button size="icon" variant="ghost" onClick={handleSaveCode} className="text-green-500 hover:text-green-400 h-8 w-8">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingCode(false)} className="text-red-500 hover:text-red-400 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg font-mono text-lg tracking-widest text-center',
                  'bg-muted border border-border',
                  currentPartyCode ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {currentPartyCode || '—'}
              </div>
              {currentPartyCode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyPartyCode}
                  title="Скопировать код"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-2"
                onClick={() => setIsEditingCode(true)}
              >
                <Pencil className="h-4 w-4" />
                Редактировать код
              </Button>
            )}
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode || !isDesktopReady}
              >
                {isGeneratingCode ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Сгенерировать код
              </Button>
            )}
            {!isOwner && currentPartyCode && (
              <Button
                size="sm"
                className="w-full gap-2"
                onClick={handleJoinParty}
                disabled={isJoiningParty || !isDesktopReady}
              >
                {isJoiningParty ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gamepad2 className="h-4 w-4" />
                )}
                {isJoiningParty ? 'Присоединение...' : 'Войти в Party'}
              </Button>
            )}
          </div>

          {!isDesktopReady && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Запустите ValoHub Desktop
            </p>
          )}
        </div>
      </div>

      {/* Participants Section */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2 uppercase tracking-wide text-foreground">
          <Users className="h-5 w-5 text-primary" />
          Участники ({lobby.lfg_lobby_members?.length || 0}/{lobby.max_size})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(lobby.lfg_lobby_members || []).map((member) => (
            <LobbyPlayerCard
              key={member.id}
              member={member}
              isOwner={member.user_id === lobby.owner_id}
            />
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, lobby.max_size - (lobby.lfg_lobby_members?.length || 0)) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className={cn(
                'aspect-[3/4] rounded-xl',
                'border-2 border-dashed border-border',
                'flex flex-col items-center justify-center gap-2',
                'bg-muted/30'
              )}
            >
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Пусто</span>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming Requests Section - Only for owner of private lobby */}
      {isOwner && lobby.is_private && lobbyRequests.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2 uppercase tracking-wide text-foreground">
            <Users className="h-5 w-5 text-yellow-500" />
            Входящие заявки ({lobbyRequests.length})
          </h3>

          <div className="space-y-3">
            {lobbyRequests.map((request) => (
              <JoinRequestCard
                key={request.id}
                request={request}
                onAccept={async (requestId) => {
                  setProcessingRequestId(requestId);
                  try {
                    await handleRequest.mutateAsync({ requestId, action: 'accept' });
                  } finally {
                    setProcessingRequestId(null);
                  }
                }}
                onReject={async (requestId) => {
                  setProcessingRequestId(requestId);
                  try {
                    await handleRequest.mutateAsync({ requestId, action: 'reject' });
                  } finally {
                    setProcessingRequestId(null);
                  }
                }}
                isProcessing={processingRequestId === request.id}
              />
            ))}
          </div>
        </div>
      )}

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

      {/* Edit Dialog */}
      <EditLobbyDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        lobby={lobby}
        onSubmit={async (values) => {
          await updateLobby.mutateAsync(values);
        }}
      />
    </div>
  );
}
