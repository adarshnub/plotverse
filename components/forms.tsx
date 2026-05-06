import { Upload } from "lucide-react";
import { createClientRecord, createProperty, importCsv } from "@/app/actions";

const inputClass =
  "min-h-10 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#d7ff73]/70";
const labelClass = "grid gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400";

export function CsvImportForm({ target }: { target: "properties" | "clients" }) {
  return (
    <form action={importCsv} className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-end">
      <input type="hidden" name="target" value={target} />
      <label className={`${labelClass} flex-1 normal-case tracking-normal`}>
        CSV import
        <input name="file" type="file" accept=".csv,text/csv" required className={inputClass} />
      </label>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#d7ff73] px-4 text-sm font-black text-[#11140c]">
        <Upload size={16} />
        Import
      </button>
    </form>
  );
}

export function PropertyForm() {
  return (
    <form action={createProperty} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
      <label className={labelClass}>Title<input className={inputClass} name="title" required placeholder="Sea-facing apartment" /></label>
      <label className={labelClass}>Area<input className={inputClass} name="area" required placeholder="Bandra West" /></label>
      <label className={labelClass}>Address<input className={inputClass} name="address" placeholder="Building / road" /></label>
      <label className={labelClass}>City<input className={inputClass} name="city" defaultValue="Mumbai" /></label>
      <label className={labelClass}>Type<input className={inputClass} name="propertyType" defaultValue="Apartment" /></label>
      <label className={labelClass}>Price<input className={inputClass} name="price" type="number" required placeholder="82000000" /></label>
      <label className={labelClass}>Size sqft<input className={inputClass} name="sizeSqft" type="number" /></label>
      <label className={labelClass}>Bedrooms<input className={inputClass} name="bedrooms" type="number" /></label>
      <label className={labelClass}>Bathrooms<input className={inputClass} name="bathrooms" type="number" /></label>
      <label className={labelClass}>Amenities<input className={inputClass} name="amenities" placeholder="Parking, Sea view, Security" /></label>
      <label className={`${labelClass} md:col-span-2`}>Notes<textarea className={inputClass} name="notes" rows={3} /></label>
      <button className="h-10 rounded-md bg-[#d7ff73] px-4 text-sm font-black text-[#11140c] md:col-span-2">Add property</button>
    </form>
  );
}

export function ClientForm() {
  return (
    <form action={createClientRecord} className="grid gap-3 rounded-md border border-white/10 bg-white/[0.03] p-4 md:grid-cols-2">
      <label className={labelClass}>Name<input className={inputClass} name="name" required placeholder="Riya Mehra" /></label>
      <label className={labelClass}>Contact notes<input className={inputClass} name="contact" placeholder="WhatsApp preferred" /></label>
      <label className={labelClass}>Budget min<input className={inputClass} name="budgetMin" type="number" /></label>
      <label className={labelClass}>Budget max<input className={inputClass} name="budgetMax" type="number" required /></label>
      <label className={labelClass}>Preferred areas<input className={inputClass} name="preferredAreas" placeholder="Bandra West, Khar West" /></label>
      <label className={labelClass}>Property type<input className={inputClass} name="propertyType" defaultValue="Apartment" /></label>
      <label className={labelClass}>Min bedrooms<input className={inputClass} name="minBedrooms" type="number" /></label>
      <label className={labelClass}>Min size sqft<input className={inputClass} name="minSizeSqft" type="number" /></label>
      <label className={labelClass}>Must haves<input className={inputClass} name="mustHaves" placeholder="Parking, Security" /></label>
      <label className={labelClass}>Deal blockers<input className={inputClass} name="dealBlockers" placeholder="No parking" /></label>
      <label className={labelClass}>Urgency<select className={inputClass} name="urgency" defaultValue="medium"><option>low</option><option>medium</option><option>high</option></select></label>
      <label className={`${labelClass} md:col-span-2`}>Notes<textarea className={inputClass} name="notes" rows={3} /></label>
      <button className="h-10 rounded-md bg-[#d7ff73] px-4 text-sm font-black text-[#11140c] md:col-span-2">Add client</button>
    </form>
  );
}
