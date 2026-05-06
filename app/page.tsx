import Link from "next/link";
import { Activity, ArrowUpRight, Building2, ClipboardCheck, GitBranch, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { MatchRunner } from "@/components/match-runner";
import { getDashboardData } from "@/lib/store";
import { currency } from "@/lib/utils";

export default async function Home() {
  const data = await getDashboardData();
  const topMatches = [...data.matches].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Personal command center"
        title="Match properties to clients, then approve the next move."
        description="Plotverse keeps the real-estate workflow visible: inventory, buyers, agent reasoning, outreach drafts, and the lab trace behind each decision."
        action={<MatchRunner />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Building2} label="Properties" value={data.metrics.properties} href="/properties" />
        <Metric icon={Users} label="Clients" value={data.metrics.clients} href="/clients" />
        <Metric icon={GitBranch} label="Active matches" value={data.metrics.matches} href="/matches" />
        <Metric icon={ClipboardCheck} label="Pending approvals" value={data.metrics.pendingDrafts} href="/drafts" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-md border border-white/10 bg-white/[0.035]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">Best current matches</h2>
            <Link href="/matches" className="inline-flex items-center gap-1 text-xs font-bold text-[#d7ff73]">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {topMatches.length ? (
              topMatches.map((match) => {
                const property = data.properties.find((item) => item.id === match.propertyId);
                const client = data.clients.find((item) => item.id === match.clientId);
                return (
                  <div key={match.id} className="grid gap-3 p-4 md:grid-cols-[80px_1fr_160px] md:items-center">
                    <div className="text-3xl font-black text-[#d7ff73]">{match.score}</div>
                    <div>
                      <div className="font-bold text-white">{property?.title} {"->"} {client?.name}</div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-400">{match.fitSummary}</p>
                    </div>
                    <StatusBadge value={match.status} />
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-sm text-zinc-400">No matches yet. Run the matching workflow to create the first ranked list.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-white">
              <Activity size={16} className="text-[#d7ff73]" />
              Recent runs
            </div>
            <div className="mt-4 space-y-3">
              {data.latestRuns.length ? data.latestRuns.map((run) => (
                <div key={run.id} className="rounded-md border border-white/10 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-white">{run.workflowKey}</div>
                    <StatusBadge value={run.status} />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{run.summary}</p>
                </div>
              )) : <p className="text-sm text-zinc-400">Run history will appear here.</p>}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-[#d7ff73] p-4 text-[#11140c]">
            <div className="text-xs font-black uppercase tracking-[0.2em]">Inventory pulse</div>
            <div className="mt-2 text-2xl font-black">{currency(data.properties.reduce((sum, property) => sum + property.price, 0))}</div>
            <p className="mt-1 text-sm font-semibold text-[#2c340f]">Total asking value in your active workspace.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ icon: Icon, label, value, href }: { icon: typeof Building2; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="group rounded-md border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#d7ff73]/40 hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <Icon size={19} className="text-[#d7ff73]" />
        <ArrowUpRight size={16} className="text-zinc-600 transition group-hover:text-[#d7ff73]" />
      </div>
      <div className="mt-5 text-4xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
    </Link>
  );
}
