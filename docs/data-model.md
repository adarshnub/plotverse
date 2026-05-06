# Data Model

The TypeScript source of truth is `lib/types.ts`. The Supabase SQL equivalent is `supabase/schema.sql`.

## Core Records

### `properties`

Represents available real-estate inventory.

Important fields:

- `title`, `address`, `area`, `city`
- `propertyType`
- `price`
- `sizeSqft`, `bedrooms`, `bathrooms`
- `amenities`
- `notes`
- `source`
- `status`

### `clients`

Represents demand-side buyer or renter profiles.

Important fields:

- `name`, `contact`
- `budgetMin`, `budgetMax`
- `preferredAreas`
- `propertyType`
- `minBedrooms`, `minSizeSqft`
- `mustHaves`
- `dealBlockers`
- `urgency`
- `notes`

### `matches`

Represents a scored property-client pair.

Important fields:

- `propertyId`
- `clientId`
- `score`
- `ruleResult`
- `fitSummary`
- `objections`
- `suggestedNextAction`
- `status`

### `draftMessages`

Represents human-approved outbound draft workflow.

Important fields:

- `matchId`
- `channel`
- `tone`
- `body`
- `editedBody`
- `status`: `pending`, `approved`, or `rejected`

## Agent Records

### `agentModules`

Defines visible workflow nodes in the Lab canvas.

Important fields:

- `key`
- `label`
- `description`
- `inputSchema`
- `outputSchema`
- `promptSummary`
- `x`, `y`

### `agentEdges`

Defines module dependencies shown on the Lab canvas.

Important fields:

- `source`
- `target`
- `label`

### `agentRuns`

Stores each workflow execution.

Important fields:

- `workflowKey`
- `status`
- `mode`: `live` or `simulation`
- `selectedPropertyIds`
- `selectedClientIds`
- `summary`
- `model`

### `agentRunSteps`

Stores module-level trace data.

Important fields:

- `runId`
- `moduleKey`
- `status`
- `input`
- `output`
- `error`

## CSV Imports

`csvImports` records import attempts, row counts, validation errors, and status.
