import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Users, RefreshCw, UserX, Sparkles, Gamepad2, MonitorCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LobbyCard } from '@/components/lfg/LobbyCard';
import { LobbyView } from '@/components/lfg/LobbyView';
import { CreateLobbyDialog, type CreateLobbyFormValues } from '@/components/lfg/CreateLobbyDialog';
import { JoinRequestDialog } from '@/components/lfg/JoinRequestDialog';
import { useLFGLobbies, useMyLFGLobby, useMyPendingRequests, type LobbyFilters, type LFGLobbyWithMembers } from '@/hooks/useLFGLobbies';
import { useDesktopStatus } from '@/hooks/useDesktopStatus';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

type ViewMode = 'list' | 'lobby';

const GAME_MODES = [
  { value: 'all', label: 'Все режимы' },
  { value: 'competitive', label: 'Рейтинговый' },
  { value: 'unrated', label: 'Обычный' },
  { value: 'spike_rush', label: 'Spike Rush' },
  { value: 'deathmatch', label: 'Deathmatch' },
  { value: 'swiftplay', label: 'Swiftplay' },
  { value: 'custom', label: 'Кастом' },
];

const REGIONS = [
  { value: 'all', label: 'Все регионы' },
  { value: 'eu', label: 'Европа' },
  { value: 'na', label: 'Северная Америка' },
  { value: 'kr', label: 'Корея' },
  { value: 'ap', label: 'Азия' },
];

export default function FindTeammates() {
  const { user, session } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinRequestDialog, setShowJoinRequestDialog] = useState(false);
  const [selectedLobbyForRequest, setSelectedLobbyForRequest] = useState<LFGLobbyWithMembers | null>(null);
  const [filters, setFilters] = useState<LobbyFilters>({});

  const { lobbies, isLoading, refetch, createLobby, joinLobby, requestToJoin } = useLFGLobbies(filters);
  const { lobby: myLobby, isOwner, isInLobby } = useMyLFGLobby();
  const { getRequestStatus } = useMyPendingRequests();
  const { isConnected, isValorantRunning } = useDesktopStatus();

  // Simple Electron detection via userAgent (no preload needed)
  const isElectron = useMemo(() => {
    return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
  }, []);

  // Local Valorant running state (from Electron's direct injection)
  const [valorantRunning, setValorantRunning] = useState<boolean>(() => {
    // Check initial value from window
    const status = (window as any).__valorantStatus__;
    return status?.isRunning ?? false;
  });

  // Listen for Valorant status changes from Electron
  useEffect(() => {
    if (!isElectron) return;

    const handleStatusChange = (event: any) => {
      const detail = event.detail || {};
      console.log('[FindTeammates] Valorant status changed:', detail);
      setValorantRunning(detail.isRunning ?? false);
    };

    window.addEventListener('valorant-status-changed', handleStatusChange);

    // Also check current value on mount
    const currentStatus = (window as any).__valorantStatus__;
    if (currentStatus) {
      setValorantRunning(currentStatus.isRunning ?? false);
    }

    return () => {
      window.removeEventListener('valorant-status-changed', handleStatusChange);
    };
  }, [isElectron]);

  // Desktop is "connected" if we're running in Electron
  const isDesktopConnected = isElectron || isConnected;

  // Valorant is running if detected via Electron OR via Supabase sync
  const isValorantActive = valorantRunning || isValorantRunning;

  // viewMode controls which view is shown (no forced override)

  const handleCreateLobby = useCallback(
    async (values: CreateLobbyFormValues) => {
      // Маппинг gameMode для базы данных
      // Допустимые значения в DB: competitive, unrated, spike_rush, deathmatch, swiftplay, custom
      const gameModeMapping: Record<string, string> = {
        competitive: 'competitive',
        unrated: 'unrated',
        spike_rush: 'spike_rush',
        deathmatch: 'deathmatch',
        swiftplay: 'swiftplay',
        custom: 'custom',
        // Маппинг для режимов, которых нет в DB enum
        any: 'unrated',
        tdm: 'custom',
        escalation: 'custom',
        skirmish: 'custom',
      };

      // Маппинг игровых режимов в Valorant Queue IDs
      const valorantQueueMapping: Record<string, string> = {
        competitive: 'competitive',
        unrated: 'unrated',
        spike_rush: 'spikerush',
        deathmatch: 'deathmatch',
        swiftplay: 'swiftplay',
        tdm: 'hurm',
        escalation: 'ggteam',
        custom: '', // Custom doesn't use queue
      };

      // Маппинг серверов в регионы
      // Допустимые значения в DB: eu, na, ap, kr, br, latam
      const serverToRegion: Record<string, string> = {
        frankfurt: 'eu',
        paris: 'eu',
        london: 'eu',
        warsaw: 'eu',
        stockholm: 'eu',
        istanbul: 'eu',
        madrid: 'eu',
        bahrain: 'eu',
        dubai: 'eu',
        capetown: 'eu',
        tokyo: 'ap',
      };

      // Определяем gameMode для базы данных
      let gameMode: string;
      let valorantQueueId: string;

      if (values.lobbyType === 'competitive') {
        gameMode = 'competitive';
        valorantQueueId = 'competitive';
      } else if (values.lobbyType === 'custom') {
        gameMode = 'custom';
        valorantQueueId = ''; // Custom doesn't use queue
      } else {
        // casual - используем выбранный режим с маппингом
        const selectedMode = values.gameMode || 'any';
        gameMode = gameModeMapping[selectedMode] || 'unrated';
        valorantQueueId = valorantQueueMapping[selectedMode] || 'unrated';
      }

      // Определяем размер команды
      const maxSize = values.lobbyType === 'custom' ? (values.maxPlayers || 10) : values.maxSize;

      // Определяем регион из первого сервера
      const firstServer = values.servers?.[0];
      const region = firstServer ? (serverToRegion[firstServer] || 'eu') : 'eu';

      // Если Desktop App подключен и есть валидный queue - меняем режим в Valorant
      const lfgApi = (window as any).lfgApi;
      if (lfgApi?.changeQueue && valorantQueueId && isValorantActive) {
        try {
          const result = await lfgApi.changeQueue(valorantQueueId);
          if (result.success) {
            console.log(`[LFG] Changed Valorant queue to: ${valorantQueueId}`);
          } else {
            console.warn(`[LFG] Failed to change queue: ${result.error}`);
          }
        } catch (error) {
          console.error('[LFG] Error changing queue:', error);
        }
      }

      await createLobby.mutateAsync({
        title: values.title,
        description: values.description,
        gameMode: gameMode as any,
        maxSize: maxSize,
        minRank: values.minRank && values.minRank !== 'none' ? values.minRank : undefined,
        maxRank: values.maxRank && values.maxRank !== 'none' ? values.maxRank : undefined,
        region: region as any,
        isPrivate: values.isPrivate,
        voiceRequired: values.voiceRequired,
        inviteCode: values.inviteCode,
      });
      // Auto-navigate to lobby after creation
      setViewMode('lobby');
    },
    [createLobby, isValorantActive]
  );

  const handleJoinLobby = useCallback(
    (lobbyId: string) => {
      joinLobby.mutate(lobbyId, {
        onSuccess: () => {
          setViewMode('lobby');
        }
      });
    },
    [joinLobby]
  );

  const handleViewLobby = useCallback((lobbyId: string) => {
    // For now, joining to view
    // In future, could show a preview
  }, []);

  const handleRequestJoin = useCallback(
    (lobbyId: string) => {
      const lobby = lobbies.find(l => l.id === lobbyId);
      if (lobby) {
        setSelectedLobbyForRequest(lobby);
        setShowJoinRequestDialog(true);
      }
    },
    [lobbies]
  );

  const handleSubmitJoinRequest = useCallback(
    async (message: string) => {
      if (!selectedLobbyForRequest) return;
      await requestToJoin.mutateAsync({
        lobbyId: selectedLobbyForRequest.id,
        message: message || undefined,
      });
    },
    [selectedLobbyForRequest, requestToJoin]
  );

  // Not logged in state
  if (!user) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 gradient-mesh">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center justify-center py-24 animate-fade-in-up">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
                  <Users className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-3">Войдите в аккаунт</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Для поиска тимейтов и создания лобби необходимо авторизоваться
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show lobby view if user clicked into their lobby
  if (viewMode === 'lobby' && myLobby) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 gradient-mesh">
            <div className="max-w-7xl mx-auto animate-fade-in-up">
              <LobbyView
                lobby={myLobby}
                isOwner={isOwner}
                onBack={() => setViewMode('list')}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8 gradient-mesh">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-display font-bold tracking-tight">
                    Поиск тимейтов
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Найдите напарников для игры в Valorant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="border-border/50 hover:border-primary/30 hover:bg-primary/5"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                {isInLobby ? (
                  <Button
                    onClick={() => setViewMode('lobby')}
                    className="shadow-soft hover:shadow-glow-primary transition-shadow"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Моё лобби
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="shadow-soft hover:shadow-glow-primary transition-shadow"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать лобби
                  </Button>
                )}
              </div>
            </div>

            {/* Desktop status CTA Block */}
            {/* Case 1: Running in browser (NOT Electron and NOT connected via sync) - show "Launch ValoHub Desktop" */}
            {!isDesktopConnected && (
              <div
                className="p-5 rounded-xl border bg-gradient-to-br from-yellow-500/5 via-background to-yellow-500/5 animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">Запустите ValoHub Desktop</p>
                    <p className="text-sm text-muted-foreground">
                      Для авто-присоединения к party запустите десктопное приложение
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Case 2: Running in Electron but Valorant NOT running - show "Launch Valorant" */}
            {isElectron && !isValorantActive && (
              <div
                className="p-5 rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/5 animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Запустите Valorant</p>
                    <p className="text-sm text-muted-foreground">
                      Для авто-присоединения к party нужен запущенный Valorant
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Case 3: Running in Electron AND Valorant IS running - show success status */}
            {isElectron && isValorantActive && (
              <div
                className="p-5 rounded-xl border bg-gradient-to-br from-green-500/5 via-background to-green-500/5 animate-fade-in-up"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <MonitorCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Готово к игре</p>
                    <p className="text-sm text-muted-foreground">
                      Valorant запущен. Авто-присоединение к party активно
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div
              className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card/50 animate-fade-in-up"
              style={{ animationDelay: '0.15s' }}
            >
              <span className="text-sm font-medium text-muted-foreground">Фильтры:</span>

              <Select
                value={filters.gameMode || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    gameMode: value === 'all' ? undefined : value as LobbyFilters['gameMode'],
                  }))
                }
              >
                <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Режим игры" />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.region || 'all'}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    region: value === 'all' ? undefined : value as LobbyFilters['region'],
                  }))
                }
              >
                <SelectTrigger className="w-[160px] bg-background/50 border-border/50">
                  <SelectValue placeholder="Регион" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.value} value={region.value}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filters.gameMode || filters.region) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </Button>
              )}
            </div>

            {/* Lobby list */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[220px] rounded-xl"
                    style={{ animationDelay: `${0.2 + i * 0.05}s` }}
                  />
                ))}
              </div>
            ) : lobbies.length === 0 ? (
              <div className="text-center py-16 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <UserX className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold">Лобби не найдены</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {filters.gameMode || filters.region
                    ? 'Попробуйте изменить параметры поиска'
                    : 'Станьте первым — создайте своё лобби!'}
                </p>
                {(filters.gameMode || filters.region) ? (
                  <Button
                    variant="outline"
                    onClick={() => setFilters({})}
                    className="border-border/50 hover:border-primary/30"
                  >
                    Сбросить фильтры
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateDialog(true)} className="shadow-soft hover:shadow-glow-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать лобби
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {lobbies.map((lobby, index) => (
                  <div
                    key={lobby.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                  >
                    <LobbyCard
                      lobby={lobby}
                      onJoin={handleJoinLobby}
                      onView={handleViewLobby}
                      onRequestJoin={handleRequestJoin}
                      isJoining={joinLobby.isPending}
                      isRequesting={requestToJoin.isPending}
                      hasRequestPending={getRequestStatus(lobby.id) === 'pending'}
                      isMyLobby={myLobby?.id === lobby.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create dialog */}
      <CreateLobbyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateLobby}
      />

      {/* Join Request dialog */}
      {selectedLobbyForRequest && (
        <JoinRequestDialog
          open={showJoinRequestDialog}
          onOpenChange={setShowJoinRequestDialog}
          lobbyTitle={selectedLobbyForRequest.title}
          onSubmit={handleSubmitJoinRequest}
        />
      )}
    </div>
  );
}
