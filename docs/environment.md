# Environment

Use `.env.example` as the template for `.env.local`.

## Variables

### `NEXT_PUBLIC_APP_URL`

Local app URL. Defaults conceptually to:

```bash
http://localhost:3000
```

### `NEXT_PUBLIC_SUPABASE_URL`

Supabase project URL.

If missing, the app uses `.local-data/plotverse.json`.

### `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Supabase browser-safe publishable key.

Used by Supabase SSR setup.

### `SUPABASE_SERVICE_ROLE_KEY`

Server-only Supabase service role key.

Used by `lib/store.ts` for server-side persistence. Keep this secret and never expose it to client components.

### `OPENAI_API_KEY`

Server-only OpenAI API key.

If missing, Plotverse uses deterministic matching and fallback draft text.

### `OPENAI_MODEL`

Model used by OpenAI-backed modules.

Default in code:

```bash
gpt-5
```

Currently used by:

- Rule Matcher / AI Match Evaluator
- Fit Analyst
- Outreach Draft Writer
- Kottayam Plot/Lead Normalizer during ingestion

## Cost Tracking

Token usage is stored in `token_usage_events` for OpenAI-backed actions.

Built-in estimated pricing currently covers:

- `gpt-4.1-mini`: $0.40 / 1M input tokens, $0.10 / 1M cached input tokens, $1.60 / 1M output tokens.

For another model, set:

```bash
OPENAI_INPUT_COST_PER_1M_USD=
OPENAI_CACHED_INPUT_COST_PER_1M_USD=
OPENAI_OUTPUT_COST_PER_1M_USD=
```

Costs are estimates based on API token usage and configured rates.

## Scraping Runtime

Playwright is installed as a dev dependency for source adapters. If local browser binaries are missing, run:

```bash
npx playwright install chromium
```

Adapters also record source-level failures, so one blocked portal should not break the entire Kottayam ingestion run.

## Local-Only Mode

For local-only testing, no env vars are required.

Run:

```bash
npm run dev
```

Data will be created in `.local-data/plotverse.json`.

## Supabase Mode

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Fill Supabase and OpenAI variables.
5. Restart the dev server.
