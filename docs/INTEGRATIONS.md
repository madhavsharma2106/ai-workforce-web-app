# Integrations

Third-party data sources and services AI employees pull from. Each integration is a single file under `src/lib/integrations/` exporting typed functions — no shared base class (see PRINCIPLES.md: don't abstract until a second integration proves what's shared).

| Integration | File | Used for | Env var | Used by |
|---|---|---|---|---|
| Apollo.io | `src/lib/integrations/apollo.ts` | Lead search (`searchPeople`) and email reveal (`revealEmail`) | `APOLLO_API_KEY` | Lead Sourcer, via `src/app/api/leads/search` and `src/app/api/leads/reveal-email` |
| Anthropic Claude | `src/lib/agents/model.ts` | Powers all employee reasoning and tool-use (MVP; provider is swappable — see [AGENTS.md](AGENTS.md)) | `ANTHROPIC_API_KEY` | Every employee, via `src/lib/agents/runTurn.ts` |
| Outlook (Microsoft Graph) | Not built yet — no file under `src/lib/integrations/` | Sending approved emails from the founder's own account; monitoring replies | TBD | Sales Representative, see [roles/sales-representative.md](../roles/sales-representative.md) |

Add a row here whenever a new integration file is added.
