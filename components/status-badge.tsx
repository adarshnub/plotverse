import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  active: "border-emerald-500/40 bg-emerald-500/12 text-emerald-200",
  new: "border-sky-500/40 bg-sky-500/12 text-sky-200",
  reviewed: "border-amber-500/40 bg-amber-500/12 text-amber-200",
  drafted: "border-cyan-500/40 bg-cyan-500/12 text-cyan-200",
  pending: "border-amber-500/40 bg-amber-500/12 text-amber-200",
  approved: "border-emerald-500/40 bg-emerald-500/12 text-emerald-200",
  rejected: "border-rose-500/40 bg-rose-500/12 text-rose-200",
  completed: "border-emerald-500/40 bg-emerald-500/12 text-emerald-200",
  failed: "border-rose-500/40 bg-rose-500/12 text-rose-200",
  running: "border-cyan-500/40 bg-cyan-500/12 text-cyan-200",
  imported: "border-emerald-500/40 bg-emerald-500/12 text-emerald-200",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        variants[value] || "border-white/15 bg-white/8 text-zinc-300",
        className,
      )}
    >
      {value}
    </span>
  );
}
