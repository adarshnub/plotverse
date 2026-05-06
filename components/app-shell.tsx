import Link from "next/link";
import {
  Activity,
  Beaker,
  Building2,
  ClipboardCheck,
  GitBranch,
  Home,
  MessageSquareText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/matches", label: "Matches", icon: GitBranch },
  { href: "/drafts", label: "Approvals", icon: ClipboardCheck },
  { href: "/runs", label: "Runs", icon: Activity },
  { href: "/lab", label: "Lab", icon: Beaker },
];

export function AppShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-[#090b0d] text-zinc-100">
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(120deg,rgba(42,93,85,.16),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(238,190,92,.12),transparent_28%)]" />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-white/10 bg-[#0d1011]/95 px-4 py-5 backdrop-blur lg:block">
        <Link href="/" className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-[#d7ff73] text-[#11140c]">
            <MessageSquareText size={20} />
          </div>
          <div>
            <div className="text-sm font-black uppercase tracking-[0.22em] text-white">Plotverse</div>
            <div className="text-xs text-zinc-400">Automation Studio</div>
          </div>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
              >
                <Icon size={17} className="text-zinc-500 transition group-hover:text-[#d7ff73]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 rounded-md border border-[#d7ff73]/20 bg-[#d7ff73]/8 p-3 text-xs leading-5 text-zinc-300">
          Draft-only mode is active. Every outbound message waits for your approval.
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#090b0d]/80 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/" className="font-black uppercase tracking-[0.22em]">Plotverse</Link>
            <Link href="/lab" className="rounded-md bg-[#d7ff73] px-3 py-1.5 text-xs font-bold text-[#11140c]">Lab</Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className={cn("mx-auto min-h-screen px-4 py-6 sm:px-6 lg:px-8", wide ? "max-w-none" : "max-w-7xl")}>
          {children}
        </main>
      </div>
    </div>
  );
}
