import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getData } from "@/lib/store";

export default async function RunsPage() {
  const data = await getData();
  const runs = [...data.agentRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Audit"
        title="Runs and traces"
        description="Every matching or lab execution stores module-level inputs, outputs, model mode, and result status."
      />
      <section className="space-y-4">
        {runs.length ? runs.map((run) => {
          const steps = data.agentRunSteps.filter((step) => step.runId === run.id);
          return (
            <article key={run.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-white">{run.workflowKey}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{run.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={run.mode} />
                  <StatusBadge value={run.status} />
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {steps.map((step) => (
                  <div key={step.id} className="rounded-md border border-white/10 bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">{step.moduleKey}</div>
                      <StatusBadge value={step.status} />
                    </div>
                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-zinc-400">
                      {JSON.stringify(step.output, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </article>
          );
        }) : (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-sm text-zinc-400">
            No agent runs yet. Run matching or use the lab to create a trace.
          </div>
        )}
      </section>
    </AppShell>
  );
}
