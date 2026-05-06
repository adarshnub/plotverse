import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedData } from "@/lib/seed";
import type { PlotverseData } from "@/lib/types";

const dataDir = path.join(process.cwd(), ".local-data");
const dataFile = path.join(dataDir, "plotverse.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(seedData, null, 2));
  }
}

export async function readLocalData(): Promise<PlotverseData> {
  await ensureStore();
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as PlotverseData;
  return {
    ...seedData,
    ...parsed,
    agentModules: parsed.agentModules?.length ? parsed.agentModules : seedData.agentModules,
    agentEdges: parsed.agentEdges?.length ? parsed.agentEdges : seedData.agentEdges,
  };
}

export async function writeLocalData(data: PlotverseData) {
  await ensureStore();
  await writeFile(dataFile, JSON.stringify(data, null, 2));
}

export async function updateLocalData(mutator: (data: PlotverseData) => void | Promise<void>) {
  const data = await readLocalData();
  await mutator(data);
  await writeLocalData(data);
  return data;
}
