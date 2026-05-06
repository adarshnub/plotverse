import { AppShell } from "@/components/app-shell";
import { ClientForm, CsvImportForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { getData } from "@/lib/store";
import { currency } from "@/lib/utils";

export default async function ClientsPage() {
  const data = await getData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Demand"
        title="Clients"
        description="Track budgets, preferred areas, blockers, and must-haves so the agent modules can make grounded recommendations."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
          <div className="grid grid-cols-[1fr_.8fr_.8fr_.5fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            <div>Client</div>
            <div>Budget</div>
            <div>Areas</div>
            <div>Need</div>
          </div>
          <div className="divide-y divide-white/10">
            {data.clients.map((client) => (
              <div key={client.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm md:grid-cols-[1fr_.8fr_.8fr_.5fr] md:items-center">
                <div>
                  <div className="font-bold text-white">{client.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">{client.contact || client.urgency}</div>
                </div>
                <div className="font-bold text-white">{currency(client.budgetMin)} - {currency(client.budgetMax)}</div>
                <div className="text-zinc-300">{client.preferredAreas.join(", ") || "Open"}</div>
                <div className="text-zinc-400">{client.minBedrooms}+ bed / {client.propertyType}</div>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <CsvImportForm target="clients" />
          <ClientForm />
        </aside>
      </div>
    </AppShell>
  );
}
