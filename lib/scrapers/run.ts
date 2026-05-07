import "server-only";

import type { PlotverseData, ScrapeItem, ScrapeRun, TokenUsageEvent } from "@/lib/types";
import { detectDuplicateScrapeItem, normalizePlotCandidate } from "@/lib/ingestion";
import { enrichScrapeItemWithAi } from "@/lib/ingestion-ai";
import { sourceAdapters } from "@/lib/scrapers/adapters";
import { slugId, todayIso } from "@/lib/utils";

export async function runKottayamScrape(data: PlotverseData, sourceIds: string[] = []) {
  const enabledSources = data.scrapeSources.filter((source) => source.enabled && (!sourceIds.length || sourceIds.includes(source.id)));
  const runId = slugId("scraperun");
  const startedAt = todayIso();
  const errors: string[] = [];
  const items: ScrapeItem[] = [];
  const usageEvents: TokenUsageEvent[] = [];

  const run: ScrapeRun = {
    id: runId,
    scope: "Kottayam district, Kerala plots and public buyer/broker demand",
    status: "running",
    sourceIds: enabledSources.map((source) => source.id),
    itemsFound: 0,
    itemsImported: 0,
    errors: [],
    startedAt,
  };

  for (const source of enabledSources) {
    const adapter = sourceAdapters[source.key];
    if (!adapter) {
      errors.push(`${source.name}: no adapter registered.`);
      continue;
    }

    try {
      const result = await adapter.run(source);
      errors.push(...result.errors);
      for (const candidate of result.candidates) {
        const baseItem = normalizePlotCandidate(candidate, source, runId);
        const enrichment = await enrichScrapeItemWithAi(baseItem);
        const enriched = enrichment.item;
        if (enrichment.usageEvent) usageEvents.push(enrichment.usageEvent);
        const duplicateOf = detectDuplicateScrapeItem(enriched, [...data.scrapeItems, ...items], data.properties);
        items.push({
          ...enriched,
          status: duplicateOf ? "duplicate" : "review",
          duplicateOf,
          updatedAt: todayIso(),
        });
      }
    } catch (error) {
      errors.push(`${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const completedAt = todayIso();
  run.itemsFound = items.length;
  run.errors = errors;
  run.status = errors.length && items.length ? "partial" : errors.length ? "failed" : "completed";
  run.completedAt = completedAt;

  return { run, items, usageEvents };
}
