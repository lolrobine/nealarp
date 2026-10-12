"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRecentlyPlayedStore } from "@/lib/store/recentlyPlayed";

export function RecentlyPlayedTracker() {
  const pathname = usePathname();
  const markPlayed = useRecentlyPlayedStore((s) => s.markPlayed);

  useEffect(() => {
    if (!pathname) return;
    // pathname is like /spend-money, /deep-sea, etc
    const id = pathname.replace(/^\//, "").split("/")[0];
    if (id && id.length > 0 && id !== "_not-found") {
      markPlayed(id);
    }
  }, [pathname, markPlayed]);

  return null;
}
