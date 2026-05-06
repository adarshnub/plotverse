# Plotverse

Personal multi-agent automation studio for matching possible real-estate properties with possible clients.

## Local setup

```bash
npm install
npm run dev
```

The app runs without cloud credentials by using `.local-data/plotverse.json`.

For Supabase/OpenAI-backed runs, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
```
