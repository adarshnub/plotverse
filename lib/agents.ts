import type { AgentRun, AgentRunStep, ClientRecord, MatchRecord, PlotverseData, PropertyRecord } from "@/lib/types";
import { enrichMatchWithAi, getModelName } from "@/lib/openai";
import { buildMatch, rankMatches } from "@/lib/matching";
import { slugId, todayIso } from "@/lib/utils";

function createStep(runId: string, moduleKey: string, input: Record<string, unknown>, output: Record<string, unknown>): AgentRunStep {
  const now = todayIso();
  return {
    id: slugId("step"),
    runId,
    moduleKey,
    status: "completed",
    input,
    output,
    startedAt: now,
    completedAt: now,
  };
}

export async function runMatchWorkflow(
  data: PlotverseData,
  propertyIds: string[] = [],
  clientIds: string[] = [],
  mode: "simulation" | "live" = "live",
) {
  const selectedProperties = propertyIds.length
    ? data.properties.filter((property) => propertyIds.includes(property.id))
    : data.properties;
  const selectedClients = clientIds.length ? data.clients.filter((client) => clientIds.includes(client.id)) : data.clients;

  const runId = slugId("run");
  const startedAt = todayIso();
  const run: AgentRun = {
    id: runId,
    workflowKey: "real-estate-matching",
    status: "running",
    mode,
    selectedPropertyIds: selectedProperties.map((property) => property.id),
    selectedClientIds: selectedClients.map((client) => client.id),
    summary: "Matching workflow started.",
    model: process.env.OPENAI_API_KEY ? getModelName() : "local-rules-fallback",
    startedAt,
  };

  const steps: AgentRunStep[] = [];
  const producedMatches: MatchRecord[] = [];

  steps.push(
    createStep(
      runId,
      "property-normalizer",
      { count: selectedProperties.length },
      { properties: selectedProperties.map((property) => ({ id: property.id, area: property.area, price: property.price })) },
    ),
  );
  steps.push(
    createStep(
      runId,
      "client-normalizer",
      { count: selectedClients.length },
      { clients: selectedClients.map((client) => ({ id: client.id, areas: client.preferredAreas, budgetMax: client.budgetMax })) },
    ),
  );

  for (const property of selectedProperties) {
    for (const client of selectedClients) {
      const baseMatch = buildMatch(property, client);
      const ai = baseMatch.ruleResult.passed
        ? await enrichMatchWithAi(baseMatch, property, client)
        : {
            fitSummary: baseMatch.fitSummary,
            objections: baseMatch.objections,
            suggestedNextAction: baseMatch.suggestedNextAction,
          };

      producedMatches.push({ ...baseMatch, ...ai });
    }
  }

  const ranked = rankMatches(producedMatches);
  steps.push(
    createStep(
      runId,
      "rule-matcher",
      { pairs: selectedProperties.length * selectedClients.length },
      { produced: ranked.length, passed: ranked.filter((match) => match.ruleResult.passed).length },
    ),
  );
  steps.push(
    createStep(
      runId,
      "fit-analyst",
      { candidateCount: ranked.filter((match) => match.ruleResult.passed).length },
      { topMatches: ranked.slice(0, 5).map((match) => ({ id: match.id, score: match.score, summary: match.fitSummary })) },
    ),
  );
  steps.push(
    createStep(
      runId,
      "objection-finder",
      { candidateCount: ranked.length },
      { warnings: ranked.flatMap((match) => match.objections).slice(0, 10) },
    ),
  );
  steps.push(
    createStep(
      runId,
      "draft-writer",
      { policy: "draft-only" },
      { message: "Drafts are generated only when requested from the approval queue." },
    ),
  );
  steps.push(
    createStep(
      runId,
      "approval-gate",
      { policy: "human approval required" },
      { outboundActions: 0 },
    ),
  );

  const completedAt = todayIso();
  run.status = "completed";
  run.completedAt = completedAt;
  run.summary = `Created ${ranked.length} scored matches across ${selectedProperties.length} properties and ${selectedClients.length} clients.`;
  steps.push(createStep(runId, "run-reporter", { runId }, { summary: run.summary }));

  return { run, steps, matches: ranked };
}

export function findMatchEntities(data: PlotverseData, match: MatchRecord) {
  const property = data.properties.find((item) => item.id === match.propertyId);
  const client = data.clients.find((item) => item.id === match.clientId);
  if (!property || !client) {
    throw new Error("Match is missing its property or client.");
  }
  return { property: property as PropertyRecord, client: client as ClientRecord };
}
