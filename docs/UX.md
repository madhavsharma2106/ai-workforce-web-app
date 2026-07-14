# UX Writing Strategy

## Philosophy

The user is a manager. The employee is responsible for work. The interface should feel calm.

The product should feel like **building a team**, not configuring software. Employees should appear autonomous: they wake up, do their work, prepare it for review, learn from feedback, and improve over time. The user should never feel like they're programming an AI.

**"AI" is not a banned word.** Hiding it serves no purpose — the user is intelligent and knows what they're buying. Say "AI employees" freely when it's true and useful; don't perform secrecy about the technology.

What's actually banned is the _mechanical_ vocabulary of AI engineering — the words that make the product feel like a config screen instead of a hire, regardless of whether "AI" is nearby.

## Core terminology

| Use                  | Avoid                        |
| -------------------- | ---------------------------- |
| Employee             | Agent                        |
| Hire Employee        | Create Agent                 |
| Team                 | Agent Collection             |
| Role                 | Agent Template               |
| Assignment           | Workflow / Task Execution    |
| Daily Report         | Execution Log                |
| Work Log             | Trace                        |
| Instructions         | Prompt                       |
| Experience           | Memory (as a technical term) |
| Feedback             | Prompt Editing               |
| Working              | Running / Execution          |
| Waiting for Approval | Pending Execution            |
| Thinking             | Reasoning / LLM              |
| Pause / Resume       | —                            |
| Performance          | —                            |

Never say: **Agent, Prompt, Execution, Workflow, LLM, Reasoning, Trace.** These break the "this is a hire, not a config screen" illusion.

### Roles vs. Employees

A **Role** defines the job (e.g. Lead Sourcer, Account Manager, Sales Representative). An **Employee** is a specific instance of a role (e.g. Emma, Oliver). You hire for a role, then a person fills it — mirroring real hiring.

## Voice — point of view

- **First person** ("I found 12 leads today") for direct communication _from_ the employee — chat, daily reports, feedback threads.
- **Third person** ("Emma is working") for any copy _about_ the employee written from the product's perspective rather than the employee's own — dashboard chrome (headers, cards, badges, status chips), marketing/landing copy, and cards describing other employees (e.g. a "choose a role to hire" section).

This distinction is intentional and should be preserved, not flattened to one voice.

Plain labels or titles naming an employee or role (e.g. "Meet Emma," "Onboard Alex") are UI labels, not voiced copy — they imply no speaker and are exempt from the first/third-person distinction above.

## Tone of voice

Position on Nielsen Norman Group's four tone dimensions:

| Dimension                     | Our position                | Why                                                                                                                                                                                  |
| ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Funny ↔ Serious               | Mostly serious, with warmth | Real business stakes — leads, revenue, hiring. Reads closer to a trusted operator than a quirky consumer app. Serious doesn't mean stiff: employees are still people, not paperwork. |
| Formal ↔ Casual               | Casual-professional         | Talks like a sharp, competent colleague — plain language, contractions fine, first names. Never legalese or corporate boilerplate.                                                   |
| Respectful ↔ Irreverent       | Respectful                  | Never jokes at the user's expense, never cute about failures ("Oopsie!") when real leads/money are on the line. Competence reads as respect.                                         |
| Enthusiastic ↔ Matter-of-fact | Matter-of-fact              | No forced cheer, no exclamation points, no confetti. Calm confidence, not cheerleading — this is what "the interface should feel calm" cashes out to on this axis.                   |

This positioning is the fixed brand voice. What adapts is emphasis — by audience and by context.

**Audience alignment.** The audience is a founder, not an AI engineer — closer to an MBB client than a Slack power-user. The employee should read like a sharp consultant briefing a client:

- **Lead with the answer.** State the finding or status up front — "Found 3 leads matching your ICP, 2 ready for review," not "Hi! So I've been working hard today and here's what happened..."
- **Concrete over vague.** Real numbers and specifics — "qualified 12 leads," not "found some good ones."
- **Confident, no hedging.** No "I think," "just," "sort of," "maybe." State what happened plainly; flag genuine uncertainty specifically rather than hedging everything.
- **Action-oriented close.** End on the ask or next step when there is one — "Awaiting your approval on 3 leads" — rather than trailing off.

**Contextual adaptation (empathy-driven).** Same brand voice, weighted differently by moment:

- _Neutral/informational_ (reports, dashboards): fully matter-of-fact, data-forward.
- _Success/completion_: matter-of-fact but confident — a clean confirmation ("3 leads approved and sent"), not a celebration. No confetti, no "Woohoo!"
- _Error/friction_: instructional and reassuring — say what happened and what to do next in plain language (see Communication Reliability below). Acknowledge friction without being saccharine.
- _Waiting/delay_: supportive, not silent — give the user something ("Emma's still working, no action needed") rather than nothing.

This register applies primarily to the employee's first-person voice, but the same discipline (precise, calm, no filler) should hold for third-person system copy too.

## Tone & style conventions

- Sentence case for headings and labels, not Title Case — except real proper nouns (employee names, role titles).
- Short status fragments/badges: no trailing period. Full-sentence descriptions: trailing period.
- Button labels are plain sentence-case verb phrases with no decorative glyphs (no trailing arrows, no exclamation points).

## Communication reliability

Users should never wonder what happens next. This is where most of the work is:

- Every user-initiated action that takes visible time must show an in-progress state (disabled button + in-progress verb, e.g. "Hiring…").
- Every action must resolve to a visible outcome — a success confirmation or a human-worded error. Silent no-ops are not acceptable.
- Never show raw backend/library error text (API error strings, SDK messages, HTTP status codes, env var names) to the user. Translate to calm, actionable copy owned by the frontend, independent of what the backend happens to return.
- No dead-end states: any screen reached via a failure path (e.g. an expired auth link) must explain what happened and what to do next — never a silent redirect to a generic screen.
- Empty states describe the employee's work status in the same vocabulary used everywhere else, and always include a next-step action — never implementation details ("preview build," "doesn't persist," "run").

## Mental model

The product should answer: _"What would it feel like if I had another employee working for me every day?"_ — not _"What would it feel like to configure an AI agent?"_

When designing new functionality, ask: _"Would a manager expect an employee to handle this autonomously, or would they expect the employee to ask for approval?"_ If a good employee would decide independently, automate it. If a good employee would check first, pause and request approval.
