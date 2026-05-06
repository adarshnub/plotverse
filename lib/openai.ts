import "server-only";

import OpenAI from "openai";
import type { ClientRecord, MatchRecord, PropertyRecord } from "@/lib/types";

export function getModelName() {
  return process.env.OPENAI_MODEL || "gpt-5";
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const parsed = JSON.parse(response.output_text) as {
      fitSummary?: string;
      objections?: string[];
      suggestedNextAction?: string;
    };
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
) {
  const fallback = `Hi ${client.name.split(" ")[0]}, I found a ${property.bedrooms}BHK ${property.propertyType.toLowerCase()} in ${property.area} that looks aligned with your brief. ${match.fitSummary} Worth me sharing the details and checking viewing slots?`;
  const openai = getClient();
  if (!openai) return fallback;

  try {
    const response = await openai.responses.create({
      model: getModelName(),
      instructions:
        "Draft real-estate outreach for human approval. Do not say it was sent. Keep it specific, concise, and natural.",
      input: JSON.stringify({ channel, property, client, match }),
    });
    return response.output_text.trim() || fallback;
  } catch {
    return fallback;
  }
}
