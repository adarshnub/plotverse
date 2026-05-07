import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ScrapeItemActions, ScrapeRunForm } from "@/components/ingestion-tools";
import { StatusBadge } from "@/components/status-badge";
import { getData } from "@/lib/store";
import { currency, numberCompact } from "@/lib/utils";

export default async function IngestionPage() {
  const data = await getData();
  const latestRun = [...data.scrapeRuns].sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  const reviewItems = [...data.scrapeItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const counts = {
    review: data.scrapeItems.filter((item) => item.status === "review").length,
    imported: data.scrapeItems.filter((item) => item.status === "imported").length,
    duplicate: data.scrapeItems.filter((item) => item.status === "duplicate").length,
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Kottayam sourcing"
        title="Plot ingestion queue"
        description="Run public-source scrapers for Kottayam district, normalize plot and demand candidates, then approve only the records worth adding to Plotverse."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Review queue" value={counts.review} />
        <Metric label="Imported" value={counts.imported} />
        <Metric label="Duplicates" value={counts.duplicate} />
      </section>

      <div className="mt-6">
        <ScrapeRunForm sources={data.scrapeSources} />
      </div>

      {latestRun ? (
        <section className="mt-6 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">Latest run</div>
              <p className="mt-1 text-sm text-zinc-400">{latestRun.scope}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={latestRun.status} />
              <span className="text-sm text-zinc-400">{latestRun.itemsFound} found / {latestRun.itemsImported} imported</span>
            </div>
          </div>
          {latestRun.errors.length ? (
            <div className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/8 p-3 text-xs leading-5 text-amber-100">
              {latestRun.errors.slice(0, 5).map((error) => <div key={error}>{error}</div>)}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 space-y-3">
        {reviewItems.length ? reviewItems.map((item) => (
          <article key={item.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_210px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.status} />
                  <StatusBadge value={item.kind} />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{item.sourceSite}</span>
                </div>
                <h2 className="mt-3 text-lg font-black text-white">{item.title}</h2>
                <p className="mt-1 text-sm text-zinc-400">{item.locality}, {item.district}</p>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                  <Fact label="Price" value={item.price ? currency(item.price) : "Unknown"} />
                  <Fact label="Area" value={item.plotArea ? `${item.plotArea} ${item.areaUnit}` : "Unknown"} />
                  <Fact label="Sqft" value={item.plotAreaSqft ? numberCompact(item.plotAreaSqft) : "Unknown"} />
                  <Fact label="Per cent" value={item.pricePerCent ? currency(item.pricePerCent) : "Unknown"} />
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{item.requirementText || item.rawText}</p>
                <Link href={item.sourceUrl} target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#d7ff73]">
                  Open source <ExternalLink size={13} />
                </Link>
              </div>
              <div className="flex flex-col items-start gap-3 lg:items-end">
                {item.duplicateOf ? <div className="rounded-md border border-amber-500/20 bg-amber-500/8 p-3 text-xs text-amber-100">Possible duplicate of {item.duplicateOf}</div> : null}
                <ScrapeItemActions itemId={item.id} disabled={item.status === "imported" || item.status === "rejected"} />
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-sm text-zinc-400">
            No scraped candidates yet. Run the Kottayam scraper to populate the review queue.
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <div className="text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-1 font-bold text-zinc-100">{value}</div>
    </div>
  );
}
