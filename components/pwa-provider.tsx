"use client";

import { useEffect } from "react";
import { PWAInstallButton } from "@/components/pwa-install-button";

export function PWAProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Installation can still work if offline caching is unavailable.
    });
  }, []);

  return <PWAInstallButton showButton={false} enablePromo />;
}
