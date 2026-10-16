"use client";

import { useEffect } from "react";
import { clearPreviewCaches } from "@/lib/utils/pwa";

export function PWARegister() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    if (process.env.NODE_ENV !== "production") {
      // An old production worker can survive a dev restart and serve yesterday's catalogue.
      // Unregister it, clean only our caches, then reload controlled clients once.
      let mounted = true;
      clearPreviewCaches(base)
        .then((controlled) => {
          if (controlled && mounted) window.location.reload();
        })
        .catch(() => {
          /* Cache/storage may be unavailable; online browsing still works. */
        });
      return () => {
        mounted = false;
      };
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${base}/sw.js`, { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => {
          /* Offline registration/update is optional. */
        });
    }
  }, []);
  return null;
}
