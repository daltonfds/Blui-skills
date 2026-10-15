"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { PWAInstallButton } from "@/components/pwa-install-button";

type Workspace = "developer" | "academic";

const workspaces: Array<{ id: Workspace; title: string; description: string; href: string }> = [
  { id: "developer", title: "Developer Studio", description: "Product architecture, prompts and technical documentation.", href: "/dashboard" },
  { id: "academic", title: "Academic Workspace", description: "Research, academic writing and study tools.", href: "/dashboard/academic" },
];

export function WorkspaceHeader() {
  const pathname = usePathname();
  const active: Workspace = pathname.startsWith("/dashboard/academic") ? "academic" : "developer";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang = "en";
    window.localStorage.setItem("bluiskill-language", "en");
    function closeOnOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const current = workspaces.find((item) => item.id === active) ?? workspaces[0];

  return (
    <header className="relative z-30 border-b border-zinc-200 bg-white pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-3 py-2 sm:px-6">
        <Link href="/dashboard" className="shrink-0 text-sm font-bold tracking-[0.14em] text-black">BluiSkill</Link>
        <div className="relative min-w-0 flex-1 sm:flex-none" ref={menuRef}>
          <button type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-transparent px-3 text-left transition hover:border-zinc-200 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="min-w-0"><span className="block truncate text-sm font-semibold text-zinc-950">{current.title}</span><span className="hidden text-xs text-zinc-500 sm:block">Workspace</span></span>
            <ChevronDown size={16} className={"shrink-0 text-zinc-500 transition-transform " + (menuOpen ? "rotate-180" : "")}/>
          </button>
          {menuOpen && <div role="menu" aria-label="Choose workspace" className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(90vw,340px)] rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
            {workspaces.map((workspace) => {
              const selected = workspace.id === active;
              return <Link key={workspace.id} href={workspace.href} role="menuitem" aria-current={selected ? "page" : undefined} onClick={() => setMenuOpen(false)} className={"flex items-start gap-3 rounded-xl p-3 transition " + (selected ? "bg-blue-50" : "hover:bg-zinc-50")}>
                <span className={"mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border " + (selected ? "border-blue-600 bg-blue-600 text-white" : "border-zinc-300 text-transparent")}>{selected && <Check size={12}/>}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-950">{workspace.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{workspace.description}</span></span>
              </Link>;
            })}
          </div>}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <PWAInstallButton compact showButton={false} enablePromo />
          <Link href="/dashboard/billing" className="rounded-lg px-2 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-blue-700 sm:text-sm">Pricing</Link>
        </div>
      </div>
    </header>
  );
}
