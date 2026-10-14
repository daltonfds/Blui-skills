"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Share, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const PROMO_DISMISSED_KEY = "bluiskill-install-promo-dismissed";
const PROMO_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export function PWAInstallButton({ compact = false, showButton = true, enablePromo = true }: { compact?: boolean; showButton?: boolean; enablePromo?: boolean }) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [android, setAndroid] = useState(false);
  const promoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(ua);
    const isIOS = /iphone|ipad|ipod/.test(ua) && !("MSStream" in window);
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setAndroid(isAndroid);
    setIos(isIOS);
    setInstalled(isInstalled);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
      setShowPromo(false);
      if (promoCloseTimer.current) clearTimeout(promoCloseTimer.current);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Show a small, temporary Android install recommendation, not a blocking modal.
    if (enablePromo && isAndroid && !isInstalled) {
      const lastDismissed = Number(window.localStorage.getItem(PROMO_DISMISSED_KEY) || 0);
      if (!lastDismissed || Date.now() - lastDismissed > PROMO_COOLDOWN_MS) {
        promoTimer.current = setTimeout(() => {
          setShowPromo(true);
          promoCloseTimer.current = setTimeout(() => setShowPromo(false), 12000);
        }, 4500);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (promoTimer.current) clearTimeout(promoTimer.current);
      if (promoCloseTimer.current) clearTimeout(promoCloseTimer.current);
    };
  }, [enablePromo]);

  async function install() {
    if (installed) return;
    setShowPromo(false);
    if (promoCloseTimer.current) clearTimeout(promoCloseTimer.current);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
      } finally {
        setPromptEvent(null);
      }
      return;
    }
    setShowHelp(true);
  }

  function dismissPromo() {
    setShowPromo(false);
    window.localStorage.setItem(PROMO_DISMISSED_KEY, String(Date.now()));
    if (promoCloseTimer.current) clearTimeout(promoCloseTimer.current);
  }

  const label = installed ? "Instalada" : compact ? "Instalar" : "Instalar aplicação";

  return (
    <>
      {showButton && <button type="button" onClick={install} disabled={installed} aria-label={label}
        className={"inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm " + (installed ? "border-zinc-200 bg-zinc-50 text-zinc-500" : "border-black bg-black text-white hover:bg-zinc-800")}>
        {installed ? <Check size={15} /> : <Download size={15} />}
        <span>{label}</span>
      </button>}

      {showPromo && android && !installed && (
        <aside aria-label="Instalar BluiSkill" className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[110] mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl sm:inset-x-auto sm:bottom-5 sm:right-5 sm:mx-0">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-black text-sm font-bold text-white">B</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-950">Instala a BluiSkill no teu Android</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">Acede mais rapidamente pelo ecrã inicial, como uma aplicação.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={install} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"><Download size={14} /> Instalar agora</button>
                <button type="button" onClick={dismissPromo} className="min-h-10 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100">Agora não</button>
              </div>
            </div>
            <button type="button" onClick={dismissPromo} aria-label="Fechar recomendação" className="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"><X size={16} /></button>
          </div>
        </aside>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-5" onClick={() => setShowHelp(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">BluiSkill</p>
                <h2 id="pwa-install-title" className="mt-2 text-lg font-semibold text-zinc-950">Instalar a aplicação</h2>
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
                <p>{android ? "No Android, abre o menu do navegador e escolhe “Instalar aplicação” ou “Adicionar ao ecrã principal”. A opção de instalação automática aparece quando o navegador a disponibiliza." : "Abre o menu do navegador e procura “Instalar aplicação” ou “Adicionar ao ecrã principal”."}</p>
                <p>A BluiSkill é instalada directamente pelo navegador. Não precisas de descarregar um APK separado.</p>
              </div>
            )}
            <button type="button" onClick={() => setShowHelp(false)} className="mt-6 min-h-11 w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800">Entendi</button>
          </section>
        </div>
      )}
    </>
  );
}
