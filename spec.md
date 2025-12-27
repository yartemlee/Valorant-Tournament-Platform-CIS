# ValoHub — Valorant Tournament Platform

> **[CRITICAL] ПРАВИЛО ПРОЕКТА:**
> При любых изменениях в структуре проекта, базе данных, архитектуре или функциональности, необходимо **ВСЕГДА** обновлять этот файл (`spec.md`).
>
> Поддерживать документацию в актуальном состоянии — обязанность каждого разработчика (и AI-ассистента). Если вы меняете код, вы меняете `spec.md`.

---

## 1. Обзор проекта

**ValoHub** — платформа для проведения любительских и полупрофессиональных турниров по Valorant в СНГ. Мы объединяем игроков, команды и организаторов, предоставляя инструменты для создания турниров, поиска тимейтов и управления командами.

**Ключевые особенности:**
- Не социальная сеть: нет друзей, лайков, личных сообщений
- Фокус на киберспорт: турниры, команды, поиск игроков
- Честность: привязка Riot ID, модерация

---

## 2. Технологический стек и Архитектура

Проект организован как **монорепозиторий** с использованием `npm workspaces`.

### Структура репозитория
```
root/
├── apps/
│   ├── web/               # Веб-приложение (Vite + React)
│   └── desktop/           # Electron приложение (Valorant интеграция)
├── packages/
│   └── shared/            # Общие типы (IPC, Valorant API)
├── supabase/
│   └── migrations/        # 46+ SQL миграций
├── scripts/               # Wrapper скрипты для запуска
├── SKILLS/                # AI-контекст для разработки
└── package.json           # Root конфиг с npm workspaces
```

### Стек технологий

**Frontend (Web):**
- React 18.3, TypeScript 5.8, Vite 7
- Tailwind CSS 3.4, shadcn/ui (Radix UI)
- TanStack Query 5 (server state)
- React Hook Form + Zod (формы)
- React Router v6 (маршрутизация)
- Sonner (уведомления)
- Lucide React (иконки)
- date-fns (даты)

**Desktop:**
- Electron 33 + Electron Forge
- Valorant API клиент
- IPC для связи с веб-версией

**Backend:**
- Supabase (PostgreSQL, Auth, Realtime, Storage)
- Row Level Security (RLS)
- 25+ RPC функций

---

## 3. Реализованный функционал

### 3.1. Пользователи и роли

| Роль | Права |
|------|-------|
| **Игрок** | Базовые права, вступление в команды, участие в турнирах |
| **Капитан** | Управление командой (до 10 человек), регистрация на турниры, трансфер капитанства |
| **Тренер** | Права капитана (кроме удаления команды и трансфера) |
| **Организатор** | Создание турниров, управление сеткой, ввод результатов |
| **Админ** | Полный контроль (редактирование пользователей, команд, турниров) |
| **Publisher** | Создание новостей (планируется) |

### 3.2. Модули

**Профиль:**
- Регистрация/вход (Email + пароль)
- Привязка Riot ID
- Ранги Valorant (Iron 1 — Radiant)
- Роли (Duelist, Initiator, Controller, Sentinel) с уровнями комфорта
- Агенты с уровнями владения
- Социальные ссылки (Discord, Twitch, YouTube, etc.)
- Настройки приватности и уведомлений
- Награды и медали

**Команды:**
- Создание команды с логотипом
- Система приглашений и заявок (real-time)
- Управление составом (добавление/удаление игроков)
- Роли в команде (капитан, тренер, игрок)
- Статус набора (открыт/закрыт)
- Статистика (медали: золото/серебро/бронза)
- Лог активности

**Турниры:**
- Форматы: Single Elimination, Double Elimination, Round Robin, Swiss
- Визуальные турнирные сетки (brackets)
- Регистрация команд с выбором состава
- Ручной ввод результатов организатором
- Статусы: Черновик, Регистрация, Активный, Завершён, Отменён
- Система замен игроков
- Гибкие настройки (размер команды, формат матчей, карты, ранговые ограничения)

**LFG (Looking For Group):**
- Создание лобби для поиска игроков
- Фильтры: режим игры, регион, размер группы
- Real-time чат в лобби
- Заявки на вступление (для приватных лобби)
- Интеграция с Valorant API (party code)

**Свободные агенты:**
- Карточки игроков, ищущих команду
- Фильтры по ролям и рангу
- Приглашение в команду (для капитанов/тренеров)

**Админ-панель:**
- Дашборд со статистикой
- Управление пользователями (роли, удаление)
- Управление командами
- Управление турнирами
- Управление фриагентами

### 3.3. В разработке

- Скримы (поиск оппонентов для тренировок)
- Лидерборд (рейтинг игроков/команд)
- Новости
- Система внутренней валюты

---

## 4. База данных

**PostgreSQL** через Supabase с **RLS** на всех таблицах.

### Основные таблицы

| Таблица | Описание |
|---------|----------|
| `profiles` | Профили пользователей (username, riot_id, rank, agents, roles) |
| `teams` | Команды (name, tag, logo, captain_id, is_recruiting) |
| `team_members` | Участники команд (team_id, user_id, role) |
| `team_invitations` | Приглашения в команды |
| `team_applications` | Заявки в команды |
| `tournaments` | Турниры (title, format, status, settings) |
| `tournament_registrations` | Регистрации на турниры |
| `matches` | Матчи (team1_id, team2_id, winner_id, score) |
| `lfg_lobbies` | LFG лобби |
| `lfg_lobby_members` | Участники лобби |
| `lfg_messages` | Чат лобби |
| `free_agent_cards` | Карточки свободных агентов |
| `notifications` | Уведомления |
| `player_roles` | Роли игроков (с уровнем комфорта) |
| `player_agents` | Агенты игроков (с уровнем владения) |

### Enums

```sql
app_role: 'admin', 'publisher', 'organizer', 'player'
team_role: 'captain', 'coach', 'member'
tournament_format: 'single_elimination', 'double_elimination', 'round_robin', 'swiss'
tournament_status: 'draft', 'registration', 'active', 'completed', 'cancelled'
valorant_rank: 'Iron 1' ... 'Radiant'
lfg_game_mode: 'competitive', 'unrated', 'spike_rush', 'deathmatch', 'swiftplay', 'custom'
```

### Realtime подписки

Включены для: `profiles`, `teams`, `team_members`, `team_invitations`, `team_applications`, `lfg_lobbies`, `lfg_lobby_members`, `lfg_messages`, `notifications`

---

## 5. Структура фронтенда

### Страницы (pages/)

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | Index | Главная (турниры, новости) |
| `/login` | Login | Вход |
| `/signup` | Signup | Регистрация |
| `/forgot-password` | ForgotPassword | Восстановление пароля |
| `/profile` | Profile | Свой профиль |
| `/profile/:username` | Profile | Профиль пользователя |
| `/tournaments` | Tournaments | Список турниров |
| `/tournaments/:id` | TournamentDetails | Детали турнира |
| `/teams` | Teams | Список команд |
| `/teams/create` | CreateTeam | Создание команды |
| `/teams/:id` | TeamDetails | Профиль команды |
| `/teams/:id/manage` | TeamManage | Управление командой |
| `/free-agents` | FreeAgents | Свободные агенты |
| `/find-teammates` | FindTeammates | LFG (поиск тимейтов) |
| `/admin/*` | AdminLayout | Админ-панель |

### Ключевые компоненты

- `Sidebar` — навигация с badge заявок
- `TopBar` — уведомления, профиль, статус desktop
- `ErrorBoundary` — глобальная обработка ошибок
- `TournamentBracket` — визуальные турнирные сетки
- Компоненты LFG: `LobbyCard`, `LobbyView`, `LobbyChat`
- Компоненты профиля: `RoleSelector`, `AgentSelector`, `SettingsTab`

### Хуки

- `useCurrentUserProfile` — текущий пользователь и его роль в команде
- `useRealtimeTeams` — real-time обновления команд
- `useRealtimeTeamMembers` — состав команды
- `useRealtimeTeamInvitations` — приглашения
- `useRealtimeTeamApplications` — заявки
- `useLFGLobbies` — LFG лобби
- `useLFGChat` — чат лобби
- `useDesktopStatus` — статус desktop приложения

---

## 6. Руководство разработчика

### Запуск проекта

```bash
# Установка зависимостей
npm install

# Запуск режима разработки (Web + Desktop)
npm run dev

# Запуск только веб-версии
npm run dev:web

# Запуск только desktop
npm run dev:desktop

# Проверка типов
npm run typecheck

# Линтинг
npm run lint

# Сборка
npm run build
```

### Переменные окружения (.env)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Стандарты кодирования

1. **TypeScript:** Строгая типизация, избегать `any`
2. **Компоненты:** PascalCase, один файл = один компонент
3. **Стили:** Tailwind CSS, использовать `cn()` для условных классов
4. **Состояние:** TanStack Query для серверных данных
5. **Формы:** React Hook Form + Zod
6. **Уведомления:** Sonner (toast)

### Работа с Git

- Ветки: `feature/name`, `fix/name`
- Основная ветка: `main`
- Коммиты: Conventional Commits (`feat:`, `fix:`, `chore:`)

---

## 7. Деплой

**Web:** Vercel (настроен в `vercel.json`)

**Desktop:** Electron Forge (создание установщиков)

---

*Последнее обновление: Декабрь 2025*

**Разработано для Valorant сообщества СНГ**
