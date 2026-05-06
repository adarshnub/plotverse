"use client";

import { useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Activity, Box, Play } from "lucide-react";
import { runLabTest } from "@/app/actions";
import type { AgentEdge, AgentModule, AgentRun, AgentRunStep, ClientRecord, PropertyRecord } from "@/lib/types";

export function LabCanvas({
  modules,
  edges,
  runs,
  steps,
  properties,
  clients,
}: {
  modules: AgentModule[];
  edges: AgentEdge[];
  runs: AgentRun[];
  steps: AgentRunStep[];
  properties: PropertyRecord[];
  clients: ClientRecord[];
}) {
  const [selected, setSelected] = useState<AgentModule | null>(modules[0] ?? null);
  const latestRun = runs[0];
  const latestSteps = latestRun ? steps.filter((step) => step.runId === latestRun.id) : [];

  const nodes: Node[] = useMemo(
    () =>
      modules.map((module) => ({
        id: module.id,
        position: { x: module.x, y: module.y },
        data: {
          label: (
            <div className="min-w-48 rounded-md border border-white/15 bg-[#121617] p-3 text-left shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#d7ff73]">
                <Box size={13} />
                Agent module
              </div>
              <div className="mt-2 text-sm font-black text-white">{module.label}</div>
              <div className="mt-1 text-xs leading-5 text-zinc-400">{module.description}</div>
            </div>
          ),
        },
        style: { background: "transparent", border: 0, padding: 0 },
      })),
    [modules],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: true,
        style: { stroke: "#d7ff73", strokeWidth: 1.5 },
        labelStyle: { fill: "#cbd5e1", fontSize: 11 },
      })),
    [edges],
  );

  return (
    <div className="grid h-[calc(100vh-8rem)] min-h-[720px] gap-4 xl:grid-cols-[1fr_380px]">
      <div className="overflow-hidden rounded-md border border-white/10 bg-[#0b0f10]">
        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          fitView
          minZoom={0.35}
          onNodeClick={(_, node) => setSelected(modules.find((module) => module.id === node.id) ?? null)}
        >
          <Background color="#243034" gap={28} />
          <MiniMap nodeColor="#d7ff73" maskColor="rgba(9,11,13,.78)" />
          <Controls />
        </ReactFlow>
      </div>
      <aside className="space-y-4 overflow-auto">
        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">Inspector</div>
          <h2 className="mt-2 text-xl font-black text-white">{selected?.label ?? "Select a module"}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{selected?.description}</p>
          {selected ? (
            <div className="mt-4 grid gap-3 text-sm">
              <Field label="Input" value={selected.inputSchema} />
              <Field label="Output" value={selected.outputSchema} />
              <Field label="Prompt" value={selected.promptSummary} />
            </div>
          ) : null}
        </div>

        <form action={runLabTest} className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">
            <Play size={14} />
            Test run
          </div>
          <label className="mt-4 grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Property
            <select name="propertyId" className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              {properties.map((property) => (
                <option key={property.id} value={property.id}>{property.title}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 grid gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            Client
            <select name="clientId" className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white">
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <button className="mt-4 h-10 w-full rounded-md bg-[#d7ff73] text-sm font-black text-[#11140c]">Run lab test</button>
        </form>

        <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">
            <Activity size={14} />
            Latest trace
          </div>
          <p className="mt-2 text-sm text-zinc-400">{latestRun?.summary ?? "No lab run yet."}</p>
          <div className="mt-4 space-y-2">
            {latestSteps.map((step) => (
              <div key={step.id} className="rounded-md border border-white/10 bg-black/25 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-white">{step.moduleKey}</div>
                <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-zinc-400">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-zinc-200">{value}</div>
    </div>
  );
}
