# Valorant Tournament Platform CIS

Платформа для проведения любительских и полупрофессиональных турниров по Valorant в СНГ. Участвуйте в турнирах, создавайте команды, отслеживайте статистику.

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

## Environment Variables

1. Copy the example environment file:
   ```sh
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Or use `VITE_SUPABASE_PUBLISHABLE_KEY` if available (takes priority over `VITE_SUPABASE_ANON_KEY`).

   Get these values from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

**Note:** `.env` files are ignored by Git. Use `.env.local` for local overrides that should never be committed.
