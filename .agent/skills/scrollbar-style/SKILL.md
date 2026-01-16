---
name: scrollbar-style
description: ValoHub custom scrollbar styling guide. Use when adding scrollable areas or modifying scroll behavior. Ensures consistent Deep Navy Theme aesthetic.
metadata:
  author: valohub-team
  version: "1.0"
---

# Scrollbar Style Guide

## Overview

ValoHub uses a custom scrollbar that matches the "Deep Navy Theme" aesthetic. This style is applied globally in `apps/web/src/index.css`.

## Key Points

| Property | Value | Purpose |
|----------|-------|---------|
| `scrollbar-gutter` | `stable` | Prevents content shift when scrollbar appears/disappears |
| Width/Height | `10px` | Thin profile |
| Track | Transparent | Blends with dark background |
| Thumb | `--muted-foreground` | Rounded, themed color |
| Hover | `--primary` | Highlights on interaction |

## Cross-Browser Support

- **WebKit** (Chrome, Safari, Edge): `::-webkit-scrollbar` selectors
- **Firefox**: `scrollbar-width` and `scrollbar-color` properties

## Usage

The scrollbar is automatically applied to all scrollable elements. No additional classes needed.

## When Adding New Scrollable Areas

No special configuration required — global styles apply automatically to all `::-webkit-scrollbar` elements.

## CSS Reference

```css
/* Already defined in index.css */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
  border-radius: var(--radius);
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary) / 0.7);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.4) transparent;
}
```
