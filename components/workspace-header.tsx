"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PWAInstallButton } from "@/components/pwa-install-button";

type Language = "pt" | "en" | "es" | "fr";
type Workspace = "developer" | "academic";

const labels: Record<Language, { developer: string; academic: string; billing: string; language: string; choose: string; intro: string }> = {
  pt: { developer: "Developer Studio", academic: "Academic", billing: "Faturação", language: "Idioma", choose: "Selecione o seu ambiente de trabalho", intro: "Pode alternar entre ambientes a qualquer momento no cabeçalho." },
  en: { developer: "Developer Studio", academic: "Academic", billing: "Billing", language: "Language", choose: "Choose your workspace", intro: "You can switch workspaces at any time from the header." },
  es: { developer: "Developer Studio", academic: "Academic", billing: "Facturación", language: "Idioma", choose: "Selecciona tu espacio de trabajo", intro: "Puedes cambiar de espacio en cualquier momento desde el encabezado." },
  fr: { developer: "Developer Studio", academic: "Academic", billing: "Facturation", language: "Langue", choose: "Choisissez votre espace de travail", intro: "Vous pouvez changer d’espace à tout moment depuis l’en-tête." },
};

export function WorkspaceHeader() {
  const pathname = usePathname();
  const active: Workspace = pathname.startsWith("/dashboard/academic") ? "academic" : "developer";
  const [language, setLanguage] = useState<Language>("pt");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("bluiskill-language") as Language | null;
    const browserLanguage = window.navigator.language.toLowerCase().split("-")[0] as Language;
    const initialLanguage = savedLanguage && savedLanguage in labels
      ? savedLanguage
      : browserLanguage in labels
        ? browserLanguage
        : "en";
    setLanguage(initialLanguage);
    document.documentElement.lang = initialLanguage;
    if (!savedLanguage) window.localStorage.setItem("bluiskill-language", initialLanguage);
    if (!window.localStorage.getItem("bluiskill-workspace-selected-v2")) setShowWelcome(true);
  }, []);

  function chooseWorkspace(workspace: Workspace) {
    window.localStorage.setItem("bluiskill-workspace-selected-v2", workspace);
    setShowWelcome(false);
    window.location.href = workspace === "academic" ? "/dashboard/academic" : "/dashboard";
  }

  function changeLanguage(value: Language) {
    setLanguage(value);
    window.localStorage.setItem("bluiskill-language", value);
    document.documentElement.lang = value;
    window.dispatchEvent(new CustomEvent("bluiskill:language-change", { detail: value }));
  }

  const t = labels[language];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <Link href="/dashboard" className="shrink-0 text-sm font-bold tracking-[0.14em] text-black">BluiSkill</Link>
          <nav aria-label="Workspace" className="order-3 flex w-full items-center gap-1 sm:order-none sm:w-auto">
            <Link href="/dashboard" aria-current={active === "developer" ? "page" : undefined} className={"min-h-10 flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm " + (active === "developer" ? "border-black bg-black text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>{t.developer}</Link>
            <Link href="/dashboard/academic" aria-current={active === "academic" ? "page" : undefined} className={"min-h-10 flex-1 rounded-lg border px-2 py-2 text-center text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:text-sm " + (active === "academic" ? "border-black bg-black text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>{t.academic}</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <PWAInstallButton compact showButton={false} enablePromo />
            <Link href="/dashboard/billing" className="hidden text-xs font-medium text-zinc-700 underline-offset-4 hover:text-black hover:underline sm:inline sm:text-sm">{t.billing}</Link>
            <label className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="sr-only sm:not-sr-only sm:inline">{t.language}</span>
              <select aria-label={t.language} value={language} onChange={(event) => changeLanguage(event.target.value as Language)} className="min-h-10 max-w-[112px] rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium text-black outline-none focus:ring-2 focus:ring-zinc-400 sm:max-w-none">
                <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="workspace-welcome-title" className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-zinc-500">BluiSkill</p>
            <h2 id="workspace-welcome-title" className="mt-3 text-xl font-semibold tracking-tight text-black sm:text-2xl">{t.choose}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t.intro}</p>
            <div className="mt-6 grid gap-3">
              <button onClick={() => chooseWorkspace("developer")} className="min-h-20 rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-black hover:bg-zinc-50">
                <span className="block text-sm font-semibold text-black">{t.developer}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">{language === "pt" ? "Especificação técnica, arquitectura de software, master prompts e documentação de código." : language === "es" ? "Especificaciones técnicas, arquitectura de software, prompts maestros y documentación." : language === "fr" ? "Spécifications techniques, architecture logicielle, prompts maîtres et documentation." : "Technical specifications, software architecture, master prompts and code documentation."}</span>
              </button>
              <button onClick={() => chooseWorkspace("academic")} className="min-h-20 rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-black hover:bg-zinc-50">
                <span className="block text-sm font-semibold text-black">{t.academic}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">{language === "pt" ? "Pesquisa baseada em fontes, trabalhos ABNT/APA e aprendizagem activa." : language === "es" ? "Investigación basada en fuentes, trabajos ABNT/APA y aprendizaje activo." : language === "fr" ? "Recherche fondée sur les sources, travaux ABNT/APA et apprentissage actif." : "Source-based research, ABNT/APA papers and active learning."}</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
