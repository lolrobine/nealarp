"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const swUrl = `${base}/sw.js`;
      navigator.serviceWorker.register(swUrl).catch(() => {
        // ignore
      });
    }
  }, []);
  return null;
}
