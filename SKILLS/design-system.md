# ValoHub Design System — "Digital Couture"

> **Design Philosophy**: Deep Navy, Premium, Cyber-Sport Elegant.
> **Core Principle**: Avoid generic designs. Every pixel must feel "crafted" and intentional.

## 1. Typography
We use a distinct pairing to separate display from content.
- **Headings (Display)**: `Outfit` (Sans-serif, geometric but friendly). Use for H1-H6.
  - Weights: `font-semibold` (600) primarily.
  - Tracking: `-0.02em` (tight) for headers.
- **Body (Text)**: `DM Sans` (Clean, highly readable).
  - Weights: `font-normal` (400) for text, `font-medium` (500) for ui elements.

## 2. Color Palette (Deep Navy Theme)
The theme relies on rich, dark tones with vibrant, glowing accents.
**Do NOT use flat blacks (`#000`). Use rich dark blues.**

| Token | Scoped Value (HSL) | Usage |
|-------|-------------------|-------|
| `bg-background` | `225 25% 6%` | Main page background (Very dark navy) |
| `bg-card` | `225 20% 10%` | Cards, panels, sidebars |
| `bg-primary` | `250 60% 65%` | Main Actions (Soft Lavender/Blurple) |
| `text-primary` | `250 60% 65%` | Active states, primary text |
| `bg-accent` | `175 45% 50%` | Success, high-value actions (Refined Teal) |
| `bg-destructive` | `0 65% 55%` | Errors, dangerous actions |
| `text-muted-foreground` | `220 10% 55%` | Secondary text, placeholders |

## 3. Visual Effects & Texture
Our design is NOT flat. It has depth, grain, and glow.

### **Glassmorphism**
Use the `.glass` utility class for overlays and floating elements:
```css
.glass {
  background: hsl(var(--card) / 0.75);
  backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid hsl(var(--border) / 0.5);
}
```

### **Gradients**
Use gradients responsibly to add life to backgrounds and text.
- `bg-gradient-to-br from-background to-[#1e1e24]` (Subtle depth)
- `bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70` (Metallic text)

### **Glows & Shadows**
Soft, colored shadows > distinct black shadows.
- `shadow-glow-primary`: `0 0 40px hsl(250 60% 65% / 0.25)`

### **Animations**
Use `tailwindcss-animate` for standard entrance/exit animations.
- `animate-in fade-in zoom-in-95 duration-200` (Modals/Dialogs)
- `animate-fade-in-up` (Page content entrance)

For complex interactions, use CSS transitions standard or `framer-motion` (only if installed/needed).

## 4. Components Guide

### **Buttons**
- **Primary**: Gradient background (`--gradient-primary`), white text, subtle glow on hover.
- **Secondary/Ghost**: Transparent or semi-transparent background, white/muted text, hover brings up background opacity.
- **Shape**: Rounded corners `rounded-xl` (var(--radius)).

### **Cards**
- **Background**: `bg-card` or `.glass`.
- **Border**: `border border-border/50` (Subtle!).
- **Interaction**: Scale up slightly on hover (`hover:scale-[1.02]`) + border glow.

### **Inputs**
- **Background**: `bg-input` (Darker than card).
- **Border**: `border-input`.
- **Focus**: Ring `ring-primary/50`.

## 5. Layout & Spacing
- **Container**: Centered, max-width `1400px` (`2xl` screen).
- **Spacing**: Use substantial padding. Don't cramp elements.
- **Grid**: Use CSS Grid for complex layouts, Flexbox for alignment.

## 6. Scrollbar
Standardized custom scrollbar (defined in `index.css`).
- **Width**: Thin (10px).
- **Track**: Transparent/Invisible.
- **Thumb**: Dark muted color (`muted-foreground/40`), turns to `primary/70` on hover.
- **Behavior**: `scrollbar-gutter: stable` (No layout shift).

## 7. Iconography
- Library: `lucide-react`.
- Style: Consistent stroke width (usually 2px or 1.5px).
- Color: Usually `text-muted-foreground` by default, `text-foreground` on hover.

---
**"Is this premium?" Test**
Before committing, ask:
1. Does it look too "default bootstrap"? -> Add gradients/glow/texture.
2. Is the spacing too tight? -> Double it.
3. Is the contrast too high (pure black/white)? -> Soften to off-white and dark navy.
