# Integrations

Third-party data sources and services AI employees pull from. Each integration is a single file under `src/lib/integrations/` exporting typed functions — no shared base class (see PRINCIPLES.md: don't abstract until a second integration proves what's shared).

| Integration | File | Used for | Env var | Used by |
|---|---|---|---|---|
| Apollo.io | `src/lib/integrations/apollo.ts` | Lead search (`searchPeople`) and email reveal (`revealEmail`) | `APOLLO_API_KEY` | Lead Sourcer, via `src/app/api/leads/search` and `src/app/api/leads/reveal-email` |

Add a row here whenever a new integration file is added.
