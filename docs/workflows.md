# Workflows

## Property And Client Entry

Properties and clients enter the system in two ways:

- Manual forms on `/properties` and `/clients`.
- CSV import forms on the same pages.

CSV parsing and mapping live in `lib/csv.ts`. Import attempts are logged in `csvImports`.

## Matching Workflow

Triggered from the overview or matches page through `runMatchesAction`.

Execution path:

1. `runMatchesAction` calls `runMatchWorkflow`.
2. `property-normalizer` records selected property facts.
3. `client-normalizer` records selected client facts.
4. `rule-matcher` builds scored matches through `buildMatch`.
5. Passing matches are enriched by `fit-analyst` through OpenAI when available.
6. `objection-finder` records warnings and objections.
7. `draft-writer` records that drafts are generated separately on demand.
8. `approval-gate` records that outbound actions remain blocked.
9. `run-reporter` persists a summary and trace.

The workflow returns:

- `run`
- `steps`
- ranked `matches`

## Draft Workflow

Triggered from `/matches` by clicking Draft.

Execution path:

1. `generateDraft` finds the match, property, and client.
2. `draftOutreach` asks OpenAI for a concise draft if `OPENAI_API_KEY` exists.
3. If OpenAI is unavailable, a local fallback message is generated.
4. A `draftMessage` is stored with `pending` status.
5. The match status becomes `drafted`.

The user can then edit, copy, approve, or reject the draft on `/drafts`.

## Lab Workflow

Triggered from `/lab`.

Execution path:

1. User selects a property and client.
2. `runLabTest` calls `runMatchWorkflow` in `simulation` mode.
3. The workflow creates an `agent_run` and module-level steps.
4. The Lab canvas shows modules, dependencies, inspector details, and latest trace output.

Lab mode does not send outbound messages or create arbitrary production workflows in v1.
