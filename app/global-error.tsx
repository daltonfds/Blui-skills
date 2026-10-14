"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  async function recover() {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("bluiskill-shell-")).map((key) => caches.delete(key)));
      }
    } catch {
      // Reload even if browser cache APIs are unavailable.
    }
    window.location.href = "/";
  }

  return (
    <html lang="pt">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#fff", color: "#09090b" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", boxSizing: "border-box" }}>
          <section style={{ width: "100%", maxWidth: "420px", border: "1px solid #e4e4e7", borderRadius: "16px", padding: "24px", boxSizing: "border-box" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.16em", color: "#71717a" }}>BLUISKILL</p>
            <h1 style={{ fontSize: "24px", lineHeight: 1.2 }}>A aplicação precisa de ser recarregada</h1>
            <p style={{ color: "#52525b", fontSize: "14px", lineHeight: 1.6 }}>O navegador encontrou um erro ao abrir a aplicação. Actualiza a versão guardada e tenta novamente.</p>
            <button onClick={reset} style={{ width: "100%", minHeight: "44px", marginTop: "12px", border: 0, borderRadius: "8px", background: "#000", color: "#fff", fontWeight: 600 }}>Tentar novamente</button>
            <button onClick={recover} style={{ width: "100%", minHeight: "44px", marginTop: "8px", border: "1px solid #d4d4d8", borderRadius: "8px", background: "#fff", color: "#09090b", fontWeight: 600 }}>Limpar cache e abrir BluiSkill</button>
          </section>
        </main>
      </body>
    </html>
  );
}
