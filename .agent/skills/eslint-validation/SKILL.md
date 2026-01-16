---
name: eslint-validation
description: ESLint validation rules for ValoHub. Use after modifying any TypeScript or React files in apps/web/src/. Ensures code quality before commits via husky/lint-staged.
metadata:
  author: valohub-team
  version: "1.0"
---

# ESLint Validation Rule

## Mandatory Rule

After any changes to `.ts`, `.tsx`, `.js`, `.jsx` files in the `apps/web/src/` directory, **ALWAYS** check them for ESLint errors before completing the task.

## Validation Command

```bash
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 [changed_files]
```

Or for a specific file:

```bash
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 "src/path/to/file.tsx"
```

## Common Issues to Fix

| Rule | Solution |
|------|----------|
| `@typescript-eslint/no-explicit-any` | Replace `any` with specific types |
| `react-hooks/exhaustive-deps` | Add missing dependencies to useEffect/useCallback |
| Unused variables | Remove or use them |
| Missing imports | Add required imports |

## When to Validate

- After **every** change to TypeScript/React files
- **Before** notifying the user that the task is complete
- When receiving commit errors from husky/lint-staged

## Important

The project uses `husky` + `lint-staged` for pre-commit checks. If ESLint errors are not fixed — the commit will be rejected.

## Quick Fix Commands

```bash
# Fix auto-fixable issues
cd apps/web && npx eslint --config eslint.config.js --fix "src/**/*.{ts,tsx}"

# Check specific component
cd apps/web && npx eslint --config eslint.config.js --max-warnings=0 "src/components/MyComponent.tsx"

# Full project check
cd apps/web && npm run lint
```
