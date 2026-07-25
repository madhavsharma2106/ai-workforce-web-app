# Design System — "Greenhouse"

Visual language for every screen and component going forward.

## Philosophy

Calm and living, in the spirit of tending a garden rather than operating a dashboard — matching the product's "employees, not agents" positioning (`VISION.md`, `UX.md`).

Sage/cream surfaces, organic "blob" shapes, a single leaf-green accent, and a serif+sans pairing stand in for the neutral SaaS palette this replaces.

## Color

- Page background: `#eef1e8` (sage/cream, not white). Surfaces (cards) are white `#ffffff`; nested content within a card (inset panels, inputs) uses `#f5f7f0`.
- One accent color: leaf green (`#5b7a45`, hover `#4d6a39`). Used for primary actions, active states, and progress — never a second hue.
- Status/fit tiers are distinguished by pale tints of the same green (`#e4ecd8` text `#4c6b3a`, and a secondary tint `#eef2df` text `#6b7d3a`) plus label text, not by new colors. Danger states (reject/failed) are the one exception, using literal `red-*` classes — see [COMPONENTS.md](COMPONENTS.md).
- Text: headings `#2b3524`, body `#4c5a42`/`#33402f`, muted `#7c8a70`, faint muted `#93a086`/`#a3ae97`/`#5f6e54`.
- No gradients. No multi-color palettes.

## Typography

- Serif: **Lora** — greetings and employee-voice headlines ("I found 2 leads for you to review") are italic; card/section headings are regular weight, not bold. Sizes: 28px (greeting), 24px (page titles), 19px/17px (card/section headings).
- Sans: **Nunito Sans** — body copy and UI. Sizes: 14px (body), 13-13.5px (secondary/status text), 12-12.5px (fine print), 11-11.5px (uppercase eyebrow labels, tracking 0.06-0.1em).
- No monospace — literal values (stats, counts) are set in Lora at their heading size, not a mono face.

## Shape & Elevation

- Cards: `rounded-[20px]`, no border, generous padding (24-28px). Depth comes only from layering the sage page background against white/pale-sage surfaces — no borders, no drop shadows anywhere.
- Inset panels/inputs: `rounded-xl`/`rounded-2xl` (12-16px), filled with the inset tone, no border.
- Buttons/badges: fully rounded (`rounded-full`).
- Avatars: organic "blob" radius (`50% 40% 55% 45% / 45% 55% 40% 60%` small, `58% 42% 53% 47% / 48% 55% 45% 52%` hero), clipping a `boring-avatars` pattern seeded per employee and recolored to the Greenhouse palette (see `EmployeeAvatar`).

## Dark Mode

Deferred. Components should not hardcode assumptions that block adding it later, but building it out is not in scope yet.

## Voice

Employees speak first-person about their own work ("I found 2 leads today"); the product speaks third-person about them elsewhere (roster cards, generic badges). Matter-of-fact and concrete — the calm of the palette should be legible in the copy too, not just the color.

## Applying This

When adding a new screen or component, use the shared primitives in `src/components/atoms/` and `src/components/molecules/` (see [COMPONENTS.md](COMPONENTS.md)) rather than hand-writing new colors, radii, or shadow styles. If a pattern isn't covered by an existing primitive yet, match the conventions in [`src/components/organisms/RunReviewPanel.tsx`](../src/components/organisms/RunReviewPanel.tsx) and [`src/components/organisms/LeadCard.tsx`](../src/components/organisms/LeadCard.tsx) — the fullest implementation of this system so far.

This keeps every future screen looking like it belongs to the same product.
