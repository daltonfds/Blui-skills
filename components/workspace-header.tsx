"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Language = "pt" | "en" | "es" | "fr";
type Workspace = "developer" | "academic";

const labels: Record<Language, { developer: string; academic: string; billing: string; language: string; choose: string; intro: string }> = {
  pt: { developer: "Developer Studio", academic: "Academic Workspace", billing: "Faturação", language: "Idioma", choose: "Selecione o seu ambiente de trabalho", intro: "Pode alternar entre ambientes a qualquer momento no cabeçalho.",  },
  en: { developer: "Developer Studio", academic: "Academic Workspace", billing: "Billing", language: "Language", choose: "Choose your workspace", intro: "You can switch workspaces at any time from the header.",  },
  es: { developer: "Developer Studio", academic: "Academic Workspace", billing: "Facturación", language: "Idioma", choose: "Selecciona tu espacio de trabajo", intro: "Puedes cambiar de espacio en cualquier momento desde el encabezado.",  },
  fr: { developer: "Developer Studio", academic: "Academic Workspace", billing: "Facturation", language: "Langue", choose: "Choisissez votre espace de travail", intro: "Vous pouvez changer d’espace à tout moment depuis l’en-tête.",  },
};

export function WorkspaceHeader() {
  const pathname = usePathname();
  const active: Workspace = pathname.startsWith("/dashboard/academic") ? "academic" : "developer";
  const [language, setLanguage] = useState<Language>("pt");
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("bluiskill-language") as Language | null;
    if (savedLanguage && savedLanguage in labels) setLanguage(savedLanguage);
    if (!window.localStorage.getItem("bluiskill-workspace-selected")) setShowWelcome(true);
  }, []);

  function chooseWorkspace(workspace: Workspace) {
    window.localStorage.setItem("bluiskill-workspace-selected", workspace);
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
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="shrink-0 text-sm font-bold tracking-[0.14em] text-black">BLUISKILL</Link>
          <nav aria-label="Workspace" className="flex flex-wrap items-center gap-1">
            <Link href="/dashboard" aria-current={active === "developer" ? "page" : undefined} className={"rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm " + (active === "developer" ? "border-black bg-black text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>{t.developer}</Link>
            <Link href="/dashboard/academic" aria-current={active === "academic" ? "page" : undefined} className={"rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm " + (active === "academic" ? "border-black bg-black text-white" : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-black")}>{t.academic}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/billing" className="text-xs font-medium text-zinc-700 underline-offset-4 hover:text-black hover:underline sm:text-sm">{t.billing}</Link>
            <label className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="hidden sm:inline">{t.language}</span>
              <select aria-label={t.language} value={language} onChange={(event) => changeLanguage(event.target.value as Language)} className="min-h-9 rounded-lg border border-zinc-300 bg-white px-2 text-xs font-medium text-black outline-none focus:ring-2 focus:ring-zinc-400">
                <option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option>
              </select>
            </label>
          </div>
        </div>
      </header>


      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="workspace-welcome-title" className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-8">
            <p className="text-xs font-bold tracking-[0.18em] text-zinc-500">BLUISKILL</p>
            <h2 id="workspace-welcome-title" className="mt-3 text-xl font-semibold tracking-tight text-black sm:text-2xl">{t.choose}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{t.intro}</p>
            <div className="mt-6 grid gap-3">
              <button onClick={() => chooseWorkspace("developer")} className="rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-black hover:bg-zinc-50">
                <span className="block text-sm font-semibold text-black">{t.developer}</span>
                <span className="mt-1 block text-sm leading-5 text-zinc-600">{language === "pt" ? "Especificação técnica, arquitectura de software, master prompts e documentação de código." : language === "es" ? "Especificaciones técnicas, arquitectura de software, prompts maestros y documentación." : language === "fr" ? "Spécifications techniques, architecture logicielle, prompts maîtres et documentation." : "Technical specifications, software architecture, master prompts and code documentation."}</span>
              </button>
              <button onClick={() => chooseWorkspace("academic")} className="rounded-xl border border-zinc-300 bg-white p-4 text-left transition hover:border-black hover:bg-zinc-50">
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
