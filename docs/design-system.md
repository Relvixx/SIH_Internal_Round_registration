# Design System

The MET BKC SIH portal uses a custom, highly polished design system built on Tailwind CSS, avoiding generic component library aesthetics.

## Color Palette

The system relies on CSS variables mapped to Tailwind utilities in `globals.css`:

### Surfaces & Backgrounds
- `--color-canvas`: The warm-white background for the app (`#FAFAF9`).
- `--color-surface`: Pure white for cards, modals, and layered elements (`#FFFFFF`).
- `--color-canvas-subtle`: Very light gray/warm for secondary sections (`#F5F5F4`).

### Ink (Typography)
- `--color-ink`: Deep, almost black text for maximum readability (`#0C0A09`).
- `--color-ink-secondary`: Dark gray for body text (`#44403C`).
- `--color-ink-tertiary`: Medium gray for metadata and captions (`#78716C`).
- `--color-ink-muted`: Light gray for placeholders and disabled states (`#A8A29E`).

### Brand & Accents
- **Primary**: Deep Navy / Ink Blue (`#0F172A`). Used for primary actions, branding, and active states.
- **Accent Saffron**: `#F97316`. Used sparingly for highlighting (e.g., SIH brand tie-ins).
- **Accent Green**: `#10B981`. Used for success states and positive numbers.
- **Accent Cyan**: `#06B6D4`. Used for tertiary highlights.

## Typography Scale

The font used is **Inter** (sans-serif), loaded optimally via Google Fonts.

- `text-display`: `2.5rem` / `3rem` (40px/48px) - Hero headlines.
- `text-page-title`: `1.875rem` (30px) - Main page headers.
- `text-section-title`: `1.25rem` (20px) - Content section headers.
- `text-card-title`: `1.125rem` (18px) - Component headers.
- `text-body`: `1rem` (16px) - Standard readable text.
- `text-body-sm`: `0.875rem` (14px) - UI text, labels, tight data.
- `text-caption`: `0.75rem` (12px) - Secondary helper text.
- `text-metadata`: `0.6875rem` (11px) - uppercase, spaced out, for statuses or tags.

## Component Primitives

All primitives are located in `src/components/ui/` and export via `index.ts`. They strictly use the CSS variables defined above rather than hardcoded Tailwind colors (e.g., they use `text-[var(--color-ink)]` rather than `text-gray-900`).

### Key UI Features
- **Cards**: Use `--shadow-sm` by default, expanding to `--shadow-md` on hover.
- **Buttons**: Have distinct active/pressed states.
- **Inputs**: Use a subtle focus ring (`focus:ring-[var(--color-primary)]/30`) to look premium.
- **Dialogs/Sheets**: Native HTML `<dialog>` elements for accessibility and performance where possible.
