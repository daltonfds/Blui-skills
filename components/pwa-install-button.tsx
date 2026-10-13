"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIos(/iphone|ipad|ipod/.test(ua) && !("MSStream" in window));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installed) return;
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setPromptEvent(null);
      return;
    }
    setShowHelp(true);
  }

  const label = installed ? "Instalada" : compact ? "Instalar" : "Instalar app";

  return (
    <>
      <button type="button" onClick={install} disabled={installed} aria-label={label}
        className={"inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm " + (installed ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-black bg-black text-white hover:bg-zinc-800")}>
        {installed ? <Check size={15} /> : <Download size={15} />}
        <span>{label}</span>
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-5" onClick={() => setShowHelp(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">BluiSkill</p>
                <h2 id="pwa-install-title" className="mt-2 text-lg font-semibold text-zinc-950">Instalar no dispositivo</h2>
              </div>
              <button type="button" onClick={() => setShowHelp(false)} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"><X size={17} /></button>
            </div>
            {ios ? (
              <ol className="mt-5 space-y-4 text-sm leading-6 text-zinc-700">
                <li className="flex gap-3"><Share size={19} className="mt-1 shrink-0 text-zinc-900" /><span>No Safari, toca em <strong>Partilhar</strong>.</span></li>
                <li className="flex gap-3"><span className="grid size-5 shrink-0 place-items-center rounded border border-zinc-300 text-xs font-semibold">+</span><span>Escolhe <strong>Adicionar ao ecrã principal</strong>.</span></li>
                <li className="flex gap-3"><Check size={19} className="mt-1 shrink-0 text-zinc-900" /><span>Confirma em <strong>Adicionar</strong> para abrir a BluiSkill como aplicação.</span></li>
              </ol>
            ) : (
              <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
                <p>Se a opção de instalação não apareceu automaticamente, abre o menu do navegador e procura <strong>Instalar aplicação</strong> ou <strong>Adicionar ao ecrã principal</strong>.</p>
                <p>Em alguns navegadores, a instalação só fica disponível depois de abrir o site directamente e actualizar a página.</p>
              </div>
            )}
            <button type="button" onClick={() => setShowHelp(false)} className="mt-6 min-h-11 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Entendi</button>
          </section>
        </div>
      )}
    </>
  );
}
