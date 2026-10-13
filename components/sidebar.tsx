"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CreditCard, FileSearch, FileText, FolderKanban, GraduationCap, LibraryBig, LogOut, Menu, Plus, ShieldCheck, Wrench, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const developerLinks = [
  { href: "/dashboard", label: "Architect & Prompt", icon: Plus },
  { href: "/dashboard/docs", label: "Docs Generator", icon: FileText },
  { href: "/dashboard/docs/legal", label: "Legal & Compliance Kit", icon: ShieldCheck },
  { href: "/dashboard/toolbox", label: "Dev Toolbox", icon: Wrench },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { href: "/dashboard/audit", label: "Security audit", icon: ShieldCheck },
];
const academicLinks = [
  { href: "/dashboard/academic", label: "Academic overview", icon: GraduationCap },
  { href: "/dashboard/academic/research", label: "Deep Research", icon: FileSearch },
  { href: "/dashboard/academic/paper", label: "Academic Writing", icon: FileText },
  { href: "/dashboard/academic/study", label: "Study Setup", icon: BookOpen },
  { href: "/dashboard/academic/library", label: "Academic Library", icon: LibraryBig },
];

export function Sidebar({ email }: { email: string; credits?: number }) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAcademic = path.startsWith("/dashboard/academic");
  const visibleLinks = isAcademic ? academicLinks : developerLinks;

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    window.localStorage.removeItem("bluiskill-workspace-selected-v2");
    router.push("/login");
    router.refresh();
  }

  function navigation() {
    return (
      <nav className="flex flex-col gap-1" aria-label={isAcademic ? "Academic navigation" : "Developer Studio navigation"}>
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{isAcademic ? "Academic" : "Developer Studio"}</p>
        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={"flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (path === href || (href !== "/dashboard" && path.startsWith(href + "/")) ? "bg-zinc-100 font-semibold text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")}>
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            {label === "Security audit" && <span className="ml-auto rounded border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Beta</span>}
          </Link>
        ))}
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <Link href="/dashboard/billing" onClick={() => setMobileOpen(false)} className={"flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (path.startsWith("/dashboard/billing") ? "bg-zinc-100 font-semibold text-zinc-950" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")}>
            <CreditCard size={17} strokeWidth={1.8}/><span>{isAcademic ? "Billing" : "Billing"}</span>
          </Link>
        </div>
      </nav>
    );
  }

  function account() {
    return (
      <div className="border-t border-zinc-200 pt-4">
        <div className="flex items-center gap-2 px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">{(email.charAt(0) || "U").toUpperCase()}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={email}>{email}</span>
        </div>
        <div className="mt-4 border-t border-zinc-100 pt-3"><p className="px-1 text-xs leading-5 text-zinc-500">Need help? <a className="font-medium text-zinc-700 underline underline-offset-2" href="mailto:support@bluiskill.com">support@bluiskill.com</a></p><div className="mt-2 flex gap-3 px-1 text-xs text-zinc-500"><Link href="/terms" className="hover:text-zinc-900">Terms</Link><Link href="/privacy" className="hover:text-zinc-900">Privacy</Link></div></div>
        <button onClick={logout} className="mt-3 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"><LogOut size={15} /> Sign out</button>
      </div>
    );
  }

  return (
    <aside className="relative z-40 w-full shrink-0 border-b border-zinc-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="flex min-h-[62px] items-center justify-between gap-3 px-4 md:min-h-0 md:justify-start md:px-5 md:pb-8 md:pt-6">
        <Link href={isAcademic ? "/dashboard/academic" : "/dashboard"} className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}><span className="block text-base font-bold tracking-tight text-zinc-950">BluiSkill</span></Link>
        <div className="flex items-center gap-3 md:hidden"><button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button></div>
      </div>
      <div className="hidden px-3 md:block">{navigation()}</div>
      <div className="mt-auto hidden px-3 pb-5 md:block">{account()}</div>
      {mobileOpen && <div className="border-t border-zinc-200 px-3 pb-4 pt-4 shadow-lg md:hidden">{navigation()}<div className="mt-4">{account()}</div></div>}
    </aside>
  );
}
