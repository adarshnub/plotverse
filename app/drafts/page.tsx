import { DraftEditor } from "@/components/draft-tools";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getData } from "@/lib/store";

export default async function DraftsPage() {
  const data = await getData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Human approval"
        title="Drafts and approvals"
        description="Outbound automation stops here. Edit, approve, reject, or copy drafts manually; the app does not send messages in v1."
      />
      <section className="grid gap-4">
        {data.draftMessages.length ? data.draftMessages.map((draft) => {
          const match = data.matches.find((item) => item.id === draft.matchId);
          const property = data.properties.find((item) => item.id === match?.propertyId);
          const client = data.clients.find((item) => item.id === match?.clientId);
          return (
            <article key={draft.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-white">{client?.name ?? "Client"} {"->"} {property?.title ?? "Property"}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-500">{draft.channel} / {draft.tone}</p>
                </div>
                <StatusBadge value={draft.status} />
              </div>
              <DraftEditor id={draft.id} initialBody={draft.editedBody || draft.body} status={draft.status} />
            </article>
          );
        }) : (
          <div className="rounded-md border border-white/10 bg-white/[0.035] p-8 text-sm text-zinc-400">
            No drafts yet. Generate one from a match to bring it into the approval queue.
          </div>
        )}
      </section>
    </AppShell>
  );
}
