import { describe, expect, it } from "vitest";
import {
  areaToSqft,
  detectDuplicateScrapeItem,
  normalizePlotCandidate,
  parseIndianPrice,
  scrapeItemToClient,
  scrapeItemToProperty,
} from "@/lib/ingestion";
import { kottayamScrapeSources } from "@/lib/seed";

describe("Kottayam plot ingestion", () => {
  const source = kottayamScrapeSources[0];

  it("converts Kerala land units and Indian price text", () => {
    expect(areaToSqft(10, "cent")).toBeCloseTo(4356);
    expect(areaToSqft(1, "acre")).toBe(43560);
    expect(parseIndianPrice("₹55 Lac")).toBe(5500000);
    expect(parseIndianPrice("1.2 Cr")).toBe(12000000);
  });

  it("normalizes a raw plot candidate into a review item", () => {
    const item = normalizePlotCandidate(
      {
        kind: "plot",
        title: "Residential plot in Pala",
        locality: "Pala",
        priceText: "₹90 Lac",
        areaText: "20 cents",
        sourceUrl: "https://example.com/pala-plot",
        sourceSite: "Example",
        rawText: "20 cents residential plot in Pala with road frontage.",
      },
      source,
      "run_1",
    );

    expect(item.status).toBe("review");
    expect(item.locality).toBe("Pala");
    expect(item.plotAreaSqft).toBeCloseTo(8712);
    expect(item.price).toBe(9000000);
  });

  it("detects duplicates by source URL before import", () => {
    const first = normalizePlotCandidate(
      { kind: "plot", title: "Plot A", sourceUrl: "https://example.com/a", sourceSite: "Example", rawText: "10 cent plot in Kottayam" },
      source,
      "run_1",
    );
    const second = { ...first, id: "different_id" };

    expect(detectDuplicateScrapeItem(second, [first], [])).toBe(first.id);
  });

  it("converts approved plot and lead items into existing records", () => {
    const plot = normalizePlotCandidate(
      { kind: "plot", title: "Plot for sale in Ettumanoor", sourceUrl: "https://example.com/p", sourceSite: "Example", rawText: "15 cents plot for sale in Ettumanoor" },
      source,
      "run_1",
    );
    const lead = normalizePlotCandidate(
      {
        kind: "lead",
        title: "Buyer looking for plot in Vaikom",
        sourceUrl: "https://example.com/l",
        sourceSite: "Example",
        rawText: "Buyer looking for 20 cents plot in Vaikom below 60 lac",
        requirementText: "Buyer looking for 20 cents plot in Vaikom below 60 lac",
      },
      source,
      "run_1",
    );

    expect(scrapeItemToProperty(plot).propertyType).toBe("Plot");
    expect(scrapeItemToClient(lead).propertyType).toBe("Plot");
  });
});
