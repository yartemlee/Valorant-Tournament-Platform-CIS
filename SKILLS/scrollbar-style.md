# Scrollbar Style Guide

## Overview
ValoHub uses a custom scrollbar that matches the "Deep Navy Theme" aesthetic. This style is applied globally in `apps/web/src/index.css`.

## Key Points
- **No layout shift**: `scrollbar-gutter: stable` prevents content from shifting when scrollbar appears/disappears.
- **Thin profile**: 10px width/height.
- **Transparent track**: Blends with the dark background.
- **Rounded thumb**: Uses `--radius` variable for consistency.
- **Themed colors**: Thumb uses `--muted-foreground`, highlights to `--primary` on hover.
- **Cross-browser**: WebKit selectors + Firefox `scrollbar-width`/`scrollbar-color`.

## Usage
The scrollbar is automatically applied to all scrollable elements. No additional classes needed.

## When Adding New Scrollable Areas
No special configuration required — global styles apply automatically to all `::-webkit-scrollbar` elements.
