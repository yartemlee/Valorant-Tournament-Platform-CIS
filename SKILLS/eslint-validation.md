# ESLint Validation Rule

## Обязательное правило

После любых изменений в `.ts`, `.tsx`, `.js`, `.jsx` файлах в директории `apps/web/src/` **ОБЯЗАТЕЛЬНО** проверяй их на ошибки ESLint перед завершением задачи.

## Команда проверки

```bash
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 [измененные_файлы]
```

Или для проверки конкретного файла:
```bash
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 "src/path/to/file.tsx"
```

## Что нужно исправлять

1. **`@typescript-eslint/no-explicit-any`** — заменяй `any` на конкретные типы
2. **`react-hooks/exhaustive-deps`** — добавляй недостающие зависимости в useEffect/useCallback
3. **Неиспользуемые переменные** — удаляй или используй

## Когда проверять

- После **каждого** изменения TypeScript/React файлов
- **Перед** уведомлением пользователя о завершении задачи
- При получении ошибок коммита от husky/lint-staged

## Важно

Проект использует `husky` + `lint-staged` для pre-commit проверок. Если ESLint ошибки не исправлены — коммит будет отклонён.
