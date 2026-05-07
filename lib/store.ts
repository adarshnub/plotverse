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
  ScrapeItem,
  ScrapeRun,
  ScrapeSource,
  TokenUsageEvent,
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
        scrapeSources,
        scrapeRuns,
        scrapeItems,
        tokenUsageEvents,
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
        supabase.from("scrape_sources").select("*"),
        supabase.from("scrape_runs").select("*"),
        supabase.from("scrape_items").select("*"),
        supabase.from("token_usage_events").select("*"),
      ]);

      const responses = [
        properties,
        clients,
        matches,
        draftMessages,
        agentModules,
        agentEdges,
        agentRuns,
        agentRunSteps,
        csvImports,
        scrapeSources,
        scrapeRuns,
        scrapeItems,
        tokenUsageEvents,
      ];
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
        scrapeSources: (scrapeSources.data ?? []).map(fromScrapeSourceRow).concat(scrapeSources.data?.length ? [] : seedData.scrapeSources),
        scrapeRuns: (scrapeRuns.data ?? []).map(fromScrapeRunRow),
        scrapeItems: (scrapeItems.data ?? []).map(fromScrapeItemRow),
        tokenUsageEvents: (tokenUsageEvents.data ?? []).map(fromTokenUsageRow),
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
      data.scrapeSources.length ? supabase.from("scrape_sources").upsert(data.scrapeSources.map(toScrapeSourceRow)) : Promise.resolve(),
      data.scrapeRuns.length ? supabase.from("scrape_runs").upsert(data.scrapeRuns.map(toScrapeRunRow)) : Promise.resolve(),
      data.scrapeItems.length ? supabase.from("scrape_items").upsert(data.scrapeItems.map(toScrapeItemRow)) : Promise.resolve(),
      data.tokenUsageEvents.length ? supabase.from("token_usage_events").upsert(data.tokenUsageEvents.map(toTokenUsageRow)) : Promise.resolve(),
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
    landDetails: json(row.land_details) as unknown as PropertyRecord["landDetails"],
    sourceUrl: row.source_url ? text(row.source_url) : undefined,
    sourceSite: row.source_site ? text(row.source_site) : undefined,
    scrapedAt: row.scraped_at ? text(row.scraped_at) : undefined,
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
    land_details: item.landDetails ?? {},
    source_url: item.sourceUrl,
    source_site: item.sourceSite,
    scraped_at: item.scrapedAt,
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

function fromScrapeSourceRow(row: Row): ScrapeSource {
  return {
    id: text(row.id),
    key: text(row.key),
    name: text(row.name),
    kind: text(row.kind, "property") as ScrapeSource["kind"],
    baseUrl: text(row.base_url),
    searchUrl: text(row.search_url),
    enabled: Boolean(row.enabled),
    notes: text(row.notes),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toScrapeSourceRow(item: ScrapeSource) {
  return {
    id: item.id,
    key: item.key,
    name: item.name,
    kind: item.kind,
    base_url: item.baseUrl,
    search_url: item.searchUrl,
    enabled: item.enabled,
    notes: item.notes,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromScrapeRunRow(row: Row): ScrapeRun {
  return {
    id: text(row.id),
    scope: text(row.scope),
    status: text(row.status, "completed") as ScrapeRun["status"],
    sourceIds: textArray(row.source_ids),
    itemsFound: num(row.items_found),
    itemsImported: num(row.items_imported),
    errors: textArray(row.errors),
    startedAt: text(row.started_at),
    completedAt: row.completed_at ? text(row.completed_at) : undefined,
  };
}

function toScrapeRunRow(item: ScrapeRun) {
  return {
    id: item.id,
    scope: item.scope,
    status: item.status,
    source_ids: item.sourceIds,
    items_found: item.itemsFound,
    items_imported: item.itemsImported,
    errors: item.errors,
    started_at: item.startedAt,
    completed_at: item.completedAt,
  };
}

function fromScrapeItemRow(row: Row): ScrapeItem {
  return {
    id: text(row.id),
    runId: text(row.run_id),
    sourceId: text(row.source_id),
    kind: text(row.kind, "plot") as ScrapeItem["kind"],
    status: text(row.status, "review") as ScrapeItem["status"],
    title: text(row.title),
    locality: text(row.locality),
    district: text(row.district),
    price: num(row.price),
    plotArea: num(row.plot_area),
    areaUnit: text(row.area_unit, "unknown") as ScrapeItem["areaUnit"],
    plotAreaSqft: num(row.plot_area_sqft),
    pricePerCent: num(row.price_per_cent),
    sourceUrl: text(row.source_url),
    sourceSite: text(row.source_site),
    rawText: text(row.raw_text),
    contactName: text(row.contact_name),
    visibleContact: text(row.visible_contact),
    leadType: text(row.lead_type, "unknown") as ScrapeItem["leadType"],
    requirementText: text(row.requirement_text),
    preferredAreas: textArray(row.preferred_areas),
    budgetMin: num(row.budget_min),
    budgetMax: num(row.budget_max),
    purpose: text(row.purpose),
    confidence: num(row.confidence),
    duplicateOf: row.duplicate_of ? text(row.duplicate_of) : undefined,
    normalized: json(row.normalized),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function toScrapeItemRow(item: ScrapeItem) {
  return {
    id: item.id,
    run_id: item.runId,
    source_id: item.sourceId,
    kind: item.kind,
    status: item.status,
    title: item.title,
    locality: item.locality,
    district: item.district,
    price: item.price,
    plot_area: item.plotArea,
    area_unit: item.areaUnit,
    plot_area_sqft: item.plotAreaSqft,
    price_per_cent: item.pricePerCent,
    source_url: item.sourceUrl,
    source_site: item.sourceSite,
    raw_text: item.rawText,
    contact_name: item.contactName,
    visible_contact: item.visibleContact,
    lead_type: item.leadType,
    requirement_text: item.requirementText,
    preferred_areas: item.preferredAreas,
    budget_min: item.budgetMin,
    budget_max: item.budgetMax,
    purpose: item.purpose,
    confidence: item.confidence,
    duplicate_of: item.duplicateOf,
    normalized: item.normalized,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function fromTokenUsageRow(row: Row): TokenUsageEvent {
  return {
    id: text(row.id),
    actionType: text(row.action_type, "match-evaluation") as TokenUsageEvent["actionType"],
    actionLabel: text(row.action_label),
    model: text(row.model),
    inputTokens: num(row.input_tokens),
    cachedInputTokens: num(row.cached_input_tokens),
    outputTokens: num(row.output_tokens),
    reasoningTokens: num(row.reasoning_tokens),
    totalTokens: num(row.total_tokens),
    inputCostUsd: num(row.input_cost_usd),
    outputCostUsd: num(row.output_cost_usd),
    totalCostUsd: num(row.total_cost_usd),
    pricingSource: text(row.pricing_source),
    relatedRunId: row.related_run_id ? text(row.related_run_id) : undefined,
    relatedEntityId: row.related_entity_id ? text(row.related_entity_id) : undefined,
    metadata: json(row.metadata),
    createdAt: text(row.created_at),
  };
}

function toTokenUsageRow(item: TokenUsageEvent) {
  return {
    id: item.id,
    action_type: item.actionType,
    action_label: item.actionLabel,
    model: item.model,
    input_tokens: item.inputTokens,
    cached_input_tokens: item.cachedInputTokens,
    output_tokens: item.outputTokens,
    reasoning_tokens: item.reasoningTokens,
    total_tokens: item.totalTokens,
    input_cost_usd: item.inputCostUsd,
    output_cost_usd: item.outputCostUsd,
    total_cost_usd: item.totalCostUsd,
    pricing_source: item.pricingSource,
    related_run_id: item.relatedRunId,
    related_entity_id: item.relatedEntityId,
    metadata: item.metadata,
    created_at: item.createdAt,
  };
}
