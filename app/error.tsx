"use client";

import { useEffect } from "react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("BluiSkill route error");
  }, []);

  async function recover() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update().catch(() => undefined)));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("bluiskill-shell-")).map((key) => caches.delete(key)));
      }
    } catch {
      // Recovery should continue even if browser cache APIs are restricted.
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-5 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">BluiSkill</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Não foi possível abrir esta página</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">A aplicação encontrou um erro no navegador. Tenta novamente ou limpa a cache da aplicação para carregar a versão mais recente.</p>
        <div className="mt-6 grid gap-3">
          <button onClick={reset} className="min-h-11 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white">Tentar novamente</button>
          <button onClick={recover} className="min-h-11 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-900">Actualizar aplicação e recarregar</button>
        </div>
      </section>
    </main>
  );
}
