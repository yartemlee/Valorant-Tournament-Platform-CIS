# Coding Conventions & Core Rules

These rules are critical and must be followed for all code generation and modifications. Use this file as the primary source of truth for code quality and TypeScript standards.

## Core Rules

1. **Prioritize**: clean, efficient, secure, and maintainable code.
2. **Cleanup**: Remove dead code, commented-out blocks, and unused variables.
3. **Best Practices**: Follow best practices for React, Supabase, TypeScript, and Tailwind.
4. **Validation**: Before finishing, maintain a zero-error state for `npm run typecheck` and `npm run lint`.

## Zero Any Policy (CRITICAL)

**NEVER use the `any` type!** This is a strict project rule.

### Forbidden
```typescript
// NO
const data: any = response;
function handle(e: any) { }
const items = data as any[];
```

### Correct
```typescript
// YES
const data: UserResponse = response;
function handle(e: React.ChangeEvent<HTMLInputElement>) { }
const items: User[] = data;
```

### Strategies to avoid `any`

1. **Use specific types from `@/types/database.types.ts`**
   ```typescript
   import { Database } from '@/types/database.types';
   type Team = Database['public']['Tables']['teams']['Row'];
   ```

2. **For events — use React types**
   ```typescript
   onChange={(e: React.ChangeEvent<HTMLInputElement>) => ...}
   onClick={(e: React.MouseEvent<HTMLButtonElement>) => ...}
   onSubmit={(e: React.FormEvent<HTMLFormElement>) => ...}
   ```

3. **For unknown data — use `unknown` with type guards**
   ```typescript
   const data: unknown = await fetchData();
   if (isUser(data)) { /* now data is typed schema-aware */ }
   ```

4. **For generics — use type parameters**
   ```typescript
   function getFirst<T>(arr: T[]): T | undefined { return arr[0]; }
   ```

5. **For complex Supabase responses — use type assertions with intersections**
   ```typescript
   const { data } = await supabase.from('teams').select('*, captain:profiles(*)');
   type TeamWithCaptain = Team & { captain: Profile };
   const teams = data as TeamWithCaptain[] | null;
   ```

## Styling
- Use **TailwindCSS** utility classes exclusively.
- Use `cn()` from `src/lib/utils.ts` for conditional classes.
- Use **Shadcn UI** components for all UI elements.

## Supabase Queries
- Always check both `data` and `error` from queries.
- Use typed queries with Database types.
- Respect RLS policies.

## Forms
- Always use **react-hook-form** + **zod** + **zodResolver**.
