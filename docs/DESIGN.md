# Design System

Visual language for every screen and component going forward.

## Philosophy

Minimal and neutral, in the spirit of Linear, Vercel, and Notion.

The interface should feel calm and get out of the way of the work. Color, weight, and motion are used sparingly, only to draw attention to what matters.

## Color

- Neutral gray scale (`gray-*`) for text, borders, and surfaces.
- White backgrounds. Use `gray-50` only for subtle secondary surfaces (nested panels, footers).
- One accent color: indigo (`indigo-600` / `indigo-50`). Used for links, active/status states, and small emphasis — never for large fills.
- Primary actions use `gray-900` (near-black), not the accent color.
- No gradients. No multi-color palettes.

## Typography

- Sans-serif throughout (Inter). No serif headlines.
- Headlines: `font-semibold`, tight `tracking-tight`.
- Eyebrow labels (small caps-style tags above headings): `text-xs font-medium uppercase tracking-widest text-indigo-600`.
- Monospace (JetBrains Mono) is reserved for literal/technical values — stats, URLs, numbers — not prose.

## Shape & Elevation

- Small radius: `rounded-md` / `rounded-lg` for cards and inputs, `rounded-full` only for pills (status badges, tags).
- Borders over shadows. Prefer a `border border-gray-200` card to a `shadow-*` card. Use shadow only for true overlays (dropdowns, floating elements).
- Grouped stat/feature grids use a shared `gray-200` gap (`gap-px bg-gray-200` with white cells) instead of individual bordered boxes.

## Dark Mode

Deferred. Components should not hardcode assumptions that block adding it later, but building it out is not in scope yet.

## Applying This

When adding a new screen or component, match existing patterns in [`src/app/page.tsx`](../src/app/page.tsx) and [`src/components/LeadCard.tsx`](../src/components/LeadCard.tsx) rather than introducing new colors, radii, or shadow styles.

This keeps every future screen looking like it belongs to the same product.
