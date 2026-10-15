"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CreditCard, FileSearch, FileText, FolderKanban, GraduationCap, LibraryBig, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Plus, Settings, ShieldCheck, Wrench, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";

const developerLinks = [
  { href: "/dashboard", label: "Architect & Prompt", icon: Plus },
  { href: "/dashboard/docs", label: "Docs Generator", icon: FileText },
  { href: "/dashboard/docs/legal", label: "Legal & Compliance Kit", icon: ShieldCheck },
  { href: "/dashboard/toolbox", label: "Developer Toolbox", icon: Wrench },
  { href: "/dashboard/projects", label: "My Projects", icon: FolderKanban },
  { href: "/dashboard/audit", label: "Security Audit", icon: ShieldCheck },
];
const academicLinks = [
  { href: "/dashboard/academic", label: "Academic Overview", icon: GraduationCap },
  { href: "/dashboard/academic/research", label: "Deep Research", icon: FileSearch },
  { href: "/dashboard/academic/paper", label: "Academic Writing", icon: FileText },
  { href: "/dashboard/academic/study", label: "Study & Revision", icon: BookOpen },
  { href: "/dashboard/academic/library", label: "Academic Library", icon: LibraryBig },
];

export function Sidebar({ email }: { email: string; credits?: number }) {
  const path = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("bluiskill-sidebar-collapsed-v1") === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("bluiskill-sidebar-collapsed-v1", next ? "1" : "0");
      return next;
    });
  }
  const isAcademic = path.startsWith("/dashboard/academic");
  const visibleLinks = isAcademic ? academicLinks : developerLinks;

  useEffect(() => {
    document.documentElement.lang = "en";
    window.localStorage.setItem("bluiskill-language", "en");
  }, []);

  async function logout() {
    const sb = createClient();
    await sb.auth.signOut();
    window.localStorage.removeItem("bluiskill-workspace-selected-v2");
    router.push("/login");
    router.refresh();
  }

  function navigation(compact = collapsed) {
    return <nav className="flex flex-col gap-1" aria-label={isAcademic ? "Academic navigation" : "Developer Studio navigation"}>
      {!compact && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{isAcademic ? "Academic Workspace" : "Developer Studio"}</p>}
      {visibleLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={"flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (compact ? "justify-center" : "") + " " + (path === href || (href !== "/dashboard" && path.startsWith(href + "/")) ? "bg-blue-50 font-semibold text-blue-800" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")} title={compact ? label : undefined} aria-label={label}>
        <Icon size={17} strokeWidth={1.8}/>{!compact && <span>{label}</span>}
        {label === "Security Audit" && !compact && <span className="ml-auto rounded border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Beta</span>}
      </Link>)}
      <div className="mt-3 border-t border-zinc-200 pt-3">
        <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)} className={"mb-1 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (compact ? "justify-center" : "") + " " + (path.startsWith("/dashboard/settings") ? "bg-blue-50 font-semibold text-blue-800" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")} title={compact ? "Settings" : undefined} aria-label="Settings"><Settings size={17} strokeWidth={1.8}/>{!compact && <span>Settings</span>}</Link>
        <Link href="/dashboard/billing" onClick={() => setMobileOpen(false)} className={"flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition " + (compact ? "justify-center" : "") + " " + (path.startsWith("/dashboard/billing") ? "bg-blue-50 font-semibold text-blue-800" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950")} title={compact ? "Pricing & Billing" : undefined} aria-label="Pricing & Billing"><CreditCard size={17} strokeWidth={1.8}/>{!compact && <span>Pricing & Billing</span>}</Link>
      </div>
    </nav>;
  }

  function account(compact = collapsed) {
    return <div className="border-t border-zinc-200 pt-4">
      <div className={"flex items-center gap-2 px-1 " + (compact ? "justify-center" : "")}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700" title={email || "Guest session"}>{(email.charAt(0) || "G").toUpperCase()}</span>{!compact && <span className="min-w-0 flex-1 truncate text-xs text-zinc-600" title={email}>{email || "Guest session"}</span>}</div>
      {!compact && <div className="mt-4 border-t border-zinc-100 pt-3"><p className="px-1 text-xs leading-5 text-zinc-500">Need help? <a className="font-medium text-zinc-700 underline underline-offset-2" href="mailto:support@bluiskill.com">support@bluiskill.com</a></p><div className="mt-2 flex gap-3 px-1 text-xs text-zinc-500"><Link href="/terms" className="hover:text-zinc-900">Terms</Link><Link href="/privacy" className="hover:text-zinc-900">Privacy</Link></div></div>}
      {email ? <button onClick={logout} title={compact ? "Sign out" : undefined} aria-label="Sign out" className={"mt-3 flex min-h-9 items-center gap-2 rounded-lg px-2 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 " + (compact ? "w-9 justify-center" : "w-full")}><LogOut size={15}/>{!compact && "Sign out"}</button> : !compact && <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login?next=%2Fdashboard" className="rounded-lg border border-zinc-200 px-2 py-2 text-center text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Sign in</Link><Link href="/signup?next=%2Fdashboard" className="rounded-lg bg-blue-600 px-2 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700">Create account</Link></div>}
    </div>;
  }

  return <aside className={"relative z-40 w-full shrink-0 border-b border-zinc-200 bg-white transition-[width] duration-200 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r " + (collapsed ? "md:w-[72px]" : "md:w-60")}>
    <div className={"flex min-h-[62px] items-center justify-between gap-3 px-4 md:min-h-0 md:px-3 md:pb-6 md:pt-6 " + (collapsed ? "md:flex-col" : "")}><span onClick={() => setMobileOpen(false)} className="block min-w-0"><Logo href={isAcademic ? "/dashboard/academic" : "/dashboard"} size={collapsed ? "sm" : "md"} priority className={collapsed ? "md:justify-center" : ""} /></span><button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden h-9 w-9 shrink-0 place-items-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100 md:grid">{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button><div className="flex items-center gap-3 md:hidden"><button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50">{mobileOpen ? <X size={18}/> : <Menu size={18}/>}</button></div></div>
    <div className={"hidden md:block " + (collapsed ? "px-2" : "px-3")}>{navigation()}</div><div className={"mt-auto hidden pb-5 md:block " + (collapsed ? "px-2" : "px-3")}>{account()}</div>
    {mobileOpen && <div className="fixed left-0 top-[7.5rem] z-[100] max-h-[calc(100dvh-7.5rem)] w-[min(86vw,320px)] overflow-y-auto rounded-r-2xl border border-zinc-200 bg-white px-3 pb-4 pt-4 shadow-2xl md:hidden">{navigation(false)}<div className="mt-4">{account(false)}</div></div>}
  </aside>;
}
