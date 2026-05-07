import { describe, expect, it } from "vitest";
import { parseListingText } from "@/lib/scrapers/parsing";
import { kottayamScrapeSources } from "@/lib/seed";

describe("scraper adapter parsing", () => {
  it("extracts plot candidates from saved listing-like HTML", () => {
    const html = `
      <article>
        <h2>Residential Land / Plot in Kaduthuruthy, Kottayam</h2>
        <div>Plot Area 7650 sqft</div>
        <div>₹55 Lac</div>
        <p>Situated along 7m road. Boundary not available.</p>
      </article>
      <article>
        <h2>Wanted buyer looking for 20 cents plot in Pala</h2>
        <div>Budget 90 Lac</div>
      </article>
    `;

    const candidates = parseListingText(html, kottayamScrapeSources[0]);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].rawText).toContain("Kottayam");
    expect(candidates.some((candidate) => candidate.kind === "lead")).toBe(true);
  });
});
