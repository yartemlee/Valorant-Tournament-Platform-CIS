import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Copy,
  LogOut,
  Trash2,
  Gamepad2,
  Loader2,
  Globe,
  Users,
  Shield,
  Mic,
  RefreshCw,
  Edit2,
  Check,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useDesktopStatus } from '@/hooks/useDesktopStatus';
import { useLFGLobbies, type LFGLobbyWithMembers } from '@/hooks/useLFGLobbies';
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
  unrated: 'Обычный',
  spike_rush: 'Spike Rush',
  deathmatch: 'Deathmatch',
  swiftplay: 'Swiftplay',
  custom: 'Кастом',
};

const REGION_LABELS: Record<string, string> = {
  eu: 'Европа',
  na: 'Америка',
  ap: 'Азия',
  kr: 'Корея',
  br: 'Бразилия',
  latam: 'Латинская Америка',
};

export function LobbyView({ lobby, isOwner, onBack }: LobbyViewProps) {
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isJoiningParty, setIsJoiningParty] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [editedCode, setEditedCode] = useState(lobby.party_code || '');

  // Local state for party_code that updates in real-time
  const [currentPartyCode, setCurrentPartyCode] = useState(lobby.party_code || '');

  const { isConnected, isValorantRunning } = useDesktopStatus();
  const { leaveLobby, updateLobbyPartyCode } = useLFGLobbies();

  // Check if desktop app is available (lfgApi exposed means we're in Electron)
  const [isDesktopAvailable, setIsDesktopAvailable] = useState(false);

  useEffect(() => {
    // Check if lfgApi is exposed (only available in Electron preload)
    const checkDesktop = () => {
      const available = typeof window !== 'undefined' && typeof window.lfgApi !== 'undefined';
      console.log('[LobbyView] Desktop available:', available, 'lfgApi:', typeof window.lfgApi);
      setIsDesktopAvailable(available);
    };

    checkDesktop();
    // Re-check after a short delay in case preload is slow
    const timeout = setTimeout(checkDesktop, 1000);
    return () => clearTimeout(timeout);
  }, []);

  // Desktop is ready if lfgApi is available AND (connected via heartbeat OR we assume local connection)
  // For local dev, if lfgApi exists, assume it's ready
  const isDesktopReady = isDesktopAvailable && (isConnected || isValorantRunning || isDesktopAvailable);

  // Real-time subscription for party_code updates
  useEffect(() => {
    console.log('[LobbyView] Setting up real-time subscription for lobby:', lobby.id);

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
          console.log('[LobbyView] Received real-time update:', payload);
          const newPartyCode = (payload.new as { party_code?: string })?.party_code;
          if (newPartyCode !== undefined) {
            setCurrentPartyCode(newPartyCode || '');
            setEditedCode(newPartyCode || '');
            console.log('[LobbyView] Updated party_code to:', newPartyCode);
          }
        }
      )
      .subscribe((status) => {
        console.log('[LobbyView] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[LobbyView] Successfully subscribed to lobby updates');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[LobbyView] Channel error - Realtime might not be enabled for this table');
        }
      });

    return () => {
      console.log('[LobbyView] Removing channel for lobby:', lobby.id);
      supabase.removeChannel(channel);
    };
  }, [lobby.id]);

  // Sync with lobby prop changes
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
          // Save to database
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
    } catch (error) {
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
    await leaveLobby.mutateAsync(lobby.id);
    setShowDeleteDialog(false);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Back button + Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку лобби
        </Button>

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

      {/* Header Card */}
      <div className="p-6 rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 shadow-soft">
        {/* Title Row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold">{lobby.title}</h2>
            {lobby.description && (
              <p className="text-muted-foreground mt-1 max-w-xl">{lobby.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {GAME_MODE_LABELS[lobby.game_mode] || lobby.game_mode}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <Users className="h-3 w-3 mr-1" />
              {lobby.current_size}/{lobby.max_size}
            </Badge>
          </div>
        </div>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {lobby.region && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{REGION_LABELS[lobby.region] || lobby.region}</span>
            </div>
          )}
          {(lobby.min_rank || lobby.max_rank) && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {lobby.min_rank && lobby.max_rank
                  ? `${lobby.min_rank} — ${lobby.max_rank}`
                  : lobby.min_rank
                    ? `от ${lobby.min_rank}`
                    : `до ${lobby.max_rank}`}
              </span>
            </div>
          )}
          {lobby.voice_required && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 text-sm">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Голосовой чат</span>
            </div>
          )}
        </div>

        {/* Party Code Section */}
        <div className="p-4 rounded-xl border bg-background/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Invite Code</span>
            {isOwner && !isEditingCode && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsEditingCode(true)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode || !isDesktopReady}
                  title={!isDesktopReady ? 'Запустите ValoHub Desktop и Valorant' : 'Сгенерировать код'}
                >
                  {isGeneratingCode ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {isEditingCode && isOwner ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedCode}
                onChange={(e) => {
                  // Allow only alphanumeric characters and convert to uppercase
                  const value = e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 6);
                  setEditedCode(value);
                }}
                placeholder="Вставьте Invite Code из игры"
                className="font-mono uppercase"
                maxLength={6}
              />
              <Button size="icon" variant="ghost" onClick={handleSaveCode}>
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsEditingCode(false)}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className={cn(
                'flex-1 px-3 py-2 rounded-lg font-mono text-lg',
                currentPartyCode ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'
              )}>
                {currentPartyCode || 'Не установлен'}
              </code>

              {currentPartyCode && (
                <>
                  <Button variant="outline" size="icon" onClick={handleCopyPartyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!isOwner && (
                    <Button
                      onClick={handleJoinParty}
                      disabled={isJoiningParty || !isDesktopReady}
                      className="shrink-0"
                    >
                      {isJoiningParty ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Gamepad2 className="h-4 w-4 mr-2" />
                      )}
                      {isJoiningParty ? 'Присоединение...' : 'Войти в Party'}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {!isDesktopReady && (
            <p className="text-xs text-muted-foreground mt-2">
              Запустите ValoHub Desktop и Valorant для автоприсоединения
            </p>
          )}
        </div>
      </div>

      {/* Participants Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Участники ({lobby.lfg_lobby_members?.length || 0})
        </h3>

        <div className="flex flex-wrap gap-4">
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
                'w-[140px] h-[180px] rounded-xl',
                'border-2 border-dashed border-muted/50',
                'flex items-center justify-center',
                'bg-muted/10'
              )}
            >
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          ))}
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
