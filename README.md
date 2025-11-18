# VALHUB - Valorant CIS Competitive Hub

Платформа для организации турниров по Valorant в регионе CIS.

## Технологии

Проект построен с использованием:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (аутентификация, база данных, хранилище)
- React Router
- React Hook Form + Zod

## Установка и запуск

Требования: Node.js и npm должны быть установлены - [установка через nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

```sh
# Шаг 1: Клонировать репозиторий
git clone <YOUR_GIT_URL>

# Шаг 2: Перейти в директорию проекта
cd <YOUR_PROJECT_NAME>

# Шаг 3: Установить зависимости
npm i

# Шаг 4: Настроить переменные окружения
# Создайте файл .env в корне проекта и добавьте:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Шаг 5: Запустить dev-сервер
npm run dev
```

## Доступные команды

- `npm run dev` - запуск dev-сервера с автоперезагрузкой
- `npm run build` - сборка проекта для production
- `npm run lint` - проверка кода линтером
- `npm run preview` - предпросмотр production сборки

## Структура проекта

- `src/components/` - переиспользуемые UI компоненты
- `src/features/` - функциональные модули (профили, команды, турниры)
- `src/lib/` - утилиты и хелперы
- `src/integrations/supabase/` - конфигурация Supabase клиента

## Разработка

Проект следует правилам и соглашениям, описанным в workspace rules. Основные принципы:

- Все компоненты - функциональные компоненты на TypeScript
- Стилизация только через TailwindCSS
- Использование Shadcn UI компонентов
- Валидация форм через Zod + React Hook Form
- Строгая типизация без использования `any`
