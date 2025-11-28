# Архитектура проекта

## Обзор

**Valorant Tournament Platform** - платформа для организации турниров по Valorant с системой команд, матчей, турнирных сеток и профилей игроков.

**Технологический стек:**
- Frontend: React 18 + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage + Realtime)
- State: TanStack Query (React Query)
- Forms: React Hook Form + Zod
- Routing: React Router v6

---

## Структура проекта

```
src/
├── pages/              # Страницы приложения (роуты)
├── components/         # React компоненты
│   ├── ui/            # Базовые UI компоненты (shadcn/ui)
│   ├── profile/       # Компоненты профилей
│   ├── teams/         # Компоненты команд
│   ├── tournaments/   # Компоненты турниров
│   └── home/          # Компоненты главной страницы
├── hooks/             # Переиспользуемые React хуки
├── contexts/          # Context Providers (Auth)
├── lib/               # Утилиты (Supabase client, helpers)
├── types/             # TypeScript типы
│   ├── database.types.ts  # Автогенерация из Supabase
│   └── common.types.ts    # Кастомные типы приложения
├── constants/         # Константы (proficiency levels, etc)
└── services/          # Внешние API (Valorant API)
```

---

## Система типов

### Источники типов

**1. database.types.ts** - автогенерируемые типы из Supabase:
```typescript
type Database = /* Supabase schema */
type Tables = Database['public']['Tables']
type Enums = Database['public']['Enums']
```

**2. common.types.ts** - кастомные типы приложения:
```typescript
// Основные сущности
Profile, Team, Tournament, Match

// Расширенные типы с join'ами
ProfileWithTeam, TeamWithMembers, BracketMatch

// Формы и UI
ProfileFormData, SignInCredentials, ProficiencyLevel
```

### Правила типизации

✅ **Использовать:**
- Database типы для Supabase queries
- Common типы для props и state
- Инференс типов из Zod схем: `z.infer<typeof schema>`
- `unknown` для catch блоков + type guards

❌ **Избегать:**
- `any` (исключение: RPC без типов)
- `@ts-ignore` (использовать type assertions)
- Inline типы (выносить в common.types.ts)

---

## Ключевые паттерны

### 1. Error Handling

```typescript
try {
  // ...
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  toast.error(message);
}
```

### 2. Supabase Queries

```typescript
const { data, error } = await supabase
  .from("profiles")
  .select("*, team:teams(*)")
  .eq("id", userId)
  .single();

if (error) throw error;
```

### 3. React Query

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['profile', userId],
  queryFn: async () => {
    const { data, error } = await supabase...
    if (error) throw error;
    return data;
  }
});
```

### 4. Forms (React Hook Form + Zod)

```typescript
const schema = z.object({ name: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({
  resolver: zodResolver(schema)
});
```

---

## Основные фичи

### 1. Аутентификация
- `contexts/AuthContext.tsx` - управление сессией
- Supabase Auth (email/password, OAuth)
- Protected routes через `PrivateRoute.tsx`

### 2. Профили
- `pages/Profile.tsx` - просмотр профиля
- `components/profile/` - компоненты (роли, агенты, ранги)
- Система достижений и медалей

### 3. Команды
- `pages/Teams.tsx`, `TeamDetails.tsx` - каталог и детали
- `components/teams/` - управление командой
- Система приглашений и заявок

### 4. Турниры
- `pages/Tournaments.tsx`, `TournamentDetails.tsx`
- `components/tournaments/TournamentBracket.tsx` - турнирная сетка
- Single/Double elimination форматы

---

## Безопасность (RLS)

Supabase RLS политики контролируют доступ к данным:
- **Profiles**: SELECT - public, UPDATE - owner
- **Teams**: SELECT - public, UPDATE - captain
- **Tournaments**: SELECT - public, CREATE/UPDATE - managers
- **Matches**: SELECT - public, UPDATE - через RPC

---

## Realtime обновления

Проект использует Supabase Realtime для автоматических обновлений UI.

### Включенные таблицы

Realtime репликация включена для:
- `profiles`, `teams`, `team_members`
- `team_invitations`, `team_applications`
- `tournaments`, `tournament_participants`, `tournament_matches`
- `notifications`, `matches`, `scrims`

### Специализированные хуки

- `useRealtimeNotifications` - уведомления пользователя
- `useRealtimeTeamInvitations` - приглашения в команды
- `useRealtimeTeamApplications` - заявки в команды
- `useRealtimeTeamMembers` - состав команды
- `useRealtimeTeams` - информация о командах
- `useRealtimeProfiles` - профили пользователей

**Расположение:** `src/hooks/useRealtime*.ts`

### Принцип работы

```typescript
// 1. Подписка на изменения
const channel = supabase
  .channel('table:id')
  .on('postgres_changes', { 
    event: '*', 
    table: 'table_name',
    filter: 'column=eq.value'
  }, () => {
    // 2. Инвалидация кэша
    queryClient.invalidateQueries({ queryKey: ['key'] });
  })
  .subscribe();

// 3. Очистка при размонтировании
return () => supabase.removeChannel(channel);
```

### Добавление новой таблицы

**1. Включить репликацию (SQL):**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;
```

**2. Создать хук:**
```typescript
// src/hooks/useRealtimeYourTable.ts
export function useRealtimeYourTable({ id }: { id: string }) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`your_table:${id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'your_table',
        filter: `id=eq.${id}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['your-table', id] });
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [id, queryClient]);
}
```

**3. Использовать в компонентах:**
```typescript
function YourComponent() {
  const { id } = useParams();
  useRealtimeYourTable({ id });
  // ...
}
```

---

## Деплой и окружение

### Переменные окружения (.env)
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Скрипты
```bash
npm run dev         # Development server
npm run build       # Production build
npm run typecheck   # TypeScript check
npm run lint        # ESLint check
```

---

## Миграции

`supabase/migrations/` - версионированные SQL миграции.

**Применение:**
```bash
supabase db push
```

**Генерация типов:**
```bash
supabase gen types typescript > src/types/database.types.ts
```
