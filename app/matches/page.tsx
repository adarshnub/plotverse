import { GenerateDraftButton } from "@/components/draft-tools";
import { AppShell } from "@/components/app-shell";
import { MatchRunner } from "@/components/match-runner";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getData } from "@/lib/store";

export default async function MatchesPage() {
  const data = await getData();
  const matches = [...data.matches].sort((a, b) => b.score - a.score);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agent output"
        title="Ranked matches"
        description="Deterministic rules create the guardrails; AI explains fit, objections, and next action for passing candidates."
        action={<MatchRunner />}
      />
      <section className="space-y-3">
        {matches.length ? matches.map((match) => {
          const property = data.properties.find((item) => item.id === match.propertyId);
          const client = data.clients.find((item) => item.id === match.clientId);
          return (
            <article key={match.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <div className="grid gap-4 lg:grid-cols-[84px_1fr_180px]">
                <div className="text-4xl font-black text-[#d7ff73]">{match.score}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-white">{property?.title} {"->"} {client?.name}</h2>
                    <StatusBadge value={match.ruleResult.passed ? "active" : "reviewed"} />
                    <StatusBadge value={match.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{match.fitSummary}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/8 p-3">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Reasons</div>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                        {match.ruleResult.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/8 p-3">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Objections</div>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                        {match.objections.map((objection) => <li key={objection}>{objection}</li>)}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-[#d7ff73]">{match.suggestedNextAction}</p>
                </div>
                <div className="flex items-start justify-end">
                  <GenerateDraftButton matchId={match.id} />
                </div>
              </div>
            </article>
          );
        }) : (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-sm text-zinc-400">
            No ranked matches yet. Run matching from this page or the overview.
          </div>
        )}
      </section>
    </AppShell>
  );
}
