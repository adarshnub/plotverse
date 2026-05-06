# Testing

Plotverse uses Vitest for focused unit tests and Next.js build checks for route compilation.

## Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Current Coverage

### CSV Tests

File: `tests/csv.test.ts`

Checks:

- quoted CSV parsing
- property row mapping
- client validation errors

### Matching Tests

File: `tests/matching.test.ts`

Checks:

- strong fits pass with a high score
- weak fits remain score-bounded and expose warnings

### Draft Tests

File: `tests/drafts.test.ts`

Checks:

- pending drafts can transition to approved while preserving edited copy

## Manual Acceptance Checks

After `npm run dev`, verify:

- `/` loads the dashboard.
- `/properties` can create or import properties.
- `/clients` can create or import clients.
- `/matches` can run matching and generate drafts.
- `/drafts` can edit, copy, approve, and reject drafts.
- `/runs` shows traces after matching or lab runs.
- `/lab` shows draggable modules and can run a simulation.
