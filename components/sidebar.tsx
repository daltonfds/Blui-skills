"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, FolderKanban, LogOut, Menu, Plus, ShieldCheck, Wrench, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Architect & Prompt", icon: Plus },
  { href: "/dashboard/docs", label: "Docs Generator", icon: FileText },
  { href: "/dashboard/toolbox", label: "Dev Toolbox", icon: Wrench },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { href: "/dashboard/audit", label: "Security audit", icon: ShieldCheck },
];

export function Sidebar({ email, credits }: { email: string; credits: number }) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function navigation() {
    return (
      <nav className="flex flex-col gap-1">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Navigate</p>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={"flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (path === href || (href !== "/dashboard" && path.startsWith(href + "/")) ? "bg-zinc-100 font-medium text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")}>
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            {label === "Security audit" && <span className="ml-auto rounded border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Beta</span>}{label === "Docs Generator" && <span className="ml-auto rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-700">New</span>}
          </Link>
        ))}
      </nav>
    );
  }

  function account() {
    return (
      <div className="border-t border-zinc-200 pt-4">
        <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Usage</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm text-zinc-700"><Zap size={15} className="text-amber-500" /> Credits remaining</span>
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-sm font-semibold tabular-nums text-zinc-950">{credits}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{(email.charAt(0) || "U").toUpperCase()}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={email}>{email}</span>
        </div>
        <button onClick={logout} className="mt-3 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    );
  }

  return (
    <aside className="relative z-40 w-full shrink-0 border-b border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 md:min-h-0 md:justify-start md:px-5 md:pb-8 md:pt-6">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-950 text-white"><Zap size={17} fill="currentColor" /></span>
          <span><span className="block text-sm font-bold tracking-tight text-zinc-950">BLUI ARCHITECT</span><span className="mt-0.5 block text-[10px] font-medium tracking-[0.12em] text-zinc-400">WORKSPACE · V1.0</span></span>
        </Link>
        <div className="flex items-center gap-3 md:hidden">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700"><Zap size={13} className="text-amber-500" /> {credits}</span>
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div className="hidden px-3 md:block">{navigation()}</div>
      <div className="mt-auto hidden px-3 pb-5 md:block">{account()}</div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 px-3 pb-4 pt-4 shadow-lg md:hidden">
          {navigation()}
          <div className="mt-4">{account()}</div>
        </div>
      )}
    </aside>
  );
}
