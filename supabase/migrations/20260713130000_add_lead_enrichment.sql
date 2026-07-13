-- Richer per-lead facts, sourced from the same Apollo response already paid
-- for per candidate (see src/lib/integrations/apollo.ts) plus a short,
-- literal snippet from the site research the model was given. All nullable:
-- older leads predate this and Apollo doesn't always have every field.
alter table public.leads
  add column research_snippet text,
  add column industry text,
  add column employee_count integer,
  add column location text,
  add column founded_year integer,
  add column company_linkedin_url text,
  add column contact_linkedin_url text,
  add column contact_seniority text,
  add column contact_departments text[];
