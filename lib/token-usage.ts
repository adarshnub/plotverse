import type { JsonRecord, TokenUsageActionType, TokenUsageEvent } from "@/lib/types";
import { slugId, todayIso } from "@/lib/utils";

interface ResponseUsageLike {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  input_tokens_details?: {
    cached_tokens?: number;
  };
  output_tokens_details?: {
    reasoning_tokens?: number;
  };
}

interface Pricing {
  inputPer1M: number;
  cachedInputPer1M: number;
  outputPer1M: number;
  source: string;
}

const pricingByModel: Record<string, Pricing> = {
  "gpt-4.1-mini": {
    inputPer1M: 0.4,
    cachedInputPer1M: 0.1,
    outputPer1M: 1.6,
    source: "OpenAI model page, prices per 1M tokens",
  },
  "gpt-4.1-mini-2025-04-14": {
    inputPer1M: 0.4,
    cachedInputPer1M: 0.1,
    outputPer1M: 1.6,
    source: "OpenAI model page, prices per 1M tokens",
  },
};

function pricingFor(model: string): Pricing {
  const direct = pricingByModel[model];
  if (direct) return direct;

  const envInput = Number(process.env.OPENAI_INPUT_COST_PER_1M_USD || "");
  const envCached = Number(process.env.OPENAI_CACHED_INPUT_COST_PER_1M_USD || "");
  const envOutput = Number(process.env.OPENAI_OUTPUT_COST_PER_1M_USD || "");
  if (Number.isFinite(envInput) && Number.isFinite(envOutput) && envInput > 0 && envOutput > 0) {
    return {
      inputPer1M: envInput,
      cachedInputPer1M: Number.isFinite(envCached) && envCached >= 0 ? envCached : envInput,
      outputPer1M: envOutput,
      source: "Environment override",
    };
  }

  return {
    inputPer1M: 0,
    cachedInputPer1M: 0,
    outputPer1M: 0,
    source: "Unknown model pricing; set OPENAI_*_COST_PER_1M_USD env vars",
  };
}

export function createTokenUsageEvent({
  actionType,
  actionLabel,
  model,
  usage,
  relatedRunId,
  relatedEntityId,
  metadata = {},
}: {
  actionType: TokenUsageActionType;
  actionLabel: string;
  model: string;
  usage: ResponseUsageLike | null | undefined;
  relatedRunId?: string;
  relatedEntityId?: string;
  metadata?: JsonRecord;
}): TokenUsageEvent | null {
  if (!usage) return null;

  const inputTokens = Number(usage.input_tokens ?? 0);
  const cachedInputTokens = Number(usage.input_tokens_details?.cached_tokens ?? 0);
  const outputTokens = Number(usage.output_tokens ?? 0);
  const reasoningTokens = Number(usage.output_tokens_details?.reasoning_tokens ?? 0);
  const totalTokens = Number(usage.total_tokens ?? inputTokens + outputTokens);
  const pricing = pricingFor(model);
  const billableInputTokens = Math.max(0, inputTokens - cachedInputTokens);
  const inputCostUsd = (billableInputTokens * pricing.inputPer1M + cachedInputTokens * pricing.cachedInputPer1M) / 1_000_000;
  const outputCostUsd = (outputTokens * pricing.outputPer1M) / 1_000_000;

  return {
    id: slugId("usage"),
    actionType,
    actionLabel,
    model,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningTokens,
    totalTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd,
    pricingSource: pricing.source,
    relatedRunId,
    relatedEntityId,
    metadata,
    createdAt: todayIso(),
  };
}

export function aggregateUsage(events: TokenUsageEvent[]) {
  return events.reduce(
    (total, event) => ({
      inputTokens: total.inputTokens + event.inputTokens,
      cachedInputTokens: total.cachedInputTokens + event.cachedInputTokens,
      outputTokens: total.outputTokens + event.outputTokens,
      reasoningTokens: total.reasoningTokens + event.reasoningTokens,
      totalTokens: total.totalTokens + event.totalTokens,
      totalCostUsd: total.totalCostUsd + event.totalCostUsd,
    }),
    {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      totalCostUsd: 0,
    },
  );
}
