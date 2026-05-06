"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { runMatchWorkflow } from "@/lib/agents";
import { clientFromCsvRow, parseCsv, propertyFromCsvRow } from "@/lib/csv";
import { draftOutreach } from "@/lib/openai";
import { updateData } from "@/lib/store";
import type { ClientRecord, DraftMessage, PropertyRecord } from "@/lib/types";
import { slugId, splitList, toNumber, todayIso } from "@/lib/utils";
import { transitionDraftStatus } from "@/lib/drafts";

const revalidateApp = () => {
  ["/", "/properties", "/clients", "/matches", "/drafts", "/runs", "/lab"].forEach((path) => revalidatePath(path));
};

export async function createProperty(formData: FormData) {
  const now = todayIso();
  const property: PropertyRecord = {
    id: slugId("prop"),
    title: String(formData.get("title") || "Untitled property"),
    address: String(formData.get("address") || ""),
    area: String(formData.get("area") || ""),
    city: String(formData.get("city") || "Mumbai"),
    propertyType: String(formData.get("propertyType") || "Apartment"),
    price: toNumber(formData.get("price")),
    sizeSqft: toNumber(formData.get("sizeSqft")),
    bedrooms: toNumber(formData.get("bedrooms")),
    bathrooms: toNumber(formData.get("bathrooms")),
    status: "active",
    amenities: splitList(formData.get("amenities")),
    notes: String(formData.get("notes") || ""),
    source: "manual",
    createdAt: now,
    updatedAt: now,
  };

  await updateData((data) => {
    data.properties.unshift(property);
  });
  revalidateApp();
  redirect("/properties");
}

export async function createClientRecord(formData: FormData) {
  const now = todayIso();
  const client: ClientRecord = {
    id: slugId("client"),
    name: String(formData.get("name") || "Unnamed client"),
    contact: String(formData.get("contact") || ""),
    budgetMin: toNumber(formData.get("budgetMin")),
    budgetMax: toNumber(formData.get("budgetMax")),
    preferredAreas: splitList(formData.get("preferredAreas")),
    propertyType: String(formData.get("propertyType") || "Apartment"),
    minBedrooms: toNumber(formData.get("minBedrooms")),
    minSizeSqft: toNumber(formData.get("minSizeSqft")),
    mustHaves: splitList(formData.get("mustHaves")),
    dealBlockers: splitList(formData.get("dealBlockers")),
    urgency: formData.get("urgency") === "high" || formData.get("urgency") === "low" ? (formData.get("urgency") as "high" | "low") : "medium",
    notes: String(formData.get("notes") || ""),
    createdAt: now,
    updatedAt: now,
  };

  await updateData((data) => {
    data.clients.unshift(client);
  });
  revalidateApp();
  redirect("/clients");
}

export async function importCsv(formData: FormData) {
  const target = formData.get("target") === "clients" ? "clients" : "properties";
  const file = formData.get("file");
  if (!(file instanceof File)) return;

  const rows = parseCsv(await file.text());
  const validationErrors: string[] = [];
  let imported = 0;

  await updateData((data) => {
    for (let index = 0; index < rows.length; index += 1) {
      if (target === "properties") {
        const result = propertyFromCsvRow(rows[index], index + 2);
        validationErrors.push(...result.errors);
        if (!result.errors.length) {
          data.properties.unshift(result.property);
          imported += 1;
        }
      } else {
        const result = clientFromCsvRow(rows[index], index + 2);
        validationErrors.push(...result.errors);
        if (!result.errors.length) {
          data.clients.unshift(result.client);
          imported += 1;
        }
      }
    }

    data.csvImports.unshift({
      id: slugId("csv"),
      target,
      filename: file.name,
      rowsTotal: rows.length,
      rowsImported: imported,
      validationErrors,
      status: validationErrors.length ? "failed" : "imported",
      createdAt: todayIso(),
    });
  });

  revalidateApp();
  redirect(target === "properties" ? "/properties" : "/clients");
}

export async function runMatchesAction(formData?: FormData) {
  const propertyIds = formData?.getAll("propertyIds").map(String) ?? [];
  const clientIds = formData?.getAll("clientIds").map(String) ?? [];

  await updateData(async (data) => {
    const result = await runMatchWorkflow(data, propertyIds, clientIds, "live");
    const incomingPairs = new Set(result.matches.map((match) => `${match.propertyId}:${match.clientId}`));
    data.matches = [
      ...result.matches,
      ...data.matches.filter((match) => !incomingPairs.has(`${match.propertyId}:${match.clientId}`)),
    ];
    data.agentRuns.unshift(result.run);
    data.agentRunSteps.unshift(...result.steps);
  });

  revalidateApp();
  redirect("/matches");
}

export async function generateDraft(matchId: string) {
  await updateData(async (data) => {
    const match = data.matches.find((item) => item.id === matchId);
    if (!match) return;
    const property = data.properties.find((item) => item.id === match.propertyId);
    const client = data.clients.find((item) => item.id === match.clientId);
    if (!property || !client) return;

    const body = await draftOutreach(match, property, client);
    const now = todayIso();
    const draft: DraftMessage = {
      id: slugId("draft"),
      matchId,
      channel: "whatsapp",
      tone: "warm",
      body,
      editedBody: body,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    data.draftMessages.unshift(draft);
    match.status = "drafted";
    match.updatedAt = now;
  });

  revalidateApp();
}

export async function updateDraft(formData: FormData) {
  const id = String(formData.get("id"));
  const editedBody = String(formData.get("editedBody") || "");
  await updateData((data) => {
    const draft = data.draftMessages.find((item) => item.id === id);
    if (!draft) return;
    draft.editedBody = editedBody;
    draft.updatedAt = todayIso();
  });
  revalidateApp();
}

export async function setDraftStatus(id: string, status: "approved" | "rejected") {
  await updateData((data) => {
    const draft = data.draftMessages.find((item) => item.id === id);
    if (!draft) return;
    Object.assign(draft, transitionDraftStatus(draft, status, todayIso()));
  });
  revalidateApp();
}

export async function runLabTest(formData: FormData) {
  const propertyId = String(formData.get("propertyId") || "");
  const clientId = String(formData.get("clientId") || "");

  await updateData(async (data) => {
    const result = await runMatchWorkflow(data, propertyId ? [propertyId] : [], clientId ? [clientId] : [], "simulation");
    data.agentRuns.unshift(result.run);
    data.agentRunSteps.unshift(...result.steps);
  });

  revalidateApp();
  redirect("/lab");
}
