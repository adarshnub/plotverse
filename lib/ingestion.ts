import type { ClientRecord, LandDetails, PropertyRecord, ScrapeItem, ScrapeSource } from "@/lib/types";
import { slugId, todayIso } from "@/lib/utils";

export interface RawScrapeCandidate {
  kind: ScrapeItem["kind"];
  title: string;
  locality?: string;
  priceText?: string;
  areaText?: string;
  sourceUrl: string;
  sourceSite: string;
  rawText: string;
  contactName?: string;
  visibleContact?: string;
  requirementText?: string;
}

export const kottayamLocalities = [
  "Kottayam",
  "Pala",
  "Ettumanoor",
  "Changanassery",
  "Vaikom",
  "Kanjirappally",
  "Karukachal",
  "Kaduthuruthy",
  "Manimala",
  "Vadavathoor",
  "Thengana",
  "Kumarakom",
  "Mundakayam",
  "Kuravilangad",
  "Erattupetta",
];

const sqftPerCent = 435.6;
const sqftPerAcre = 43560;

export function areaToSqft(area: number, unit: LandDetails["areaUnit"]) {
  if (!Number.isFinite(area) || area <= 0) return 0;
  if (unit === "cent") return area * sqftPerCent;
  if (unit === "acre") return area * sqftPerAcre;
  if (unit === "sqm") return area * 10.7639;
  if (unit === "sqft") return area;
  return 0;
}

export function detectAreaUnit(text: string): LandDetails["areaUnit"] {
  const value = text.toLowerCase();
  if (/\bcent|cents\b/.test(value)) return "cent";
  if (/\bacre|acres\b/.test(value)) return "acre";
  if (/\bsq\.?\s*ft|sqft|square feet|sq feet\b/.test(value)) return "sqft";
  if (/\bsq\.?\s*m|sqm|square meter|square metre\b/.test(value)) return "sqm";
  return "unknown";
}

export function extractNumber(text: string) {
  const match = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function parseIndianPrice(text: string) {
  const clean = text.toLowerCase().replace(/,/g, "");
  const number = extractNumber(clean);
  if (!number) return 0;
  if (clean.includes("crore") || clean.includes(" cr")) return number * 10000000;
  if (clean.includes("lakh") || clean.includes(" lac")) return number * 100000;
  return number;
}

export function detectLocality(text: string) {
  const lower = text.toLowerCase();
  return kottayamLocalities.find((locality) => lower.includes(locality.toLowerCase())) || "Kottayam";
}

export function normalizePlotCandidate(candidate: RawScrapeCandidate, source: ScrapeSource, runId: string): ScrapeItem {
  const now = todayIso();
  const combined = `${candidate.title} ${candidate.locality ?? ""} ${candidate.priceText ?? ""} ${candidate.areaText ?? ""} ${candidate.rawText}`;
  const areaUnit = detectAreaUnit(candidate.areaText || candidate.rawText);
  const plotArea = extractNumber(candidate.areaText || candidate.rawText);
  const plotAreaSqft = areaToSqft(plotArea, areaUnit);
  const price = parseIndianPrice(candidate.priceText || candidate.rawText);
  const pricePerCent = plotAreaSqft > 0 ? price / (plotAreaSqft / sqftPerCent) : 0;
  const isLead = candidate.kind === "lead";

  return {
    id: slugId("scrape"),
    runId,
    sourceId: source.id,
    kind: candidate.kind,
    status: "review",
    title: candidate.title || `${source.name} candidate`,
    locality: candidate.locality || detectLocality(combined),
    district: "Kottayam",
    price,
    plotArea,
    areaUnit,
    plotAreaSqft,
    pricePerCent,
    sourceUrl: candidate.sourceUrl || source.searchUrl,
    sourceSite: candidate.sourceSite || source.name,
    rawText: candidate.rawText,
    contactName: candidate.contactName || "",
    visibleContact: candidate.visibleContact || "",
    leadType: isLead ? "buyer" : "seller",
    requirementText: candidate.requirementText || (isLead ? candidate.rawText : ""),
    preferredAreas: isLead ? [detectLocality(combined)] : [],
    budgetMin: 0,
    budgetMax: isLead ? price : 0,
    purpose: isLead ? "plot purchase" : "land listing",
    confidence: candidate.rawText.length > 80 ? 0.72 : 0.48,
    normalized: {
      extractionMode: "local-parser",
      contactPolicy: "visible-public-only",
      sourceKind: source.kind,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function detectDuplicateScrapeItem(item: ScrapeItem, existing: ScrapeItem[], properties: PropertyRecord[]) {
  const itemKey = `${item.sourceUrl}`.toLowerCase();
  const sourceDuplicate = existing.find((candidate) => candidate.id !== item.id && candidate.sourceUrl.toLowerCase() === itemKey);
  if (sourceDuplicate) return sourceDuplicate.id;

  const titleLocality = `${item.title} ${item.locality}`.toLowerCase();
  const itemPrice = Math.round(item.price / 100000);
  const importedDuplicate = properties.find((property) => {
    const propertyKey = `${property.title} ${property.area}`.toLowerCase();
    const propertyPrice = Math.round(property.price / 100000);
    return property.sourceUrl === item.sourceUrl || (propertyKey === titleLocality && Math.abs(propertyPrice - itemPrice) <= 2);
  });

  return importedDuplicate?.id;
}

export function scrapeItemToProperty(item: ScrapeItem): PropertyRecord {
  const now = todayIso();
  return {
    id: slugId("prop"),
    title: item.title,
    address: item.locality,
    area: item.locality,
    city: "Kottayam",
    propertyType: "Plot",
    price: item.price,
    sizeSqft: item.plotAreaSqft,
    bedrooms: 0,
    bathrooms: 0,
    status: "active",
    amenities: ["Land", item.purpose].filter(Boolean),
    notes: `${item.rawText}\n\nSource: ${item.sourceUrl}`.trim(),
    source: `scraped:${item.sourceSite}`,
    landDetails: {
      plotArea: item.plotArea,
      areaUnit: item.areaUnit,
      plotAreaSqft: item.plotAreaSqft,
      pricePerCent: item.pricePerCent,
      pricePerSqft: item.plotAreaSqft ? item.price / item.plotAreaSqft : 0,
      roadFrontage: String(item.normalized.roadFrontage ?? ""),
      roadWidth: String(item.normalized.roadWidth ?? ""),
      zoningUse: String(item.normalized.zoningUse ?? "Residential/land"),
      ownership: String(item.normalized.ownership ?? ""),
      boundaryWall: typeof item.normalized.boundaryWall === "boolean" ? item.normalized.boundaryWall : null,
      waterAvailability: typeof item.normalized.waterAvailability === "boolean" ? item.normalized.waterAvailability : null,
      electricityAvailability: typeof item.normalized.electricityAvailability === "boolean" ? item.normalized.electricityAvailability : null,
      surveyNotes: String(item.normalized.surveyNotes ?? ""),
    },
    sourceUrl: item.sourceUrl,
    sourceSite: item.sourceSite,
    scrapedAt: item.createdAt,
    createdAt: now,
    updatedAt: now,
  };
}

export function scrapeItemToClient(item: ScrapeItem): ClientRecord {
  const now = todayIso();
  return {
    id: slugId("client"),
    name: item.contactName || `${item.leadType === "broker" ? "Broker" : "Buyer"} lead - ${item.locality}`,
    contact: item.visibleContact || item.sourceUrl,
    budgetMin: item.budgetMin,
    budgetMax: item.budgetMax || item.price,
    preferredAreas: item.preferredAreas.length ? item.preferredAreas : [item.locality],
    propertyType: "Plot",
    minBedrooms: 0,
    minSizeSqft: item.plotAreaSqft,
    mustHaves: ["Kottayam district plot"],
    dealBlockers: [],
    urgency: item.confidence > 0.75 ? "high" : "medium",
    notes: `${item.requirementText || item.rawText}\n\nSource: ${item.sourceUrl}`.trim(),
    createdAt: now,
    updatedAt: now,
  };
}
