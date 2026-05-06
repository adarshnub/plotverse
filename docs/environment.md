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

- Fit Analyst
- Outreach Draft Writer

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
