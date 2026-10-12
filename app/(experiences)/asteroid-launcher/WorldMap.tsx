"use client";

import { useRef, useState, useCallback } from "react";
import { getAssetUrl } from "@/lib/utils/assets";
import type { ImpactResult } from "./data";

export type MapImpact = {
  id: string;
  lat: number;
  lng: number;
  x: number; // 0-100%
  y: number; // 0-100%
  result: ImpactResult;
  diameter: number;
  velocity: number;
  color: string;
  timestamp: number;
};

interface Props {
  impacts: MapImpact[];
  onMapClick: (lat: number, lng: number, xPct: number, yPct: number) => void;
  onRemoveImpact: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function pctToLatLng(xPct: number, yPct: number) {
  const lng = (xPct / 100) * 360 - 180;
  const lat = 90 - (yPct / 100) * 180;
  return { lat, lng };
}

export function WorldMap({ impacts, onMapClick, onRemoveImpact, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [firingAnim, setFiringAnim] = useState<{ x: number; y: number; id: string } | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      const { lat, lng } = pctToLatLng(xPct, yPct);

      // Trigger firing animation
      const animId = Math.random().toString(36).slice(2);
      setFiringAnim({ x: xPct, y: yPct, id: animId });
      setTimeout(() => setFiringAnim(null), 800);

      onMapClick(lat, lng, xPct, yPct);
    },
    [onMapClick]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const { lat, lng } = pctToLatLng(xPct, yPct);
    setHoverPos({ x: xPct, y: yPct, lat, lng });
  }, []);

  // Calculate pixel radius for impact visualization (scale with zoom level of map)
  const getImpactSize = (result: ImpactResult, type: "crater" | "blast") => {
    // For world map, we need to scale blast radius to map size
    // Earth circumference ~40075km, map width ~360 degrees
    // Rough: 1 degree ~111km at equator
    // So blastWaveDistance km / 111 = degrees, then /360 *100 = % of map width
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    const degrees = km / 111;
    const pct = (degrees / 360) * 100;
    // Minimum visible size
    const minSize = type === "crater" ? 0.6 : 1.2;
    return Math.max(minSize, Math.min(pct * 2, type === "crater" ? 3 : 15));
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      {/* Header */}
      <div className="px-4 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">🌍 Real World Map</span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
            Click to fire
          </span>
        </div>
        <div className="text-[10px] text-[var(--muted-foreground)]">
          {impacts.length} impact{impacts.length !== 1 ? "s" : ""} • Equirectangular
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[2/1] bg-[#0a1628] cursor-crosshair overflow-hidden select-none"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoverPos(null);
        }}
        role="application"
        aria-label="World map - click to launch asteroid"
      >
        {/* World map image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("/experiences/asteroid-launcher/world-map.jpg")}
          alt="World map"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Ocean overlay for realism */}
        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {/* Equator */}
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {/* Prime meridian */}
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
            stroke="white"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          {/* Tropics */}
          <line x1="0" y1="38%" x2="100%" y2="38%" stroke="white" strokeWidth="0.3" opacity="0.5" />
          <line x1="0" y1="62%" x2="100%" y2="62%" stroke="white" strokeWidth="0.3" opacity="0.5" />
        </svg>

        {/* Impacts */}
        {impacts.map((impact, idx) => {
          const isSelected = selectedId === impact.id;
          const blastSize = getImpactSize(impact.result, "blast");
          const craterSize = getImpactSize(impact.result, "crater");
          return (
            <div
              key={impact.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${impact.x}%`,
                top: `${impact.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isSelected ? 20 : 10 + idx,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(isSelected ? null : impact.id);
              }}
            >
              {/* Blast wave */}
              <div
                className="absolute rounded-full pointer-events-none animate-pulse"
                style={{
                  width: `${blastSize * 2}em`,
                  height: `${blastSize * 2}em`,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${impact.color}40 0%, ${impact.color}15 40%, transparent 70%)`,
                  border: `1px solid ${impact.color}60`,
                  boxShadow: `0 0 20px ${impact.color}40`,
                }}
              />
              {/* Thermal */}
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${blastSize * 1.2}em`,
                  height: `${blastSize * 1.2}em`,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, ${impact.color}60 0%, ${impact.color}20 60%, transparent 80%)`,
                }}
              />
              {/* Crater */}
              <div
                className={`relative rounded-full border-2 flex items-center justify-center font-bold text-[10px] text-white shadow-lg cursor-pointer transition-all hover:scale-110 ${
                  isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-125" : ""
                }`}
                style={{
                  width: `${Math.max(1.2, craterSize)}em`,
                  height: `${Math.max(1.2, craterSize)}em`,
                  backgroundColor: "#000",
                  borderColor: impact.color,
                  boxShadow: `0 0 10px ${impact.color}, inset 0 0 6px ${impact.color}80`,
                }}
                title={`${impact.result.equivalentTNT} at ${impact.lat.toFixed(1)}, ${impact.lng.toFixed(1)}`}
              >
                {impacts.length <= 8 ? idx + 1 : ""}
                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImpact(impact.id);
                    }}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center hover:bg-red-600"
                    aria-label="Remove impact"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Label when selected */}
              {isSelected && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none z-30 border border-white/20">
                  <div className="font-bold">{impact.result.equivalentTNT}</div>
                  <div className="text-white/70">
                    {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}° • {impact.diameter}m
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Firing animation */}
        {firingAnim && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `${firingAnim.x}%`,
              top: `${firingAnim.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              {/* Asteroid streak from top */}
              <div
                className="absolute w-1 h-20 bg-gradient-to-b from-transparent via-orange-400 to-red-500 -top-20 left-1/2 -translate-x-1/2 animate-[fall_0.8s_ease-in]"
                style={{
                  boxShadow: "0 0 10px #ff6600",
                }}
              />
              {/* Impact flash */}
              <div className="w-8 h-8 bg-white rounded-full animate-ping absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="w-12 h-12 bg-orange-400 rounded-full blur-md animate-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <style>{`
              @keyframes fall {
                0% { transform: translate(-50%, -200px); opacity: 0; }
                20% { opacity: 1; }
                100% { transform: translate(-50%, 0); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {/* Hover crosshair */}
        {isHovering && hoverPos && (
          <>
            <div
              className="absolute w-6 h-6 pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${hoverPos.x}%`, top: `${hoverPos.y}%` }}
            >
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
              <div className="absolute inset-0 border border-white/40 rounded-full" />
            </div>
            <div
              className="absolute bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none z-30 whitespace-nowrap"
              style={{
                left: `${Math.min(85, hoverPos.x + 2)}%`,
                top: `${Math.max(5, hoverPos.y - 8)}%`,
              }}
            >
              {hoverPos.lat.toFixed(1)}°, {hoverPos.lng.toFixed(1)}° • Click to fire
            </div>
          </>
        )}

        {/* Instructions overlay when no impacts */}
        {impacts.length === 0 && !isHovering && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl mb-2">☄️</div>
              <div className="text-white font-bold text-sm">Click anywhere to launch</div>
              <div className="text-white/60 text-xs mt-1">
                Fire multiple asteroids • Real world map
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map legend */}
      <div className="px-3 py-2 bg-[var(--card)] border-t border-[var(--border)] flex flex-wrap gap-3 text-[10px] text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-black border border-red-500 inline-block" />{" "}
          Crater
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-orange-500/30 border border-orange-500/60 inline-block" />{" "}
          Fireball
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40 border-dashed inline-block" />{" "}
          Blast
        </span>
        <span className="ml-auto">Equirectangular projection • 1° ≈ 111km</span>
      </div>
    </div>
  );
}

export function getImpactColor(index: number) {
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#8b5cf6",
    "#ec4899",
    "#f43f5e",
  ];
  return colors[index % colors.length]!;
}
