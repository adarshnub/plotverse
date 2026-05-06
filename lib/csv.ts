import { slugId, splitList, toNumber, todayIso } from "@/lib/utils";
import type { ClientRecord, PropertyRecord } from "@/lib/types";

function parseLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];
  const headers = parseLine(lines[0]).map((header) => header.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

export function propertyFromCsvRow(row: Record<string, string>, index: number) {
  const now = todayIso();
  const title = row.title || row.name || row.address;
  const area = row.area || row.locality || "";
  const price = Number(row.price || row.asking_price || 0);
  const errors: string[] = [];

  if (!title) errors.push(`Row ${index}: property title/address is required.`);
  if (!area) errors.push(`Row ${index}: area is required.`);
  if (!price) errors.push(`Row ${index}: price is required.`);

  const property: PropertyRecord = {
    id: slugId("prop"),
    title,
    address: row.address || title,
    area,
    city: row.city || "Mumbai",
    propertyType: row.propertytype || row.property_type || row.type || "Apartment",
    price,
    sizeSqft: Number(row.sizesqft || row.size_sqft || row.size || 0),
    bedrooms: Number(row.bedrooms || row.bhk || 0),
    bathrooms: Number(row.bathrooms || 0),
    status: "active",
    amenities: splitList(row.amenities ?? ""),
    notes: row.notes || "",
    source: row.source || "csv",
    createdAt: now,
    updatedAt: now,
  };

  return { property, errors };
}

export function clientFromCsvRow(row: Record<string, string>, index: number) {
  const now = todayIso();
  const name = row.name || row.client || "";
  const budgetMax = Number(row.budgetmax || row.budget_max || row.max_budget || 0);
  const errors: string[] = [];

  if (!name) errors.push(`Row ${index}: client name is required.`);
  if (!budgetMax) errors.push(`Row ${index}: budget max is required.`);

  const client: ClientRecord = {
    id: slugId("client"),
    name,
    contact: row.contact || "",
    budgetMin: toNumber(row.budgetmin ?? row.budget_min ?? row.min_budget ?? "0"),
    budgetMax,
    preferredAreas: splitList(row.preferredareas ?? row.preferred_areas ?? row.areas ?? ""),
    propertyType: row.propertytype || row.property_type || row.type || "Apartment",
    minBedrooms: Number(row.minbedrooms || row.min_bedrooms || row.bedrooms || 0),
    minSizeSqft: Number(row.minsizesqft || row.min_size_sqft || row.size || 0),
    mustHaves: splitList(row.musthaves ?? row.must_haves ?? ""),
    dealBlockers: splitList(row.dealblockers ?? row.deal_blockers ?? ""),
    urgency: row.urgency === "high" || row.urgency === "low" ? row.urgency : "medium",
    notes: row.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  return { client, errors };
}
