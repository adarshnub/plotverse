import "server-only";

import OpenAI from "openai";
import type { ClientRecord, MatchRecord, PropertyRecord, TokenUsageEvent } from "@/lib/types";
import { createTokenUsageEvent } from "@/lib/token-usage";

export function getModelName() {
  return process.env.OPENAI_MODEL || "gpt-5";
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function parseJsonObject<T>(text: string): T {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = fenced || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  return JSON.parse(start >= 0 && end >= start ? candidate.slice(start, end + 1) : candidate) as T;
}

function boundedScore(value: unknown, fallback: number) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : fallback;
}

export async function aiEvaluateMatch(
  match: MatchRecord,
  property: PropertyRecord,
  client: ClientRecord,
  relatedRunId?: string,
): Promise<{ match: MatchRecord; usageEvent?: TokenUsageEvent }> {
  const openai = getClient();
  if (!openai) return { match };

  try {
    const model = getModelName();
    const response = await openai.responses.create({
      model,
      instructions:
        "You are an expert real-estate matching agent. Use the deterministic rule result as guardrails, then judge the nuanced fit from notes, intent, tradeoffs, objections, and whether this is worth showing. Return compact JSON only with keys score, passed, reasons, warnings, fitSummary, objections, suggestedNextAction. Score must be 0-100. Do not approve extreme budget mismatches unless the property is explicitly positioned as negotiable or strategically worth showing.",
      input: JSON.stringify({ property, client, deterministicMatch: match }),
    });
    const parsed = parseJsonObject<{
      score?: number;
      passed?: boolean;
      reasons?: string[];
      warnings?: string[];
      fitSummary?: string;
      objections?: string[];
      suggestedNextAction?: string;
    }>(response.output_text);

    const score = boundedScore(parsed.score, match.score);
    const passed = typeof parsed.passed === "boolean" ? parsed.passed : score >= 62;

    const evaluatedMatch: MatchRecord = {
      ...match,
      score,
      ruleResult: {
        passed,
        reasons: parsed.reasons?.length ? parsed.reasons : match.ruleResult.reasons,
        warnings: parsed.warnings?.length ? parsed.warnings : match.ruleResult.warnings,
      },
      fitSummary: parsed.fitSummary || match.fitSummary,
      objections: parsed.objections?.length ? parsed.objections : match.objections,
      suggestedNextAction: parsed.suggestedNextAction || match.suggestedNextAction,
      status: passed ? "new" : "reviewed",
    };
    const usageEvent = createTokenUsageEvent({
      actionType: "match-evaluation",
      actionLabel: "AI-assisted property/client match evaluation",
      model,
      usage: response.usage,
      relatedRunId,
      relatedEntityId: match.id,
      metadata: {
        propertyId: property.id,
        clientId: client.id,
      },
    });
    return { match: evaluatedMatch, usageEvent: usageEvent ?? undefined };
  } catch {
    return { match };
  }
}

export async function enrichMatchWithAi(
  match: MatchRecord,
  property: PropertyRecord,
  client: ClientRecord,
): Promise<Pick<MatchRecord, "fitSummary" | "objections" | "suggestedNextAction">> {
  const openai = getClient();
  if (!openai) {
    return {
      fitSummary: match.fitSummary,
      objections: match.objections,
      suggestedNextAction: match.suggestedNextAction,
    };
  }

  try {
    const response = await openai.responses.create({
      model: getModelName(),
      instructions:
        "You are a precise real-estate matching analyst. Return compact JSON only with keys fitSummary, objections, suggestedNextAction.",
      input: JSON.stringify({ property, client, deterministicMatch: match }),
    });
    const parsed = parseJsonObject<{
      fitSummary?: string;
      objections?: string[];
      suggestedNextAction?: string;
    }>(response.output_text);
    return {
      fitSummary: parsed.fitSummary || match.fitSummary,
      objections: parsed.objections?.length ? parsed.objections : match.objections,
      suggestedNextAction: parsed.suggestedNextAction || match.suggestedNextAction,
    };
  } catch {
    return {
      fitSummary: match.fitSummary,
      objections: match.objections,
      suggestedNextAction: match.suggestedNextAction,
    };
  }
}

export async function draftOutreach(
  match: MatchRecord,
  property: PropertyRecord,
  client: ClientRecord,
  channel: "whatsapp" | "email" | "call" = "whatsapp",
): Promise<{ body: string; usageEvent?: TokenUsageEvent }> {
  const fallback = `Hi ${client.name.split(" ")[0]}, I found a ${property.bedrooms}BHK ${property.propertyType.toLowerCase()} in ${property.area} that looks aligned with your brief. ${match.fitSummary} Worth me sharing the details and checking viewing slots?`;
  const openai = getClient();
  if (!openai) return { body: fallback };

  try {
    const model = getModelName();
    const response = await openai.responses.create({
      model,
      instructions:
        "Draft real-estate outreach for human approval. Do not say it was sent. Keep it specific, concise, and natural.",
      input: JSON.stringify({ channel, property, client, match }),
    });
    const usageEvent = createTokenUsageEvent({
      actionType: "draft-generation",
      actionLabel: "Outreach draft generation",
      model,
      usage: response.usage,
      relatedEntityId: match.id,
      metadata: {
        propertyId: property.id,
        clientId: client.id,
        channel,
      },
    });
    return { body: response.output_text.trim() || fallback, usageEvent: usageEvent ?? undefined };
  } catch {
    return { body: fallback };
  }
}
