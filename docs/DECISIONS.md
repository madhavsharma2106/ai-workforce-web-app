# Decision Log

Every major decision gets recorded here.

## Design language: warm/editorial → minimal neutral

Switched from an orange/amber gradient-heavy look to a Linear/Vercel/Notion-style minimal aesthetic — neutral grays, a single indigo accent, tighter type, small border-radius, border-driven cards instead of shadows/gradients. Dark mode intentionally deferred (light-only for now). See [DESIGN.md](DESIGN.md) for the resulting system.

## Component library: atomic design (atoms/molecules/organisms), no Storybook yet

Extracted the duplicated Button/Card/Badge/Input/Eyebrow markup (copy-pasted across `LeadCard`, `AuthGate`, `HistoryPanel`, `OnboardingChat`, `page.tsx`) into a small shared component library under `src/components/{atoms,molecules,organisms}/`. Storybook and a formal design-tokens pipeline were considered and explicitly deferred — the app had only 4 components at the time, so that tooling would have outweighed the payoff. Revisit once the primitive count grows enough to justify it. See [COMPONENTS.md](COMPONENTS.md) for the resulting structure and usage guidance.
