import "server-only";

import { seedData } from "@/lib/seed";
import { readLocalData, updateLocalData, writeLocalData } from "@/lib/local-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AgentEdge,
  AgentModule,
  AgentRun,
  AgentRunStep,
  ClientRecord,
  CsvImport,
  DraftMessage,
  JsonRecord,
  MatchRecord,
  PlotverseData,
  PropertyRecord,
} from "@/lib/types";

export async function getData(): Promise<PlotverseData> {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    try {
      const [
        properties,
        clients,
        matches,
        draftMessages,
        agentModules,
        agentEdges,
        agentRuns,
        agentRunSteps,
        csvImports,
      ] = await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("draft_messages").select("*"),
        supabase.from("agent_modules").select("*"),
        supabase.from("agent_edges").select("*"),
        supabase.from("agent_runs").select("*"),
        supabase.from("agent_run_steps").select("*"),
        supabase.from("csv_imports").select("*"),
      ]);

      const responses = [properties, clients, matches, draftMessages, agentModules, agentEdges, agentRuns, agentRunSteps, csvImports];
      const firstError = responses.find((response) => response.error)?.error;
      if (firstError) throw firstError;

      return {
        properties: (properties.data ?? []).map(fromPropertyRow),
        clients: (clients.data ?? []).map(fromClientRow),
        matches: (matches.data ?? []).map(fromMatchRow),
        draftMessages: (draftMessages.data ?? []).map(fromDraftRow),
        agentModules: (agentModules.data ?? []).map(fromModuleRow).concat((agentModules.data?.length ? [] : seedData.agentModules)),
        agentEdges: (agentEdges.data ?? []).map(fromEdgeRow).concat((agentEdges.data?.length ? [] : seedData.agentEdges)),
        agentRuns: (agentRuns.data ?? []).map(fromRunRow),
        agentRunSteps: (agentRunSteps.data ?? []).map(fromStepRow),
        csvImports: (csvImports.data ?? []).map(fromCsvImportRow),
      };
    } catch {
      return readLocalData();
    }
  }

  return readLocalData();
}

export async function setData(data: PlotverseData) {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    await Promise.all([
      data.properties.length ? supabase.from("properties").upsert(data.properties.map(toPropertyRow)) : Promise.resolve(),
      data.clients.length ? supabase.from("clients").upsert(data.clients.map(toClientRow)) : Promise.resolve(),
      data.matches.length ? supabase.from("matches").upsert(data.matches.map(toMatchRow)) : Promise.resolve(),
      data.draftMessages.length ? supabase.from("draft_messages").upsert(data.draftMessages.map(toDraftRow)) : Promise.resolve(),
      data.agentModules.length ? supabase.from("agent_modules").upsert(data.agentModules.map(toModuleRow)) : Promise.resolve(),
      data.agentEdges.length ? supabase.from("agent_edges").upsert(data.agentEdges.map(toEdgeRow)) : Promise.resolve(),
      data.agentRuns.length ? supabase.from("agent_runs").upsert(data.agentRuns.map(toRunRow)) : Promise.resolve(),
      data.agentRunSteps.length ? supabase.from("agent_run_steps").upsert(data.agentRunSteps.map(toStepRow)) : Promise.resolve(),
      data.csvImports.length ? supabase.from("csv_imports").upsert(data.csvImports.map(toCsvImportRow)) : Promise.resolve(),
    ]);
    return;
  }

  await writeLocalData(data);
}

export async function updateData(mutator: (data: PlotverseData) => void | Promise<void>) {
  const supabase = createSupabaseAdminClient();
  if (supabase) {
    const data = await getData();
    await mutator(data);
    await setData(data);
    return data;
  }

  return updateLocalData(mutator);
}

export async function getDashboardData() {
  const data = await getData();
  const pendingDrafts = data.draftMessages.filter((draft) => draft.status === "pending");
  const reviewedMatches = data.matches.filter((match) => match.status !== "archived");
  const latestRuns = [...data.agentRuns]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 5);
  const latestImports = [...data.csvImports]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return {
    ...data,
    metrics: {
      properties: data.properties.length,
      clients: data.clients.length,
      matches: reviewedMatches.length,
      pendingDrafts: pendingDrafts.length,
    },
    latestRuns,
    latestImports,
  };
}

type Row = Record<string, unknown>;

const textArray = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);
const text = (value: unknown, fallback = "") => String(value ?? fallback);
const num = (value: unknown) => Number(value ?? 0);
const json = (value: unknown): JsonRecord => (value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {});

function fromPropertyRow(row: Row): PropertyRecord {
  return {
    id: text(row.id),
    title: text(row.title),
    address: text(row.address),
    area: text(row.area),
    city: text(row.city),
    propertyType: text(row.property_type),
    price: num(row.price),
    sizeSqft: num(row.size_sqft),
    bedrooms: num(row.bedrooms),
    bathrooms: num(row.bathrooms),
    status: text(row.status, "active") as PropertyRecord["status"],
    amenities: textArray(row.amenities),
    notes: text(row.notes),
    source: text(row.source),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toPropertyRow(item: PropertyRecord) {
  return {
    id: item.id,
    title: item.title,
    address: item.address,
    area: item.area,
    city: item.city,
    property_type: item.propertyType,
    price: item.price,
    size_sqft: item.sizeSqft,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    status: item.status,
    amenities: item.amenities,
    notes: item.notes,
    source: item.source,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromClientRow(row: Row): ClientRecord {
  return {
    id: text(row.id),
    name: text(row.name),
    contact: text(row.contact),
    budgetMin: num(row.budget_min),
    budgetMax: num(row.budget_max),
    preferredAreas: textArray(row.preferred_areas),
    propertyType: text(row.property_type),
    minBedrooms: num(row.min_bedrooms),
    minSizeSqft: num(row.min_size_sqft),
    mustHaves: textArray(row.must_haves),
    dealBlockers: textArray(row.deal_blockers),
    urgency: text(row.urgency, "medium") as ClientRecord["urgency"],
    notes: text(row.notes),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toClientRow(item: ClientRecord) {
  return {
    id: item.id,
    name: item.name,
    contact: item.contact,
    budget_min: item.budgetMin,
    budget_max: item.budgetMax,
    preferred_areas: item.preferredAreas,
    property_type: item.propertyType,
    min_bedrooms: item.minBedrooms,
    min_size_sqft: item.minSizeSqft,
    must_haves: item.mustHaves,
    deal_blockers: item.dealBlockers,
    urgency: item.urgency,
    notes: item.notes,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromMatchRow(row: Row): MatchRecord {
  return {
    id: text(row.id),
    propertyId: text(row.property_id),
    clientId: text(row.client_id),
    score: num(row.score),
    ruleResult: json(row.rule_result) as MatchRecord["ruleResult"],
    fitSummary: text(row.fit_summary),
    objections: textArray(row.objections),
    suggestedNextAction: text(row.suggested_next_action),
    status: text(row.status, "new") as MatchRecord["status"],
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toMatchRow(item: MatchRecord) {
  return {
    id: item.id,
    property_id: item.propertyId,
    client_id: item.clientId,
    score: item.score,
    rule_result: item.ruleResult,
    fit_summary: item.fitSummary,
    objections: item.objections,
    suggested_next_action: item.suggestedNextAction,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromDraftRow(row: Row): DraftMessage {
  return {
    id: text(row.id),
    matchId: text(row.match_id),
    channel: text(row.channel, "whatsapp") as DraftMessage["channel"],
    tone: text(row.tone, "warm") as DraftMessage["tone"],
    body: text(row.body),
    editedBody: text(row.edited_body),
    status: text(row.status, "pending") as DraftMessage["status"],
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toDraftRow(item: DraftMessage) {
  return {
    id: item.id,
    match_id: item.matchId,
    channel: item.channel,
    tone: item.tone,
    body: item.body,
    edited_body: item.editedBody,
    status: item.status,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromModuleRow(row: Row): AgentModule {
  return {
    id: text(row.id),
    key: text(row.key),
    label: text(row.label),
    description: text(row.description),
    inputSchema: text(row.input_schema),
    outputSchema: text(row.output_schema),
    promptSummary: text(row.prompt_summary),
    x: num(row.x),
    y: num(row.y),
  };
}

function toModuleRow(item: AgentModule) {
  return {
    id: item.id,
    key: item.key,
    label: item.label,
    description: item.description,
    input_schema: item.inputSchema,
    output_schema: item.outputSchema,
    prompt_summary: item.promptSummary,
    x: item.x,
    y: item.y,
  };
}

function fromEdgeRow(row: Row): AgentEdge {
  return { id: text(row.id), source: text(row.source), target: text(row.target), label: text(row.label) };
}

function toEdgeRow(item: AgentEdge) {
  return { id: item.id, source: item.source, target: item.target, label: item.label };
}

function fromRunRow(row: Row): AgentRun {
  return {
    id: text(row.id),
    workflowKey: text(row.workflow_key),
    status: text(row.status, "completed") as AgentRun["status"],
    mode: text(row.mode, "live") as AgentRun["mode"],
    selectedPropertyIds: textArray(row.selected_property_ids),
    selectedClientIds: textArray(row.selected_client_ids),
    summary: text(row.summary),
    model: text(row.model),
    tokenUsage: json(row.token_usage),
    startedAt: text(row.started_at),
    completedAt: row.completed_at ? text(row.completed_at) : undefined,
  };
}

function toRunRow(item: AgentRun) {
  return {
    id: item.id,
    workflow_key: item.workflowKey,
    status: item.status,
    mode: item.mode,
    selected_property_ids: item.selectedPropertyIds,
    selected_client_ids: item.selectedClientIds,
    summary: item.summary,
    model: item.model,
    token_usage: item.tokenUsage ?? {},
    started_at: item.startedAt,
    completed_at: item.completedAt,
  };
}

function fromStepRow(row: Row): AgentRunStep {
  return {
    id: text(row.id),
    runId: text(row.run_id),
    moduleKey: text(row.module_key),
    status: text(row.status, "completed") as AgentRunStep["status"],
    input: json(row.input),
    output: json(row.output),
    error: row.error ? text(row.error) : undefined,
    startedAt: text(row.started_at),
    completedAt: row.completed_at ? text(row.completed_at) : undefined,
  };
}

function toStepRow(item: AgentRunStep) {
  return {
    id: item.id,
    run_id: item.runId,
    module_key: item.moduleKey,
    status: item.status,
    input: item.input,
    output: item.output,
    error: item.error,
    started_at: item.startedAt,
    completed_at: item.completedAt,
  };
}

function fromCsvImportRow(row: Row): CsvImport {
  return {
    id: text(row.id),
    target: text(row.target, "properties") as CsvImport["target"],
    filename: text(row.filename),
    rowsTotal: num(row.rows_total),
    rowsImported: num(row.rows_imported),
    validationErrors: textArray(row.validation_errors),
    status: text(row.status, "imported") as CsvImport["status"],
    createdAt: text(row.created_at),
  };
}

function toCsvImportRow(item: CsvImport) {
  return {
    id: item.id,
    target: item.target,
    filename: item.filename,
    rows_total: item.rowsTotal,
    rows_imported: item.rowsImported,
    validation_errors: item.validationErrors,
    status: item.status,
    created_at: item.createdAt,
  };
}
