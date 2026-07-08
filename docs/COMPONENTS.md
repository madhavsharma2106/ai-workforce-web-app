# Component Architecture

How `src/components/` is organized, and how to extend it without drifting back into copy-pasted Tailwind.

## Structure (atomic design)

```
src/components/
  atoms/        pure, single-purpose UI primitives — no business logic, no data fetching
  molecules/    small compositions of 2+ atoms — only exist where a pattern genuinely repeats
  organisms/    feature components (AuthGate, LeadCard, ConversationalForm, LeadSourcerHome) — own domain logic, compose atoms/molecules
```

Pages under `src/app/` (the landing page, `/dashboard`, `/employee/[id]`, `/employee/[id]/onboarding`) compose organisms; organisms compose atoms/molecules. Import via the barrels: `@/components/atoms`, `@/components/molecules`, `@/components/organisms/<Name>` (organisms aren't barrel-exported from a single index — import each by name).

Authenticated routes (`/dashboard`, `/employee/[id]` and its subroutes) live under the `src/app/(app)/` route group, which shares one `layout.tsx` — it does the signed-in check and renders `AppHeader` once, instead of every page importing it. The landing page and `/login` sit outside this group and render their own chrome (or none).

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
| `EmployeeAvatar` | `seed: string`, `size?: "sm" \| "md" \| "lg"` (32/40/48px) | Wraps `boring-avatars` (`variant="beam"`, `square`), seeded on `employee.id` for a deterministic, unique-per-employee avatar. Colors constrained to this app's grays + accent instead of the library's default palette — see `EmployeeAvatar.tsx`. |
| `Breadcrumb` | `items: { label: string; href?: string }[]` | Crumbs without `href` render as the current (non-linked) page. Used on `/employee/[id]` and its `onboarding`/`chat` subroutes to orient the user back to `/dashboard`. |

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
## Storybook

Every component in `atoms/` and `organisms/` has a story (a deliberate one-time full backfill — the general rule below still governs new components going forward).

- Run with `npm run storybook` (serves on `http://localhost:6006`); `npm run build-storybook` produces a static build.
- Requires Node 22.14+ (this repo's `engines` requirement) — the `oxc-parser` native binding Storybook depends on fails to load under older Node (e.g. 20.x) with a misleading "Cannot find native binding" error. If your shell defaults to an older Node via `nvm`, run `nvm use 22.14.0` first.
- Config lives in `.storybook/` (`main.ts`, `preview.ts`). Uses `@storybook/react-vite`, not `@storybook/nextjs`, to avoid depending on this repo's modified Next.js internals (see root `AGENTS.md`) — but several organisms (`AppHeader`, `HireRoleButton`, `EmployeeOnboarding`) do call `useRouter()` from `next/navigation`, and others (`AccountManagerHome`, `Breadcrumb`) use `next/link`. Two workarounds in `main.ts` make that work under Vite:
  - `next/link` and `next/navigation` read `process.env.*` at module load; Vite doesn't polyfill a `process` global like webpack does, so `viteFinal` sets `define: { "process.env": {} }`.
  - `useRouter()` throws if no `AppRouterContext` is mounted. `.storybook/decorators.tsx` exports `withAppRouterMock`, a decorator that provides a stub router (`push`/`replace`/`refresh`/`back`/`forward`/`prefetch` as no-ops) — apply it to any story whose component calls `useRouter()`.
- Tailwind v4 is wired in via `@tailwindcss/vite`, importing the same `src/app/globals.css` the app uses, so stories share the real design tokens. Path aliases (`@/*`) are resolved via `vite-tsconfig-paths`.
- Story files live next to their component (`Component.stories.tsx`), matching the `stories` glob in `.storybook/main.ts`.
- **Extending this**: for a genuinely new component, only write a story once there's a real reason to view it in isolation (a second consumer, a design review, a hard-to-reach state) — don't reflexively add one just because Storybook exists. The full backfill above was a one-time exception, not a standing requirement to keep 100% coverage.
