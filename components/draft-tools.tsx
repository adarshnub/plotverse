"use client";

import { useState, useTransition } from "react";
import { Check, Copy, FilePlus2, X } from "lucide-react";
import { generateDraft, setDraftStatus, updateDraft } from "@/app/actions";

export function GenerateDraftButton({ matchId }: { matchId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => generateDraft(matchId))}
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#d7ff73]/30 px-3 text-xs font-bold text-[#d7ff73] transition hover:bg-[#d7ff73]/10 disabled:opacity-50"
    >
      <FilePlus2 size={14} />
      {pending ? "Drafting" : "Draft"}
    </button>
  );
}

export function DraftEditor({ id, initialBody, status }: { id: string; initialBody: string; status: string }) {
  const [body, setBody] = useState(initialBody);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function save() {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("editedBody", body);
    startTransition(() => updateDraft(formData));
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="space-y-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={5}
        className="w-full rounded-md border border-white/10 bg-black/30 p-3 text-sm leading-6 text-zinc-100 outline-none focus:border-[#d7ff73]/70"
      />
      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={pending} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10">
          Save edit
        </button>
        <button onClick={copyDraft} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/10">
          <Copy size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={() => startTransition(() => setDraftStatus(id, "approved"))}
          disabled={status === "approved"}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-xs font-black text-emerald-950 disabled:opacity-50"
        >
          <Check size={14} />
          Approve
        </button>
        <button
          onClick={() => startTransition(() => setDraftStatus(id, "rejected"))}
          disabled={status === "rejected"}
          className="inline-flex items-center gap-2 rounded-md bg-rose-400 px-3 py-2 text-xs font-black text-rose-950 disabled:opacity-50"
        >
          <X size={14} />
          Reject
        </button>
      </div>
    </div>
  );
}
