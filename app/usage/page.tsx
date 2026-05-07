import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { aggregateUsage } from "@/lib/token-usage";
import { getData } from "@/lib/store";
import { numberCompact } from "@/lib/utils";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});

export default async function UsagePage() {
  const data = await getData();
  const events = [...data.tokenUsageEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totals = aggregateUsage(events);
  const byModel = groupBy(events, (event) => event.model);
  const byAction = groupBy(events, (event) => event.actionType);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Model ledger"
        title="Token usage and cost"
        description="Tracks every OpenAI-backed action: match evaluation, outreach draft generation, and Kottayam scrape normalization."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total tokens" value={numberCompact(totals.totalTokens)} />
        <Metric label="Input tokens" value={numberCompact(totals.inputTokens)} />
        <Metric label="Output tokens" value={numberCompact(totals.outputTokens)} />
        <Metric label="Estimated cost" value={money.format(totals.totalCostUsd)} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Breakdown title="By model" entries={byModel} />
        <Breakdown title="By action" entries={byAction} />
      </section>

      <section className="mt-6 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Recent events</h2>
        </div>
        <div className="divide-y divide-white/10">
          {events.length ? (
            events.map((event) => (
              <div key={event.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[1fr_180px_140px_140px_130px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={event.actionType} />
                    <span className="font-bold text-white">{event.actionLabel}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()} / {event.pricingSource}</div>
                </div>
                <div className="font-mono text-xs text-[#d7ff73]">{event.model}</div>
                <div className="text-zinc-300">{numberCompact(event.inputTokens)} in</div>
                <div className="text-zinc-300">{numberCompact(event.outputTokens)} out</div>
                <div className="font-bold text-white">{money.format(event.totalCostUsd)}</div>
              </div>
            ))
          ) : (
            <div className="p-8 text-sm text-zinc-400">
              No model usage has been recorded yet. Run matching, generate a draft, or run ingestion with `OPENAI_API_KEY` configured.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
    </div>
  );
}

function Breakdown({ title, entries }: { title: string; entries: Array<{ key: string; tokens: number; cost: number }> }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.length ? (
          entries.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-black/25 p-3">
              <div className="font-bold text-zinc-100">{entry.key}</div>
              <div className="text-right text-sm text-zinc-400">
                <div>{numberCompact(entry.tokens)} tokens</div>
                <div className="font-bold text-white">{money.format(entry.cost)}</div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-400">No usage yet.</p>
        )}
      </div>
    </div>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, { key: string; tokens: number; cost: number }>();
  for (const item of items as Array<T & { totalTokens: number; totalCostUsd: number }>) {
    const key = keyFn(item);
    const current = groups.get(key) ?? { key, tokens: 0, cost: 0 };
    current.tokens += item.totalTokens;
    current.cost += item.totalCostUsd;
    groups.set(key, current);
  }
  return Array.from(groups.values()).sort((a, b) => b.cost - a.cost);
}
