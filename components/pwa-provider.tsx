"use client";

import { useEffect } from "react";
import { PWAInstallButton } from "@/components/pwa-install-button";

export function PWAProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // PWA installation remains available if offline caching cannot register.
    });
  }, []);

  return <PWAInstallButton showButton={false} enablePromo />;
}
