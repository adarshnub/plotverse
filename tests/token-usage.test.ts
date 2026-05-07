import { describe, expect, it } from "vitest";
import { aggregateUsage, createTokenUsageEvent } from "@/lib/token-usage";

describe("token usage tracking", () => {
  it("estimates gpt-4.1-mini cost from response usage", () => {
    const event = createTokenUsageEvent({
      actionType: "scrape-normalization",
      actionLabel: "Test normalization",
      model: "gpt-4.1-mini",
      usage: {
        input_tokens: 1_000_000,
        input_tokens_details: { cached_tokens: 250_000 },
        output_tokens: 500_000,
        output_tokens_details: { reasoning_tokens: 0 },
        total_tokens: 1_500_000,
      },
    });

    expect(event).not.toBeNull();
    expect(event?.inputCostUsd).toBeCloseTo(0.325);
    expect(event?.outputCostUsd).toBeCloseTo(0.8);
    expect(event?.totalCostUsd).toBeCloseTo(1.125);
  });

  it("aggregates usage events", () => {
    const first = createTokenUsageEvent({
      actionType: "match-evaluation",
      actionLabel: "A",
      model: "gpt-4.1-mini",
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    });
    const second = createTokenUsageEvent({
      actionType: "draft-generation",
      actionLabel: "B",
      model: "gpt-4.1-mini",
      usage: { input_tokens: 5, output_tokens: 10, total_tokens: 15 },
    });

    const total = aggregateUsage([first!, second!]);
    expect(total.inputTokens).toBe(15);
    expect(total.outputTokens).toBe(30);
    expect(total.totalTokens).toBe(45);
  });
});
