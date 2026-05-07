import type { ScrapeSource } from "@/lib/types";
import type { RawScrapeCandidate } from "@/lib/ingestion";

const listingHints = [
  "plot",
  "land",
  "cent",
  "acre",
  "sqft",
  "kottayam",
  "pala",
  "ettumanoor",
  "changanassery",
  "vaikom",
  "kanjirappally",
  "karukachal",
  "kaduthuruthy",
];

export function parseListingText(htmlOrText: string, source: ScrapeSource, limit = 12): RawScrapeCandidate[] {
  const text = htmlOrText
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 24);

  const blocks: string[] = [];
  for (let index = 0; index < text.length; index += 1) {
    const line = text[index];
    const lower = line.toLowerCase();
    if (listingHints.some((hint) => lower.includes(hint))) {
      blocks.push(text.slice(index, index + 5).join(" "));
    }
    if (blocks.length >= limit) break;
  }

  const unique = Array.from(new Set(blocks));
  return unique.map((block, index) => ({
    kind: source.kind === "reference" ? "reference" : lowerDemandSignal(block) ? "lead" : "plot",
    title: buildTitle(block, source.name, index),
    locality: detectKnownLocality(block),
    priceText: block.match(/₹\s?[\d,.]+\s?(?:Cr|Crore|Lac|Lakh)?/i)?.[0] ?? block.match(/[\d,.]+\s?(?:Cr|Crore|Lac|Lakh)/i)?.[0],
    areaText: block.match(/[\d,.]+\s?(?:cent|cents|acre|acres|sqft|sq\.?\s*ft|sqm)/i)?.[0],
    sourceUrl: source.searchUrl,
    sourceSite: source.name,
    rawText: block,
  }));
}

function lowerDemandSignal(text: string) {
  const lower = text.toLowerCase();
  return lower.includes("wanted") || lower.includes("required") || lower.includes("looking for") || lower.includes("buyer");
}

function detectKnownLocality(text: string) {
  const localities = ["Pala", "Ettumanoor", "Changanassery", "Vaikom", "Kanjirappally", "Karukachal", "Kaduthuruthy", "Manimala", "Kottayam"];
  const lower = text.toLowerCase();
  return localities.find((locality) => lower.includes(locality.toLowerCase()));
}

function buildTitle(text: string, sourceName: string, index: number) {
  const sentence = text.split(/[.!?]/)[0]?.slice(0, 88).trim();
  return sentence || `${sourceName} candidate ${index + 1}`;
}
