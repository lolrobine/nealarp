"use client";
import { useEffect, useState, type ReactNode } from "react";

/** Each impact owns its lifetime; old impacts must not replay after changing maps. */
export function ImpactBurst({
  timestamp,
  magnitude,
  children,
}: {
  timestamp: number;
  magnitude: number;
  children: ReactNode;
}) {
  const lifetime = 1000 + magnitude * 80;
  const [visible, setVisible] = useState(() => timestamp + lifetime > Date.now());
  useEffect(() => {
    const timer = setTimeout(
      () => setVisible(false),
      Math.max(0, timestamp + lifetime - Date.now())
    );
    return () => clearTimeout(timer);
  }, [timestamp, lifetime]);
  return visible ? children : null;
}
