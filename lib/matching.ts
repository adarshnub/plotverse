import type { ClientRecord, MatchRecord, PropertyRecord } from "@/lib/types";
import { slugId, todayIso } from "@/lib/utils";

function includesLoose(list: string[], value: string) {
  const normalized = value.toLowerCase();
  return list.some((item) => item.toLowerCase() === normalized);
}

export function evaluatePropertyClientFit(property: PropertyRecord, client: ClientRecord) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 35;

  if (property.price >= client.budgetMin && property.price <= client.budgetMax) {
    score += 22;
    reasons.push("Price is inside the client budget range.");
  } else if (property.price <= client.budgetMax * 1.08) {
    score += 8;
    warnings.push("Price is slightly above stated budget.");
  } else {
    warnings.push("Price exceeds the client budget.");
  }

  if (!client.preferredAreas.length || includesLoose(client.preferredAreas, property.area)) {
    score += 18;
    reasons.push("Area matches the preferred location list.");
  } else {
    warnings.push(`Area ${property.area} is outside preferred areas.`);
  }

  if (!client.propertyType || property.propertyType.toLowerCase() === client.propertyType.toLowerCase()) {
    score += 12;
    reasons.push("Property type matches.");
  } else {
    warnings.push(`Client asked for ${client.propertyType}, property is ${property.propertyType}.`);
  }

  if (!client.minBedrooms || property.bedrooms >= client.minBedrooms) {
    score += 8;
    reasons.push("Bedroom count clears the requirement.");
  } else {
    warnings.push("Bedroom count is below requirement.");
  }

  if (!client.minSizeSqft || property.sizeSqft >= client.minSizeSqft) {
    score += 5;
    reasons.push("Size clears the requirement.");
  } else {
    warnings.push("Size is below requirement.");
  }

  const missingMustHaves = client.mustHaves.filter((mustHave) => !includesLoose(property.amenities, mustHave));
  if (!missingMustHaves.length) {
    score += 10;
    reasons.push("Must-have amenities appear covered.");
  } else {
    warnings.push(`Missing or unconfirmed must-haves: ${missingMustHaves.join(", ")}.`);
  }

  const blockerHits = client.dealBlockers.filter((blocker) => {
    const haystack = `${property.notes} ${property.amenities.join(" ")}`.toLowerCase();
    return haystack.includes(blocker.toLowerCase());
  });

  if (blockerHits.length) {
    score -= 25;
    warnings.push(`Possible deal blocker mentioned: ${blockerHits.join(", ")}.`);
  }

  const passed = score >= 62 && !warnings.some((warning) => warning.includes("exceeds the client budget"));

  return {
    score: Math.max(0, Math.min(100, score)),
    ruleResult: {
      passed,
      reasons,
      warnings,
    },
  };
}

export function buildMatch(property: PropertyRecord, client: ClientRecord): MatchRecord {
  const fit = evaluatePropertyClientFit(property, client);
  const now = todayIso();
  const objections = fit.ruleResult.warnings.length
    ? fit.ruleResult.warnings
    : ["Confirm viewing timing and decision stakeholders before pitching."];

  return {
    id: slugId("match"),
    propertyId: property.id,
    clientId: client.id,
    score: fit.score,
    ruleResult: fit.ruleResult,
    fitSummary: fit.ruleResult.passed
      ? `${property.title} is a credible fit for ${client.name}: ${fit.ruleResult.reasons.slice(0, 3).join(" ")}`
      : `${property.title} needs review before pitching to ${client.name}: ${objections[0]}`,
    objections,
    suggestedNextAction: fit.ruleResult.passed
      ? `Send ${client.name} a short shortlist note and ask for viewing availability.`
      : "Do not pitch yet; clarify budget, area, or requirement mismatch first.",
    status: fit.ruleResult.passed ? "new" : "reviewed",
    createdAt: now,
    updatedAt: now,
  };
}

export function rankMatches(matches: MatchRecord[]) {
  return [...matches].sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt));
}
