"use client";

import { useTransition } from "react";
import { Play } from "lucide-react";
import { runMatchesAction } from "@/app/actions";

export function MatchRunner() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => runMatchesAction())}
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#d7ff73] px-4 text-sm font-black text-[#11140c] disabled:cursor-wait disabled:opacity-60"
    >
      <Play size={16} />
      {pending ? "Running..." : "Run matching"}
    </button>
  );
}
