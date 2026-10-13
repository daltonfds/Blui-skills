"use client";

import { useEffect } from "react";

export function PWAProvider() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // PWA installation remains available even if offline support cannot register.
    });
  }, []);

  return null;
}
