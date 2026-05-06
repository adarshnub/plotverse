# Architecture

Plotverse is a personal Next.js automation studio for matching real-estate properties with clients. The app is intentionally built as a working command center first, not a marketing site.

## Runtime Shape

- `app/` contains App Router pages and server actions.
- `components/` contains reusable UI and client-side interactive pieces.
- `lib/` contains domain logic, persistence, agent workflow execution, OpenAI integration, CSV parsing, and shared types.
- `supabase/schema.sql` contains the cloud persistence schema.
- `tests/` contains focused unit tests for core non-UI behavior.

## Data Flow

1. Properties and clients are created manually or imported by CSV.
2. `runMatchWorkflow` selects records and creates an `agent_run`.
3. Deterministic matching in `lib/matching.ts` creates a grounded baseline for each property-client pair.
4. When `OPENAI_API_KEY` is available, `aiEvaluateMatch` in `lib/openai.ts` performs AI-assisted matching and can refine score, pass/fail, explanation, objections, and next action.
5. Matches, run steps, and audit output are persisted.
6. Drafts are generated only when requested from a match.
7. Approval remains manual: drafts can be edited, copied, approved, or rejected, but v1 does not send messages.

## Persistence Strategy

The app has two persistence modes:

- Local mode: if Supabase env vars are missing, data is stored in `.local-data/plotverse.json`.
- Supabase mode: if Supabase env vars are present, `lib/store.ts` reads and writes the tables in `supabase/schema.sql`.

This keeps the product usable immediately while still supporting cloud-backed persistence.

## UI Architecture

- Data-heavy pages are server components.
- Interactive controls are client components, including draft tools, match runner, and the lab canvas.
- `components/lab-canvas.tsx` uses React Flow to visualize agent modules and dependencies.
- The visual direction is dense, operational, and personal: compact tables, audit panels, canvas inspection, and approval queues.
