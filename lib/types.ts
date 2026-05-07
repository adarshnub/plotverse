export type PropertyStatus = "new" | "active" | "reserved" | "closed";
export type MatchStatus = "new" | "reviewed" | "drafted" | "archived";
export type DraftStatus = "pending" | "approved" | "rejected";
export type AgentRunStatus = "queued" | "running" | "completed" | "failed";
export type ScrapeSourceKind = "property" | "lead" | "reference";
export type ScrapeRunStatus = "queued" | "running" | "completed" | "failed" | "partial";
export type ScrapeItemStatus = "review" | "approved" | "rejected" | "imported" | "duplicate";
export type TokenUsageActionType = "match-evaluation" | "draft-generation" | "scrape-normalization";

export type JsonRecord = Record<string, unknown>;

export interface PropertyRecord {
  id: string;
  title: string;
  address: string;
  area: string;
  city: string;
  propertyType: string;
  price: number;
  sizeSqft: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  amenities: string[];
  notes: string;
  source: string;
  landDetails?: LandDetails;
  sourceUrl?: string;
  sourceSite?: string;
  scrapedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandDetails {
  plotArea: number;
  areaUnit: "cent" | "acre" | "sqft" | "sqm" | "unknown";
  plotAreaSqft: number;
  pricePerCent: number;
  pricePerSqft: number;
  roadFrontage: string;
  roadWidth: string;
  zoningUse: string;
  ownership: string;
  boundaryWall: boolean | null;
  waterAvailability: boolean | null;
  electricityAvailability: boolean | null;
  surveyNotes: string;
}

export interface ClientRecord {
  id: string;
  name: string;
  contact: string;
  budgetMin: number;
  budgetMax: number;
  preferredAreas: string[];
  propertyType: string;
  minBedrooms: number;
  minSizeSqft: number;
  mustHaves: string[];
  dealBlockers: string[];
  urgency: "low" | "medium" | "high";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchRecord {
  id: string;
  propertyId: string;
  clientId: string;
  score: number;
  ruleResult: {
    passed: boolean;
    reasons: string[];
    warnings: string[];
  };
  fitSummary: string;
  objections: string[];
  suggestedNextAction: string;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DraftMessage {
  id: string;
  matchId: string;
  channel: "whatsapp" | "email" | "call";
  tone: "concise" | "warm" | "premium";
  body: string;
  editedBody: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentModule {
  id: string;
  key: string;
  label: string;
  description: string;
  inputSchema: string;
  outputSchema: string;
  promptSummary: string;
  x: number;
  y: number;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

export interface AgentRunStep {
  id: string;
  runId: string;
  moduleKey: string;
  status: AgentRunStatus;
  input: JsonRecord;
  output: JsonRecord;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentRun {
  id: string;
  workflowKey: string;
  status: AgentRunStatus;
  mode: "simulation" | "live";
  selectedPropertyIds: string[];
  selectedClientIds: string[];
  summary: string;
  model: string;
  tokenUsage?: JsonRecord;
  startedAt: string;
  completedAt?: string;
}

export interface CsvImport {
  id: string;
  target: "properties" | "clients";
  filename: string;
  rowsTotal: number;
  rowsImported: number;
  validationErrors: string[];
  status: "previewed" | "imported" | "failed";
  createdAt: string;
}

export interface ScrapeSource {
  id: string;
  key: string;
  name: string;
  kind: ScrapeSourceKind;
  baseUrl: string;
  searchUrl: string;
  enabled: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScrapeRun {
  id: string;
  scope: string;
  status: ScrapeRunStatus;
  sourceIds: string[];
  itemsFound: number;
  itemsImported: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
}

export interface ScrapeItem {
  id: string;
  runId: string;
  sourceId: string;
  kind: "plot" | "lead" | "reference";
  status: ScrapeItemStatus;
  title: string;
  locality: string;
  district: string;
  price: number;
  plotArea: number;
  areaUnit: LandDetails["areaUnit"];
  plotAreaSqft: number;
  pricePerCent: number;
  sourceUrl: string;
  sourceSite: string;
  rawText: string;
  contactName: string;
  visibleContact: string;
  leadType: "buyer" | "broker" | "seller" | "unknown";
  requirementText: string;
  preferredAreas: string[];
  budgetMin: number;
  budgetMax: number;
  purpose: string;
  confidence: number;
  duplicateOf?: string;
  normalized: JsonRecord;
  createdAt: string;
  updatedAt: string;
}

export interface TokenUsageEvent {
  id: string;
  actionType: TokenUsageActionType;
  actionLabel: string;
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  pricingSource: string;
  relatedRunId?: string;
  relatedEntityId?: string;
  metadata: JsonRecord;
  createdAt: string;
}

export interface PlotverseData {
  properties: PropertyRecord[];
  clients: ClientRecord[];
  matches: MatchRecord[];
  draftMessages: DraftMessage[];
  agentModules: AgentModule[];
  agentEdges: AgentEdge[];
  agentRuns: AgentRun[];
  agentRunSteps: AgentRunStep[];
  csvImports: CsvImport[];
  scrapeSources: ScrapeSource[];
  scrapeRuns: ScrapeRun[];
  scrapeItems: ScrapeItem[];
  tokenUsageEvents: TokenUsageEvent[];
}
