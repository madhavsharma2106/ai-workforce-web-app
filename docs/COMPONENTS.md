# Component Architecture

How `src/components/` is organized, and how to extend it without drifting back into copy-pasted Tailwind.

## Structure (atomic design)

```
src/components/
  atoms/        pure, single-purpose UI primitives — no business logic, no data fetching
  molecules/    small compositions of 2+ atoms — only exist where a pattern genuinely repeats
  organisms/    feature components (AuthGate, LeadCard, HistoryPanel, OnboardingChat) — own domain logic, compose atoms/molecules
```

`src/app/page.tsx` composes organisms; organisms compose atoms/molecules. Import via the barrels: `@/components/atoms`, `@/components/molecules`, `@/components/organisms/<Name>` (organisms aren't barrel-exported from a single index — import each by name).

## Atoms (`src/components/atoms/`)

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant?: "primary" \| "secondary" \| "danger" \| "accent"`, `size?: "sm" \| "md" \| "lg"`, `fullWidth?: boolean` | `primary` (near-black) is the default and the main CTA color — not `accent`. `accent` (indigo) is reserved for the rare emphasis action (e.g. "Confirm hire"). |
| `Input` / `Textarea` | native attrs + `className` | Share one base field style. |
| `Card` | `as?: ElementType` (default `div`), `padding?: "none" \| "sm" \| "md" \| "lg"` (default `lg`) | Owns shape only (`rounded-lg border`). Background/hover/layout stays in the caller's `className`. |
| `Badge` | `tone?: "neutral" \| "accent" \| "danger"`, `size?: "xs" \| "sm" \| "md"` | Status pills, tags. |
| `Eyebrow` | `tone?: "accent" \| "accent-faint" \| "muted"`, `tracking?: "wide" \| "widest"` | The small-caps kicker/label pattern from [DESIGN.md](DESIGN.md). |
| `Heading` | `as?: ElementType` (default `h2`), `size?: "xl" \| "lg" \| "md" \| "sm"` | `font-semibold tracking-tight text-gray-900` headings; pair `as="h1"` with `size="xl"` for page titles. |
| `Text` | `as?: ElementType` (default `p`), `size?: "xs" \| "sm" \| "md" \| "lg" \| "xl"`, `tone?: "default" \| "muted" \| "subtle" \| "inverted"`, `weight?: "normal" \| "medium" \| "semibold"` | General body/paragraph text. |

`cn(...)` (in `atoms/cn.ts`) is a tiny classname-joiner (`filter(Boolean).join(" ")`) — no `clsx`/`tailwind-merge` dependency.

## Molecules (`src/components/molecules/`)

| Component | Built from | Used for |
|---|---|---|
| `Alert` | `variant?: "info" \| "error"` | Inline banners (search-in-progress, error messages, "check your email"). |

Only `Alert` exists today. A `Field` molecule (label + input) was considered during the initial extraction but dropped — at the time there was only one real call site (`LeadCard`'s draft-email textarea), and a molecule with a single consumer is premature abstraction. Revisit if a second genuine label+field duplicate shows up.

## Design tokens

CSS custom properties live in `src/app/globals.css` (`--accent`, `--accent-hover`, `--accent-soft`, `--muted`, `--border`, `--surface`). Atoms reference them with Tailwind v4's canonical arbitrary-var syntax, e.g. `border-(--border)`, `bg-(--accent-soft)` — not the older `border-[var(--border)]` form. Colors with no matching token (e.g. `red-*` for danger states, `gray-900` for the primary button) stay as literal Tailwind classes inside the primitive's variant definition — don't invent new tokens to chase 100% token coverage.

## One-off overrides

Tailwind's generated CSS order isn't guaranteed to follow JSX `className` order, so a caller-supplied override on the same CSS property as a variant's built-in class (e.g. shrinking a `Button`'s padding, or forcing `Badge`'s background to white) can silently lose. Use the important-modifier suffix for a guaranteed win, e.g. `className="px-4!"` or `className="bg-white!"`. Reference usages: the "Approve all" button and "Emma is learning" badge in `src/app/page.tsx`.

## Extending this

- **New variant on an existing atom**: only add one backed by a real call site in the app — don't pre-populate options nobody uses yet.
- **New atom**: only when a class-string pattern is duplicated 2+ times across files (grep before assuming).
- **New molecule**: only when 2+ real call sites compose the *same* atoms in the *same* shape.
- **Storybook**: deliberately out of scope for now — see [DECISIONS.md](DECISIONS.md). Revisit once the atom/molecule count grows enough that browsing them in isolation would save more time than the setup costs.
