# Creating a Role

A Role is a job definition (see [TERMINOLOGY.md](TERMINOLOGY.md): Role vs. Employee). Every Role lives at `roles/<role-name>.md` and follows the same template, so any employee's job is legible at a glance and the product can eventually treat hiring/routines generically instead of one-off per role.

## Template

Use this exact section order — see [roles/lead-sourcer.md](../roles/lead-sourcer.md) as the reference example:

```
# <Role Name>

## Role
## Mission
## Success Metric
## Inputs
## Outputs
## Integrations
## Quality Bar
## Evidence
## Routine
## Experience
## Do Not
```

## What goes in each section

- **Role** — the job title as it appears in the hiring flow. Plain, real-world job language (see [TERMINOLOGY.md](TERMINOLOGY.md)) — not "Agent" or "Bot."
- **Mission** — one sentence: what the role exists to accomplish, not what it does day to day.
- **Success Metric** — one metric, ideally instrumentable. If you can't name a single number that tells you this role is working, it isn't scoped yet.
- **Inputs** — what the role consumes: client-provided info, feedback, other roles' output, integrations. Mark anything not built yet as "future integration, not built yet" rather than omitting it.
- **Outputs** — the actual work product a human (or another employee) sees and acts on.
- **Integrations** — real, named third-party services/files the role calls, or "None yet." Anything listed here must also appear in [INTEGRATIONS.md](INTEGRATIONS.md).
- **Quality Bar** — the role-specific translation of [QUALITY.md](QUALITY.md). Say what an MBB-level version of this role's Outputs actually looks like — and what falls short — don't just link the doc.
- **Evidence** — how this role's quality/performance gets tracked over time. "(To be tracked and measured)" is fine pre-launch, but don't skip the section.
- **Routine** — the ordered list of what the role does when it wakes up. This is the loop, not a feature list.
- **Experience** — what the role learns from over time (feedback, rejected/approved work, patterns). Ties to "Learning happens through feedback, not instruction editing" in [PRINCIPLES.md](PRINCIPLES.md).
- **Do Not** — role-specific boundaries only (see Baseline below for what's already covered for every role): ways this role could overstep into another role's job, or a limit unique to what it has access to.

## Baseline Do Not rules (every role)

Every role automatically inherits these from [PRINCIPLES.md](PRINCIPLES.md) — don't restate them in a role's own Do Not section:

- Never spend money
- Never take an irreversible action without human approval ("Humans approve irreversible actions")

A role's Do Not section should list only what's specific to it, on top of this baseline.

## Check against these before adding a role

- [ANTI_GOALS.md](ANTI_GOALS.md) — does this role turn the product into an automation platform, no-code builder, or CRM replacement in disguise?
- [MVP.md](MVP.md) — is the role actually in scope, or does it belong in [IDEAS.md](IDEAS.md) under "Future Roles" for now?
- [PRINCIPLES.md](PRINCIPLES.md) — does it own a goal (not a task list), with genuine autonomy and approval gated only on irreversible actions?
- [QUALITY.md](QUALITY.md) — can you write a real, specific Quality Bar section? If you can't say what "good" looks like yet, the role isn't ready to build.
- [TERMINOLOGY.md](TERMINOLOGY.md) — does the role's name and language fit "hiring a person," not "configuring an agent"?

## Adding the role

1. Write `roles/<role-name>.md` using the template above.
2. In MVP scope → add it to `docs/MVP.md` under Included.
3. Speculative/future → add it to `docs/IDEAS.md` under "Future Roles" instead, and don't write the full file yet. An unbuilt role doesn't need a Routine or Integrations section that will just go stale.
4. Add any new integrations to `docs/INTEGRATIONS.md`.
