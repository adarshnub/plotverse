import { AppShell } from "@/components/app-shell";
import { CsvImportForm, PropertyForm } from "@/components/forms";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getData } from "@/lib/store";
import { currency } from "@/lib/utils";

export default async function PropertiesPage() {
  const data = await getData();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Inventory"
        title="Properties"
        description="Add properties manually or import CSV inventory. These records feed the deterministic matcher and AI fit analyst."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
          <div className="grid grid-cols-[1.2fr_.75fr_.6fr_.45fr_.45fr] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
            <div>Property</div>
            <div>Area</div>
            <div>Price</div>
            <div>Specs</div>
            <div>Status</div>
          </div>
          <div className="divide-y divide-white/10">
            {data.properties.map((property) => (
              <div key={property.id} className="grid grid-cols-1 gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_.75fr_.6fr_.45fr_.45fr] md:items-center">
                <div>
                  <div className="font-bold text-white">{property.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{property.address || property.source}</div>
                </div>
                <div className="text-zinc-300">{property.area}, {property.city}</div>
                <div className="font-bold text-white">{currency(property.price)}</div>
                <div className="text-zinc-400">{property.bedrooms} bed / {property.sizeSqft} sqft</div>
                <StatusBadge value={property.status} />
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <CsvImportForm target="properties" />
          <PropertyForm />
        </aside>
      </div>
    </AppShell>
  );
}
