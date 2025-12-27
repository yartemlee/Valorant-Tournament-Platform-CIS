import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronsUpDown, X, RefreshCw, Gamepad2 } from 'lucide-react';
import { useMemo, useState as useReactState } from 'react';

const formSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа').max(50, 'Максимум 50 символов'),
  description: z.string().max(200, 'Максимум 200 символов').optional(),
  lobbyType: z.enum(['competitive', 'casual', 'custom']),
  gameMode: z.string().optional(),
  maxSize: z.coerce.number().min(2).max(5),
  maxPlayers: z.coerce.number().min(2).max(10).optional(),
  maps: z.array(z.string()).default([]),
  servers: z.array(z.enum(['frankfurt', 'paris', 'london', 'warsaw', 'stockholm', 'istanbul', 'madrid', 'bahrain', 'dubai', 'capetown', 'tokyo'])).default([]),
  minRank: z.string().optional(),
  maxRank: z.string().optional(),
  isPrivate: z.boolean().default(false),
  voiceRequired: z.boolean().default(false),
  inviteCode: z.string().optional(),
});

export type CreateLobbyFormValues = z.infer<typeof formSchema>;

interface CreateLobbyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateLobbyFormValues) => Promise<void>;
}

const LOBBY_TYPES = [
  { value: 'competitive', label: 'Соревновательный' },
  { value: 'casual', label: 'Казуальный' },
  { value: 'custom', label: 'Кастом' },
];

const CASUAL_GAME_MODES = [
  { value: 'any', label: 'Любой' },
  { value: 'swiftplay', label: 'Быстрый' },
  { value: 'unrated', label: 'Обычный' },
  { value: 'deathmatch', label: 'Deathmatch' },
  { value: 'tdm', label: 'TDM' },
  { value: 'spike_rush', label: 'Spike Rush' },
];

const CUSTOM_GAME_MODES = [
  { value: 'any', label: 'Любой' },
  { value: 'swiftplay', label: 'Быстрый' },
  { value: 'unrated', label: 'Обычный' },
  { value: 'deathmatch', label: 'Deathmatch' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'tdm', label: 'TDM' },
  { value: 'spike_rush', label: 'Spike Rush' },
  { value: 'skirmish', label: 'Skirmish' },
];

const SERVERS = [
  { value: 'frankfurt', label: 'Франкфурт' },
  { value: 'paris', label: 'Париж' },
  { value: 'london', label: 'Лондон' },
  { value: 'warsaw', label: 'Варшава' },
  { value: 'stockholm', label: 'Стокгольм' },
  { value: 'istanbul', label: 'Стамбул' },
  { value: 'madrid', label: 'Мадрид' },
  { value: 'bahrain', label: 'Бахрейн' },
  { value: 'dubai', label: 'Дубай' },
  { value: 'capetown', label: 'Кейптаун' },
  { value: 'tokyo', label: 'Токио' },
];

const STANDARD_MAPS = [
  { value: 'abyss', label: 'Abyss' },
  { value: 'ascent', label: 'Ascent' },
  { value: 'bind', label: 'Bind' },
  { value: 'breeze', label: 'Breeze' },
  { value: 'fracture', label: 'Fracture' },
  { value: 'haven', label: 'Haven' },
  { value: 'icebox', label: 'Icebox' },
  { value: 'lotus', label: 'Lotus' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'split', label: 'Split' },
  { value: 'sunset', label: 'Sunset' },
];

const TDM_MAPS = [
  { value: 'piazza', label: 'Piazza' },
  { value: 'drift', label: 'Drift' },
  { value: 'glitch', label: 'Glitch' },
  { value: 'kasbah', label: 'Kasbah' },
  { value: 'district', label: 'District' },
];

const SKIRMISH_MAPS = [
  { value: 'skirmish_a', label: 'Skirmish A' },
  { value: 'skirmish_b', label: 'Skirmish B' },
  { value: 'skirmish_c', label: 'Skirmish C' },
];

const RANKS = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
  'Diamond 1', 'Diamond 2', 'Diamond 3',
  'Ascendant 1', 'Ascendant 2', 'Ascendant 3',
  'Immortal 1', 'Immortal 2', 'Immortal 3',
  'Radiant',
];

export function CreateLobbyDialog({ open, onOpenChange, onSubmit }: CreateLobbyDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLobbyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      lobbyType: 'competitive',
      gameMode: 'any',
      maxSize: 5,
      maxPlayers: 10,
      maps: [],
      servers: [],
      minRank: 'none',
      maxRank: 'none',
      isPrivate: false,
      voiceRequired: false,
      inviteCode: '',
    },
  });

  const lobbyType = useWatch({ control: form.control, name: 'lobbyType' });
  const gameMode = useWatch({ control: form.control, name: 'gameMode' });

  const getAvailableMaps = () => {
    if (gameMode === 'skirmish') {
      return SKIRMISH_MAPS;
    }
    if (gameMode === 'tdm') {
      return TDM_MAPS;
    }
    return STANDARD_MAPS;
  };

  const handleSubmit = async (values: CreateLobbyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLobbyTypeChange = (value: string) => {
    form.setValue('lobbyType', value as 'competitive' | 'casual' | 'custom');
    form.setValue('gameMode', 'any');
    form.setValue('maps', []);
  };

  const handleGameModeChange = (value: string) => {
    form.setValue('gameMode', value);
    form.setValue('maps', []);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать лобби</DialogTitle>
          <DialogDescription>
            Создайте лобби для поиска тимейтов в Valorant
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Название */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Ищем 2 в рейтинг" maxLength={50} {...field} />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value?.length || 0}/50</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Описание */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание (опционально)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Дополнительная информация о лобби..."
                      className="resize-none"
                      rows={2}
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">{field.value?.length || 0}/200</span>
                  </div>
                </FormItem>
              )}
            />

            {/* Тип лобби, Режим игры и Размер команды / Лимит игроков */}
            <div className={`grid gap-4 ${lobbyType === 'competitive' ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <FormField
                control={form.control}
                name="lobbyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип лобби</FormLabel>
                    <Select onValueChange={handleLobbyTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOBBY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(lobbyType === 'casual' || lobbyType === 'custom') && (
                <FormField
                  control={form.control}
                  name="gameMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Режим игры</FormLabel>
                      <Select onValueChange={handleGameModeChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(lobbyType === 'casual' ? CASUAL_GAME_MODES : CUSTOM_GAME_MODES).map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(lobbyType === 'competitive' || lobbyType === 'casual') && (
                <FormField
                  control={form.control}
                  name="maxSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Размер команды</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">Duo (2)</SelectItem>
                          <SelectItem value="3">Trio (3)</SelectItem>
                          <SelectItem value="5">Full stack (5)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {lobbyType === 'custom' && (
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Лимит игроков</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num} {num === 10 ? '(макс.)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Карты и Серверы */}
            <div className="grid grid-cols-2 gap-4">
              {lobbyType === 'custom' && gameMode !== 'any' && (
                <FormField
                  control={form.control}
                  name="maps"
                  render={({ field }) => {
                    const availableMaps = getAvailableMaps();

                    return (
                      <FormItem>
                        <FormLabel>Карты</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-auto min-h-10 justify-between font-normal"
                              >
                                {field.value.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 flex-1">
                                    {field.value.map((mapValue) => {
                                      const map = availableMaps.find((m) => m.value === mapValue);
                                      return (
                                        <Badge key={mapValue} variant="secondary" className="text-xs">
                                          {map?.label}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground flex-1 text-left">Любая</span>
                                )}
                                <div className="flex items-center gap-1 ml-2">
                                  {field.value.length > 0 && (
                                    <span
                                      role="button"
                                      className="rounded-sm hover:bg-accent p-0.5"
                                      onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        field.onChange([]);
                                      }}
                                    >
                                      <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                                    </span>
                                  )}
                                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                </div>
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-2" align="start">
                            <div className="grid grid-cols-2 gap-2">
                              {availableMaps.map((map) => {
                                const isSelected = field.value.includes(map.value);

                                return (
                                  <div
                                    key={map.value}
                                    className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                                    onClick={() => {
                                      if (isSelected) {
                                        field.onChange(field.value.filter((v) => v !== map.value));
                                      } else {
                                        field.onChange([...field.value, map.value]);
                                      }
                                    }}
                                  >
                                    <Checkbox checked={isSelected} />
                                    <span className="text-sm">{map.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <FormField
                control={form.control}
                name="servers"
                render={({ field }) => (
                  <FormItem className={!(lobbyType === 'custom' && gameMode !== 'any') ? 'col-span-2' : ''}>
                    <FormLabel>Серверы</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full h-auto min-h-10 justify-between font-normal"
                          >
                            {field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-1 flex-1">
                                {field.value.map((serverValue) => {
                                  const server = SERVERS.find((s) => s.value === serverValue);
                                  return (
                                    <Badge key={serverValue} variant="secondary" className="text-xs">
                                      {server?.label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground flex-1 text-left">Оптимальный</span>
                            )}
                            <div className="flex items-center gap-1 ml-2">
                              {field.value.length > 0 && (
                                <span
                                  role="button"
                                  className="rounded-sm hover:bg-accent p-0.5"
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    field.onChange([]);
                                  }}
                                >
                                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                                </span>
                              )}
                              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-2" align="start">
                        <div className="grid grid-cols-2 gap-2">
                          {SERVERS.map((server) => {
                            const isSelected = field.value.includes(server.value);
                            return (
                              <div
                                key={server.value}
                                className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent cursor-pointer"
                                onClick={() => {
                                  if (isSelected) {
                                    field.onChange(field.value.filter((v) => v !== server.value));
                                  } else {
                                    field.onChange([...field.value, server.value]);
                                  }
                                }}
                              >
                                <Checkbox checked={isSelected} />
                                <span className="text-sm">{server.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ранги для соревновательного режима */}
            {lobbyType === 'competitive' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minRank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Минимальный ранг</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Любой" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Любой</SelectItem>
                          {RANKS.map((rank) => (
                            <SelectItem key={rank} value={rank}>
                              {rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxRank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Максимальный ранг</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Любой" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Любой</SelectItem>
                          {RANKS.map((rank) => (
                            <SelectItem key={rank} value={rank}>
                              {rank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Переключатели */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="voiceRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Голосовой чат</FormLabel>
                      <FormDescription>
                        Только с микрофоном
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPrivate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Приватное</FormLabel>
                      <FormDescription>
                        Нужен запрос доступа
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Invite Code */}
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => {
                const isElectronEnv = typeof window !== 'undefined' && typeof (window as any).lfgApi !== 'undefined';
                const [isGenerating, setIsGenerating] = useReactState(false);

                const handleGenerate = async () => {
                  if (!isElectronEnv) {
                    return;
                  }
                  setIsGenerating(true);
                  try {
                    const lfgApi = (window as any).lfgApi;
                    if (lfgApi?.generatePartyCode) {
                      const result = await lfgApi.generatePartyCode();
                      if (result.success && result.code) {
                        field.onChange(result.code);
                      }
                    }
                  } catch {
                  } finally {
                    setIsGenerating(false);
                  }
                };

                return (
                  <FormItem>
                    <FormLabel>Invite Code (опционально)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Вставьте код из игры или сгенерируйте"
                          {...field}
                          className="font-mono uppercase"
                          maxLength={6}
                          onChange={(e) => {
                            // Allow only alphanumeric characters and convert to uppercase
                            const value = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, '')
                              .slice(0, 6);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      {isElectronEnv && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerate}
                          disabled={isGenerating}
                          title="Сгенерировать код"
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <FormDescription>
                      {isElectronEnv
                        ? 'Код будет автоматически сгенерирован в Valorant'
                        : 'Скопируйте код из игры (Custom Game → Share Code)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать лобби
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
