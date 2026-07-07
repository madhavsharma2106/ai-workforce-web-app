# Account Manager

## Role

Account Manager

## Mission

Build and continuously maintain a deep understanding of the client's business — who they are, who they sell to, what good/bad looks like, current priorities — so every other employee produces more relevant work without needing to re-explain context.

## Success Metric

Reduction in corrections/feedback other employees receive; how often other roles' work is approved without edits.

## Inputs

- Onboarding conversation (client description, ideal customer profile, bad-lead criteria)
- Ongoing feedback/corrections given to other employees
- Public info about the client's business (website, LinkedIn) — future integration, not built yet
- Approval/rejection patterns from other roles' work

## Outputs

- A living Business Profile (ICP, positioning, tone, priorities, do's & don'ts)
- Flags/questions back to the manager (client) when understanding is ambiguous or stale

## Integrations

- The `business_profiles` table (see [docs/DATABASE.md](../docs/DATABASE.md)) is wired: the onboarding conversation at `/employee/:id/onboarding` (for the auto-hired `account_manager` employee) writes it via `POST /api/employees/[id]/complete-onboarding`, and the Lead Sourcer's first run reads `profile_md` directly as its search input — see [src/lib/employees.ts](../src/lib/employees.ts) and [src/lib/leadSearch.ts](../src/lib/leadSearch.ts). Design: the Business Profile is stored as markdown (a `profile_md` column) — the same form other roles' docs take — since it's read whole as LLM prompt context rather than queried field-by-field; a few structured columns (`user_id`, `updated_at`, `business_name`, `contact_name`) support the app-level lookups that don't need the full document. The onboarding question set today (ideal client, bad-fit criteria) is an initial pass — more questions will be added as the Business Profile deepens.

## Quality Bar

MBB-level, per [docs/QUALITY.md](../docs/QUALITY.md). The Business Profile must be precise enough that another employee could act on it without re-asking the client basic questions — vague ICP descriptions or generic positioning statements don't clear the bar.

## Evidence

(To be tracked and measured)

## Routine

- Conduct/refresh onboarding conversation with the client
- Periodically check in about changes in the business
- Review other roles' approved/rejected work for context gaps and quality-bar misses (see [docs/QUALITY.md](../docs/QUALITY.md))
- Update the Business Profile
- Surface open questions to the client

## Experience

- Corrections to its understanding over time
- Client's evolving priorities
- Patterns in what other roles get wrong due to missing context

## Do Not

(See [docs/ROLES.md](../docs/ROLES.md) for baseline rules every role follows.)

- Edit other employees' outputs directly
- Make hiring/firing decisions
- Contact the client's customers directly
