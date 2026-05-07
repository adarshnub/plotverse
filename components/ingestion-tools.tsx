"use client";

import { useTransition } from "react";
import { Check, Play, X } from "lucide-react";
import { approveScrapeItem, rejectScrapeItem, runKottayamScrapeAction } from "@/app/actions";
import type { ScrapeSource } from "@/lib/types";

export function ScrapeRunForm({ sources }: { sources: ScrapeSource[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => runKottayamScrapeAction(formData))}
      className="rounded-md border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff73]">Kottayam district</div>
          <h2 className="mt-1 text-lg font-black text-white">Source run</h2>
        </div>
        <button
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#d7ff73] px-4 text-sm font-black text-[#11140c] disabled:cursor-wait disabled:opacity-60"
        >
          <Play size={16} />
          {pending ? "Running..." : "Run scraper"}
        </button>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((source) => (
          <label key={source.id} className="flex items-start gap-3 rounded-md border border-white/10 bg-black/25 p-3 text-sm">
            <input name="sourceIds" value={source.id} type="checkbox" defaultChecked={source.enabled} className="mt-1 accent-[#d7ff73]" />
            <span>
              <span className="block font-bold text-white">{source.name}</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">{source.notes}</span>
            </span>
          </label>
        ))}
      </div>
    </form>
  );
}

export function ScrapeItemActions({ itemId, disabled }: { itemId: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <button
        disabled={disabled || pending}
        onClick={() => startTransition(() => approveScrapeItem(itemId))}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-400 px-3 text-xs font-black text-emerald-950 disabled:opacity-50"
      >
        <Check size={14} />
        Import
      </button>
      <button
        disabled={disabled || pending}
        onClick={() => startTransition(() => rejectScrapeItem(itemId))}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-400 px-3 text-xs font-black text-rose-950 disabled:opacity-50"
      >
        <X size={14} />
        Reject
      </button>
    </div>
  );
}
