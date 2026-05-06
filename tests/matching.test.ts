import { describe, expect, it } from "vitest";
import { buildMatch, evaluatePropertyClientFit } from "@/lib/matching";
import { seedData } from "@/lib/seed";

describe("matching rules", () => {
  it("passes a strong area, budget, type, and bedroom fit", () => {
    const fit = evaluatePropertyClientFit(seedData.properties[0], seedData.clients[0]);

    expect(fit.ruleResult.passed).toBe(true);
    expect(fit.score).toBeGreaterThanOrEqual(80);
  });

  it("keeps the score bounded for weak fits", () => {
    const match = buildMatch(seedData.properties[1], seedData.clients[1]);

    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);
    expect(match.ruleResult.warnings.length).toBeGreaterThan(0);
  });
});
