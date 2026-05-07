import { describe, expect, it } from "vitest";
import { buildMatch, evaluatePropertyClientFit } from "@/lib/matching";
import type { ClientRecord, PropertyRecord } from "@/lib/types";

const property: PropertyRecord = {
  id: "prop_test_fit",
  title: "Kottayam town residential plot",
  address: "Near Kottayam town",
  area: "Kottayam",
  city: "Kottayam",
  propertyType: "Plot",
  price: 5500000,
  sizeSqft: 8712,
  bedrooms: 0,
  bathrooms: 0,
  status: "active",
  amenities: ["Road access", "Water"],
  notes: "20 cent plot suitable for residence.",
  source: "test",
  createdAt: "2026-05-07T00:00:00.000Z",
  updatedAt: "2026-05-07T00:00:00.000Z",
};

const client: ClientRecord = {
  id: "client_test_fit",
  name: "Kottayam buyer",
  contact: "test",
  budgetMin: 4000000,
  budgetMax: 6500000,
  preferredAreas: ["Kottayam", "Pala"],
  propertyType: "Plot",
  minBedrooms: 0,
  minSizeSqft: 8000,
  mustHaves: ["Road access"],
  dealBlockers: ["No road"],
  urgency: "medium",
  notes: "Looking for residential land.",
  createdAt: "2026-05-07T00:00:00.000Z",
  updatedAt: "2026-05-07T00:00:00.000Z",
};

describe("matching rules", () => {
  it("passes a strong area, budget, type, and bedroom fit", () => {
    const fit = evaluatePropertyClientFit(property, client);

    expect(fit.ruleResult.passed).toBe(true);
    expect(fit.score).toBeGreaterThanOrEqual(80);
  });

  it("keeps the score bounded for weak fits", () => {
    const weakProperty = {
      ...property,
      id: "prop_test_weak",
      area: "Vaikom",
      price: 15000000,
      amenities: ["Water"],
    };
    const match = buildMatch(weakProperty, client);

    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);
    expect(match.ruleResult.warnings.length).toBeGreaterThan(0);
  });
});
