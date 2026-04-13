# UI Changes & Implementation Log

This document tracks all design and UI changes merged from the Lovable compatibility update.

## 📦 Installed Dependencies
- `framer-motion`: For smooth UI animations (slides, fades).
- `@fontsource/noto-sans-kr`: For Korean language support.
- `html2canvas`: For capturing "Mood Cards" (matches reference implementation).

## 🎨 Design System Updates (Tailwind)
- **Colors**: Added new color tokens if any (to be verified during merge).
- **Shadows**:
  - `plush`: Soft, elevated shadow.
  - `warm-glow`: Warm accent shadow.
- **Animations**:
  - `wiggle`: For playful interactions.
  - `scale-in`: Smooth entry for modals/cards.
  - `carousel-slide`: For image sliders.

## 🧩 Component Updates
(This section will be populated as components are migrated)

## ⚠️ Excluded Items (Safety)
- No `useAuth` changes.
- No `Supabase` client changes.
- `lovable-tagger` excluded.
