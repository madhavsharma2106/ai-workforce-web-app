# User Journey: Hiring & Managing Emma, the Lead Sourcer

## 1. Overview

**Persona**
A founder running a small business who needs outbound sales pipeline but has no time (or dedicated staff) to research leads and write outreach emails every day. Not technical; thinks in terms of "hiring help," not "configuring software."

**User Goal**
Get a steady stream of qualified, personalized outbound leads without doing the research or writing themselves — by "hiring" an AI employee (Emma, the Lead Sourcer) and reviewing her work each day.

**Preconditions**

- User can articulate, in plain language, what their business does, their ideal client, and what a bad lead looks like — conversationally, in response to Alex's (the Account Manager's) questions.
- Every hire — Alex, Emma, or Oliver — is a row in the `employees` table (see [DATABASE.md](DATABASE.md)) with its own onboarding page and home page at `/employee/:id` and `/employee/:id/onboarding`. Alex is auto-hired the first time a user reaches `/` authenticated with no `account_manager` employee row yet — that row's presence/absence is the first-run signal, not `business_profiles`.
- Approving one of Emma's leads is blocked server-side until Oliver (Sales Representative) is hired — see [src/app/api/leads/[id]/route.ts](../src/app/api/leads/[id]/route.ts).

---

## 2. User Journey Diagram

```mermaid
flowchart TD
    A["/ — public landing page:<br/>pitch + Login/Sign up CTA"] --> B["/login"]
    B --> C{Account Manager<br/>employee row exists?}
    C -->|No| D["Auto-hire Alex, redirect to<br/>/employee/:id/onboarding"]
    D --> E["Alex's onboarding conversation:<br/>business, ICP, bad-fit criteria,<br/>value prop, tone"]
    E --> F["Business Profile written;<br/>redirect to /dashboard"]
    C -->|Yes| F2["/dashboard"]
    F --> F2
    F2 --> G["Hire: choose a role<br/>(Lead Sourcer)"]
    G --> H["/employee/:id/onboarding —<br/>Emma's onboarding, kicks off<br/>one real lead search"]
    H --> I["/employee/:id — Emma's home:<br/>status, stats, Daily Report,<br/>Approval Queue"]
    I --> J{Review a draft}
    J -->|Approve / Edit then Approve| K[Lead's verified email revealed<br/>draft still sent manually — no send integration yet]
    J -->|Reject| I
    K --> I
```

## 3. Journey Details Table

| Stage                          | User Goal                                                | User Action                                     | System Behavior                                                                                                                                                                                                                                                            | Pain Points                                                                                        | Success Metric                                                                                    |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Landing page (`/`)             | Understand what the product does                         | Views pitch                                     | Shows single CTA to log in / sign up; if already authenticated, `/` never renders the pitch — it redirects onward instead                                                                                                                                                 | Unclear value prop if pitch is too abstract                                                        | % of visitors who click the CTA                                                                   |
| Login (`/login`)               | Get into the product                                     | Logs in / signs up                              | Authenticates via Supabase, then `/` decides where to send the user based on whether an `account_manager` employee row exists                                                                                                                                             | Friction from auth itself (magic-link email round trip)                                            | Login completion rate                                                                              |
| Alex's onboarding (`/employee/:id/onboarding`) | Get the product set up to understand the business | Answers Alex's questions (business name, business description, ideal client, bad-fit criteria, value proposition, tone, optional priorities, optional do's/don'ts, name) | Only reached when no Account Manager employee exists yet (auto-hired); Alex asks questions conversationally and writes the Business Profile so every future role can reuse it without re-asking                                                                          | Conversational format may feel slower than a form for some users                                   | % of first-run users who complete onboarding and reach `/dashboard`                                |
| Alex's home (`/employee/:id`)  | See what Alex knows and correct anything wrong           | Views the Business Profile; optionally clicks "Update profile" and edits a field | Renders the full Business Profile read from `business_profiles`, plus a "Supporting" list of other hired employees who read it; editing writes back via `/api/employees/[id]/business-profile` so the profile stays current between onboarding and future check-ins | No conversational re-ask yet — corrections are a form, not a chat with Alex                        | Reduction in corrections/feedback other employees receive (per [roles/account-manager.md](../roles/account-manager.md)) |
| Choose a role (`/dashboard`)   | Decide who to hire                                       | Selects a role to hire (Lead Sourcer and Sales Representative are each independently hireable)             | Roster of hired employees plus a hire catalog; each role shows as hireable until the user has one, then links to that employee's page instead                                                                                                                                      | May feel like an unnecessary extra click                                                           | % who proceed past role selection                                                                 |
| Emma's onboarding (`/employee/:id/onboarding`) | Finish hiring                             | Confirms hire                                   | Marks the employee active and kicks off the first real lead search, seeded from Alex's Business Profile                                                                                                                                                                   | Waiting on live search results                                                                     | Hire completion rate                                                                               |
| Emma's home (`/employee/:id`)  | Review Emma's work and see what she's found for this run | Approves, rejects, or edits draft leads/emails  | Renders status, stats, today's report, and Approval Queue together; approving a lead is blocked until Oliver (Sales Representative) is hired, then reveals its verified email address, but the drafted email is still sent manually — no send integration yet; feedback will shape future runs once recurring automation ships          | Reviewing every item may feel like a chore; no history view yet, and this run isn't persisted — a reload loses it | Approved email drafts (core success metric per [roles/lead-sourcer.md](../roles/lead-sourcer.md)) |

**Note:** Emma's hire flow no longer asks for ideal client / good-fit criteria — that's now covered once by Alex's Business Profile, which her first search reads directly. Her onboarding today is a single placeholder question; her real question set (lead-type preferences, etc.) is designed later.

**Planned, not yet built:** step K's "draft still sent manually" is the target for Oliver, the Sales Representative (see [roles/sales-representative.md](../roles/sales-representative.md)). Once built, approving a draft hands it to Oliver, who sends it from the founder's own Outlook account after a final approval step, then monitors replies — rather than the founder copying the draft out by hand.
