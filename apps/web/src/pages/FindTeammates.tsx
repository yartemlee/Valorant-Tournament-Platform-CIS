import { useState, useCallback } from 'react';
import { Plus, RefreshCw, Filter, Users } from 'lucide-react';
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
import { useLFGLobbies, useMyLFGLobby, type LobbyFilters } from '@/hooks/useLFGLobbies';
import { useDesktopStatus } from '@/hooks/useDesktopStatus';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'lobby';

const GAME_MODES = [
  { value: '', label: 'Все режимы' },
  { value: 'competitive', label: 'Рейтинговый' },
  { value: 'unrated', label: 'Обычный' },
  { value: 'spike_rush', label: 'Spike Rush' },
  { value: 'deathmatch', label: 'Deathmatch' },
  { value: 'swiftplay', label: 'Swiftplay' },
  { value: 'custom', label: 'Кастом' },
];

const REGIONS = [
  { value: '', label: 'Все регионы' },
  { value: 'eu', label: 'Европа' },
  { value: 'na', label: 'Северная Америка' },
  { value: 'kr', label: 'Корея' },
  { value: 'ap', label: 'Азия' },
];

export default function FindTeammates() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<LobbyFilters>({});

  const { lobbies, isLoading, refetch, createLobby, joinLobby } = useLFGLobbies(filters);
  const { lobby: myLobby, isOwner, isInLobby } = useMyLFGLobby();
  const { isConnected, isValorantRunning } = useDesktopStatus();

  // If user is in a lobby, show lobby view
  const effectiveViewMode = isInLobby ? 'lobby' : viewMode;

  const handleCreateLobby = useCallback(
    async (values: CreateLobbyFormValues) => {
      await createLobby.mutateAsync({
        title: values.title,
        description: values.description,
        gameMode: values.gameMode,
        maxSize: values.maxSize,
        minRank: values.minRank || undefined,
        maxRank: values.maxRank || undefined,
        region: values.region,
        isPrivate: values.isPrivate,
        voiceRequired: values.voiceRequired,
        discordLink: values.discordLink || undefined,
      });
    },
    [createLobby]
  );

  const handleJoinLobby = useCallback(
    (lobbyId: string) => {
      joinLobby.mutate(lobbyId);
    },
    [joinLobby]
  );

  const handleViewLobby = useCallback((lobbyId: string) => {
    // For now, joining to view
    // In future, could show a preview
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Войдите в аккаунт</h2>
          <p className="text-muted-foreground">
            Для поиска тимейтов необходимо авторизоваться
          </p>
        </div>
      </div>
    );
  }

  // Show lobby view if user is in a lobby
  if (effectiveViewMode === 'lobby' && myLobby) {
    return (
      <div className="container max-w-6xl py-6">
        <LobbyView
          lobby={myLobby}
          isOwner={isOwner}
          onBack={() => setViewMode('list')}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Поиск тимейтов</h1>
          <p className="text-muted-foreground">
            Найдите напарников для игры в Valorant
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать лобби
          </Button>
        </div>
      </div>

      {/* Desktop status */}
      {!isConnected && (
        <div className="bg-muted/50 border rounded-lg p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <p className="font-medium">Запустите ValoHub Desktop</p>
            <p className="text-sm text-muted-foreground">
              Для авто-присоединения к party запустите десктопное приложение
              {!isValorantRunning && ' и Valorant'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Фильтры:</span>
        </div>

        <Select
          value={filters.gameMode || ''}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              gameMode: value as LobbyFilters['gameMode'],
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
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
          value={filters.region || ''}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              region: value as LobbyFilters['region'],
            }))
          }
        >
          <SelectTrigger className="w-[160px]">
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
      </div>

      {/* Lobby list */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : lobbies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Лобби не найдены</h3>
          <p className="text-muted-foreground mb-4">
            Попробуйте изменить фильтры или создайте своё лобби
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Создать лобби
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lobbies.map((lobby) => (
            <LobbyCard
              key={lobby.id}
              lobby={lobby}
              onJoin={handleJoinLobby}
              onView={handleViewLobby}
              isJoining={joinLobby.isPending}
              isMyLobby={myLobby?.id === lobby.id}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateLobbyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateLobby}
      />
    </div>
  );
}
