# Руководство по разработке

## Начало работы

### Установка зависимостей
```bash
npm install
```

### Запуск dev сервера
```bash
npm run dev
```

### Переменные окружения
Создайте `.env` файл:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Стандарты кодирования

### TypeScript

✅ **Обязательно:**
- Явная типизация параметров функций
- Использование типов из `database.types.ts` и `common.types.ts`
- Инференс типов из Zod схем для форм
- Type guards в catch блоках

❌ **Избегать:**
- `any` (искл.: неизвестные RPC)
- `@ts-ignore` 
- Дублирование типов

**Пример:**
```typescript
// ✅ Правильно
interface ProfileProps {
  profile: Profile;
  isEditable: boolean;
}

export function ProfileCard({ profile, isEditable }: ProfileProps) {
  // ...
}

// ❌ Неправильно
export function ProfileCard(props: any) {
  // ...
}
```

### React Компоненты

**Стиль:**
- Function components с const arrow functions
- Props деструктуризация в параметрах
- Один компонент на файл
- PascalCase для имен компонентов

**Хуки:**
- `useState` - локальное состояние UI
- TanStack Query (`useQuery`, `useMutation`) - серверное состояние
- `useForm` - формы с валидацией

**Пример структуры:**
```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Profile } from "@/types/common.types";

interface ProfileCardProps {
  userId: string;
}

export function ProfileCard({ userId }: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: fetchProfile,
  });

  if (isLoading) return <Skeleton />;
  
  return <div>...</div>;
}
```

### CSS / Tailwind

- Использовать Tailwind utility classes
- Для сложных стилей использовать `cn()` helper
- Избегать inline styles и `<style>` тегов
- Длинные className разбивать на строки для читаемости

```typescript
// ✅ Правильно
<div className={cn(
  "flex items-center gap-2",
  "rounded-lg border p-4",
  isActive && "bg-primary/10"
)}>
  ...
</div>
```

---

## Структура компонентов

### Расположение файлов

- **`components/ui/`** - примитивные UI компоненты (Button, Card)
- **`components/{feature}/`** - feature-specific компоненты
- **`pages/`** - top-level страницы (routes)

### Именование

- Компоненты: `PascalCase.tsx` (MyComponent.tsx)
- Хуки: `camelCase.ts` (useMyHook.ts)
- Утилиты: `camelCase.ts` (formatDate.ts)
- Типы: `camelCase.types.ts` (common.types.ts)

---

## Работа с данными

### Supabase Queries

**Типизация:**
```typescript
const { data, error } = await supabase
  .from("profiles")
  .select("*, team:teams(*)")
  .eq("id", userId)
  .single();

if (error) throw error;
// data автоматически типизирована
```

**RPC вызовы:**
```typescript
const { data, error } = await supabase.rpc('function_name', {
  param1: value1,
});
```

### Кэширование (TanStack Query)

```typescript
// Query
const { data } = useQuery({
  queryKey: ['resource', id], // уникальный ключ
  queryFn: fetchFunction,
});

// Mutation
const mutation = useMutation({
  mutationFn: updateFunction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});
```

---

## Формы и валидация

### React Hook Form + Zod

```typescript
// 1. Определить схему
const profileSchema = z.object({
  username: z.string().min(3, "Минимум 3 символа"),
  bio: z.string().optional(),
});

// 2. Инферить тип
type ProfileFormData = z.infer<typeof profileSchema>;

// 3. Использовать в форме
const form = useForm<ProfileFormData>({
  resolver: zodResolver(profileSchema),
  defaultValues: { username: "", bio: "" },
});

// 4. Submit handler
const onSubmit = async (data: ProfileFormData) => {
  await updateProfile(data);
};
```

---

## Процесс разработки

### 1. Создание новой фичи

1. Создать компонент в соответствующей директории
2. Добавить необходимые типы в `common.types.ts`
3. Создать API функции в `lib/` или `services/`
4. Написать компонент с использованием TanStack Query
5. Подключить роут в `App.tsx`

### 2. Проверка кода

Перед коммитом:
```bash
npm run typecheck    # Проверка типов
npm run lint         # ESLint
npm run build        # Сборка
```

### 3. Git Workflow

**Структура коммитов:**
```
feat: добавлена система достижений
fix: исправлена загрузка профиля
refactor: оптимизирована турнирная сетка
docs: обновлена документация
```

**Ветки:**
- `main` - production
- `develop` - development
- `feature/название` - новые фичи
- `fix/название` - исправления

---

## Миграции БД

### Создание миграции

```bash
supabase migration new migration_name
```

### Применение миграций

```bash
supabase db push
```

### Обновление типов

После изменения схемы:
```bash
supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts
```

---

## Полезные команды

```bash
# Development
npm run dev                    # Запуск dev сервера
npm run build                  # Production build
npm run preview                # Preview build

# Quality checks
npm run typecheck              # TypeScript check
npm run lint                   # ESLint check
npm run lint:fix               # Auto-fix lint issues

# Supabase
supabase start                 # Local Supabase
supabase db reset              # Reset local DB
supabase gen types typescript  # Generate types
```

---

## Troubleshooting

### TypeScript ошибки
1. Проверить импорты типов
2. Запустить `npm run typecheck`
3. Проверить `common.types.ts` и `database.types.ts`

### RLS ошибки
1. Проверить политики в Supabase Dashboard
2. Использовать RPC для сложных операций
3. Убедиться в наличии `user_id` в запросе

### Build ошибки
1. Очистить кэш: `rm -rf node_modules && npm install`
2. Проверить `.env` переменные
3. Запустить `npm run typecheck` и `npm run lint`

---

## Дополнительно

### Документация
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### Полезные ресурсы
- Архитектура проекта: `ARCHITECTURE.md`
- Типы проекта: `src/types/`
- Миграции: `supabase/migrations/`
