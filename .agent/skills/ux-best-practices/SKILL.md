---
name: ux-best-practices
description: ValoHub Premium UX and Feedback standards. Use when implementing data fetching, form submissions, or any user interaction to ensure a high-quality feel.
metadata:
  author: v-shulga
  version: "1.0"
---

# ValoHub UX Best Practices

> **Objective**: Create a seamless, "alive", and professional user experience that matches the "Digital Couture" aesthetic.

## 1. Data Loading Strategy

Never show a "blank" screen or a simple "Loading..." text.

- **Skeletons**: Use Shadcn `Skeleton` components that match the shape of the content.
  - Cards should have card-shaped skeletons.
  - Text should have line skeletons.
- **Progressive Loading**: Show content as soon as it's available.
- **Gutter Stability**: Use `scrollbar-gutter: stable` (already in design system) to prevent layout shifts.

## 2. Real-time & Feedback

- **Toasts**: Use `sonner` or `toast` for ALL async actions.
  - **Loading State**: Show a loading toast if an action takes > 500ms.
  - **Success**: Clear, concise message ("Команда создана", NOT "Success").
  - **Error**: Explanatory message for the user ("Не удалось загрузить данные. Проверьте интернет", NOT "Error 500").
- **Optimistic Updates**: Use TanStack Query `onMutate` for instant UI updates (e.g., liking a match, sending a quick message).

## 3. Form Interactions

- **Submit State**: Disable buttons and show a spinner (or change text to "Сохранение...") during submission.
- **Validation**: Show error messages immediately after the field loses focus or on change (using Zod + React Hook Form).
- **Auto-focus**: Focus the first input of a modal or a new page.

## 4. Visual Polish

- **Transitions**: Use `framer-motion` or CSS transitions for:
  - Tooltips appearing.
  - Modals opening (scale + fade).
  - List items being added or removed.
- **Empty States**: Never leave a screen empty. Show an icon, a "Digital Couture" styled message, and a CTA (Call to Action).
  - *Example*: "У вас пока нет команд. [Создать команду]"

## 5. Mobile-First Polish

- **Touch Targets**: Ensure buttons are at least 44x44px.
- **Active States**: Add subtle scale down or opacity change on tap to give tactile feedback.
- **Haptic (Optional)**: If supported, use subtle vibration for critical actions.

---

## Quality Checklist

- [ ] Is there a skeleton for initial load?
- [ ] Does the button show a loading state?
- [ ] Is the error message user-friendly and in Russian?
- [ ] Is there a smooth transition for opening this element?
- [ ] Does the UI update instantly (optimistically) where possible?
