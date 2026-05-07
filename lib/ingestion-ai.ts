import "server-only";

import OpenAI from "openai";
import type { ScrapeItem, TokenUsageEvent } from "@/lib/types";
import { createTokenUsageEvent } from "@/lib/token-usage";

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function model() {
  return process.env.OPENAI_MODEL || "gpt-5";
}

function parseJson(text: string) {
  const candidate = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? candidate.slice(start, end + 1) : candidate) as Record<string, unknown>;
}

export async function enrichScrapeItemWithAi(item: ScrapeItem): Promise<{ item: ScrapeItem; usageEvent?: TokenUsageEvent }> {
  const openai = getClient();
  if (!openai || !item.rawText) return { item };

  try {
    const modelName = model();
    const response = await openai.responses.create({
      model: modelName,
      instructions:
        "Extract Kottayam Kerala land/plot listing or buyer demand facts from public scraped text. Return compact JSON only. Allowed keys: title, locality, price, plotArea, areaUnit, roadFrontage, roadWidth, zoningUse, ownership, boundaryWall, waterAvailability, electricityAvailability, surveyNotes, requirementText, preferredAreas, budgetMin, budgetMax, purpose, confidence. Do not invent contact details.",
      input: JSON.stringify(item),
    });
    const parsed = parseJson(response.output_text);

    const enrichedItem = {
      ...item,
      title: typeof parsed.title === "string" && parsed.title ? parsed.title : item.title,
      locality: typeof parsed.locality === "string" && parsed.locality ? parsed.locality : item.locality,
      price: typeof parsed.price === "number" ? parsed.price : item.price,
      plotArea: typeof parsed.plotArea === "number" ? parsed.plotArea : item.plotArea,
      areaUnit: typeof parsed.areaUnit === "string" ? (parsed.areaUnit as ScrapeItem["areaUnit"]) : item.areaUnit,
      requirementText: typeof parsed.requirementText === "string" ? parsed.requirementText : item.requirementText,
      preferredAreas: Array.isArray(parsed.preferredAreas) ? parsed.preferredAreas.map(String) : item.preferredAreas,
      budgetMin: typeof parsed.budgetMin === "number" ? parsed.budgetMin : item.budgetMin,
      budgetMax: typeof parsed.budgetMax === "number" ? parsed.budgetMax : item.budgetMax,
      purpose: typeof parsed.purpose === "string" ? parsed.purpose : item.purpose,
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : item.confidence,
      normalized: {
        ...item.normalized,
        ...parsed,
        extractionMode: "ai-assisted",
      },
    };
    const usageEvent = createTokenUsageEvent({
      actionType: "scrape-normalization",
      actionLabel: "Kottayam scrape item normalization",
      model: modelName,
      usage: response.usage,
      relatedRunId: item.runId,
      relatedEntityId: item.id,
      metadata: {
        sourceId: item.sourceId,
        kind: item.kind,
        sourceSite: item.sourceSite,
      },
    });
    return { item: enrichedItem, usageEvent: usageEvent ?? undefined };
  } catch {
    return { item };
  }
}
