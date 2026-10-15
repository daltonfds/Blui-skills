"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PWAInstallButton } from "@/components/pwa-install-button";

type Workspace = "developer" | "academic";

export function WorkspaceHeader() {
  const pathname = usePathname();
  const active: Workspace = pathname.startsWith("/dashboard/academic") ? "academic" : "developer";
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en";
    window.localStorage.setItem("bluiskill-language", "en");
    if (!window.localStorage.getItem("bluiskill-workspace-selected-v2")) setShowWelcome(true);
  }, []);

  function chooseWorkspace(workspace: Workspace) {
    window.localStorage.setItem("bluiskill-workspace-selected-v2", workspace);
    setShowWelcome(false);
    window.location.href = workspace === "academic" ? "/dashboard/academic" : "/dashboard";
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <Link href="/dashboard" className="shrink-0 text-sm font-bold tracking-[0.14em] text-black">BluiSkill</Link>
          <nav aria-label="Workspace" className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto">
            <Link href="/dashboard" aria-current={active === "developer" ? "page" : undefined} className={"min-h-10 flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm " + (active === "developer" ? "border-blue-600 bg-blue-600 text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>Developer Studio</Link>
            <Link href="/dashboard/academic" aria-current={active === "academic" ? "page" : undefined} className={"min-h-10 flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm " + (active === "academic" ? "border-blue-600 bg-blue-600 text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>Academic Workspace</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <PWAInstallButton compact showButton={false} enablePromo />
            <Link href="/dashboard/billing" className="hidden text-xs font-medium text-zinc-700 underline-offset-4 hover:text-blue-700 hover:underline sm:inline sm:text-sm">Pricing</Link>
          </div>
        </div>
      </header>
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="workspace-welcome-title" className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-zinc-500">BluiSkill</p>
            <h2 id="workspace-welcome-title" className="mt-3 text-xl font-semibold tracking-tight text-black sm:text-2xl">Choose your workspace</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">Switch between workspaces whenever you need to.</p>
            <div className="mt-6 grid gap-3">
              <button onClick={() => chooseWorkspace("developer")} className="min-h-20 rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-blue-600 hover:bg-blue-50">
                <span className="block text-sm font-semibold text-black">Developer Studio</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">Product architecture, master prompts, technical specifications and code documentation.</span>
              </button>
              <button onClick={() => chooseWorkspace("academic")} className="min-h-20 rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-blue-600 hover:bg-blue-50">
                <span className="block text-sm font-semibold text-black">Academic Workspace</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">Source-based research, academic writing, study guides and active learning.</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
