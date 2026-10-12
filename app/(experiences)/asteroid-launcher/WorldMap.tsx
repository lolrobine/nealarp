"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { getAssetUrl } from "@/lib/utils/assets";
import type { ImpactResult } from "./data";

export type MapImpact = {
  id: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  result: ImpactResult;
  diameter: number;
  velocity: number;
  color: string;
  timestamp: number;
};

interface Props {
  impacts: MapImpact[];
  onMapClick: (lat: number, lng: number, xPct: number, yPct: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function pctToLatLng(xPct: number, yPct: number) {
  const lng = (xPct / 100) * 360 - 180;
  const lat = 90 - (yPct / 100) * 180;
  return { lat, lng };
}

type Explosion = {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

export function WorldMap({ impacts, onMapClick, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
  } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const shakeControls = useAnimationControls();

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 6;

  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        // Zoom towards mouse position
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;
        const zoomRatio = clamped / zoom;
        const newPanX = mouseX - zoomRatio * (mouseX - pan.x);
        const newPanY = mouseY - zoomRatio * (mouseY - pan.y);
        setPan({ x: newPanX, y: newPanY });
      }
      setZoom(clamped);
      if (clamped === 1) setPan({ x: 0, y: 0 });
    },
    [zoom, pan]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return; // Allow browser zoom with ctrl
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.1 : 0.9;
      handleZoom(zoom * zoomFactor, e.clientX, e.clientY);
    },
    [zoom, handleZoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom === 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    },
    [zoom, pan]
  );

  const handleMouseMoveContainer = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoom > 1) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setPan({ x: dragStart.panX + dx, y: dragStart.panY + dy });
      }
      // Hover pos for crosshair (account for zoom/pan)
      if (!containerRef.current || !mapContentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Transform mouse to map content coordinates (0-100%)
      const xInContainer = e.clientX - rect.left;
      const yInContainer = e.clientY - rect.top;
      const xInContent = (xInContainer - pan.x) / zoom;
      const yInContent = (yInContainer - pan.y) / zoom;
      const xPct = (xInContent / rect.width) * 100;
      const yPct = (yInContent / rect.height) * 100;
      if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) {
        const { lat, lng } = pctToLatLng(xPct, yPct);
        setHoverPos({ x: xPct, y: yPct, lat, lng });
      }
    },
    [isDragging, dragStart, pan, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      if (!containerRef.current || !mapContentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xInContainer = e.clientX - rect.left;
      const yInContainer = e.clientY - rect.top;
      const xInContent = (xInContainer - pan.x) / zoom;
      const yInContent = (yInContainer - pan.y) / zoom;
      const xPct = (xInContent / rect.width) * 100;
      const yPct = (yInContent / rect.height) * 100;
      if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
      const { lat, lng } = pctToLatLng(xPct, yPct);

      // Shake + explosion
      shakeControls.start({
        x: [0, -12, 12, -10, 10, -6, 6, 0],
        y: [0, 4, -4, 2, -2, 0],
        transition: { duration: 0.6, ease: "easeOut" },
      });

      const explosionId = Math.random().toString(36).slice(2);
      const color = getImpactColor(impacts.length);
      // Size based on current asteroid config (will be updated by parent, but we estimate)
      setExplosions((prev) => [...prev, { id: explosionId, x: xPct, y: yPct, color, size: 1 }]);
      setTimeout(() => {
        setExplosions((prev) => prev.filter((ex) => ex.id !== explosionId));
      }, 1200);

      // Haptic
      try {
        navigator.vibrate?.([50, 30, 80]);
      } catch {}

      onMapClick(lat, lng, xPct, yPct);
    },
    [onMapClick, impacts.length, isDragging, pan, zoom, shakeControls]
  );

  const getImpactSize = (result: ImpactResult, type: "crater" | "blast") => {
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    const degrees = km / 111;
    const pct = (degrees / 360) * 100;
    const minSize = type === "crater" ? 0.6 : 1.2;
    return Math.max(minSize, Math.min(pct * 2, type === "crater" ? 3 : 15));
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      {/* Header with zoom controls */}
      <div className="px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">🌍 World Map</span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
            Click to fire • Scroll to zoom
          </span>
          {zoom > 1 && (
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
              {zoom.toFixed(1)}x • Drag to pan
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-full border bg-[var(--secondary)] overflow-hidden">
            <button
              onClick={() => handleZoom(zoom * 0.8)}
              disabled={zoom <= MIN_ZOOM}
              className="px-2.5 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-30"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="px-2 py-1 text-[10px] font-mono border-x bg-[var(--card)] min-w-[40px] text-center">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={() => handleZoom(zoom * 1.25)}
              disabled={zoom >= MAX_ZOOM}
              className="px-2.5 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-30"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          {zoom > 1 && (
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)] hover:bg-[var(--muted)]"
            >
              Reset
            </button>
          )}
          <span className="text-[10px] text-[var(--muted-foreground)] ml-1">
            {impacts.length} impacts
          </span>
        </div>
      </div>

      {/* Map container with shake */}
      <motion.div
        ref={containerRef}
        animate={shakeControls}
        className={`relative w-full aspect-[2/1] bg-[#0a1628] overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveContainer}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setIsHovering(false);
          setHoverPos(null);
        }}
        onMouseEnter={() => setIsHovering(true)}
        role="application"
        aria-label="World map - click to launch, scroll to zoom, drag to pan"
      >
        {/* Zoomable content */}
        <div
          ref={mapContentRef}
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* High-res world map for crisp zoom */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetUrl("/experiences/asteroid-launcher/world-map-4k.jpg")}
            alt="World map high resolution"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
            style={{ imageRendering: "auto" as const }}
          />
          {/* Fallback low-res for fast load (hidden when high-res loaded, but we just use high-res) */}
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />

          {/* Grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <line
              x1="50%"
              y1="0"
              x2="50%"
              y2="100%"
              stroke="white"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
            <line
              x1="0"
              y1="38%"
              x2="100%"
              y2="38%"
              stroke="white"
              strokeWidth="0.3"
              opacity="0.5"
            />
            <line
              x1="0"
              y1="62%"
              x2="100%"
              y2="62%"
              stroke="white"
              strokeWidth="0.3"
              opacity="0.5"
            />
          </svg>

          {/* Impacts - no delete X button, only via tab below */}
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
                  {impacts.length <= 12 ? idx + 1 : ""}
                </div>

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

          {/* Explosions */}
          {explosions.map((ex) => (
            <div
              key={ex.id}
              className="absolute pointer-events-none z-50"
              style={{ left: `${ex.x}%`, top: `${ex.y}%`, transform: "translate(-50%, -50%)" }}
            >
              {/* Flash */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 3, 6], opacity: [1, 0.8, 0] }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ left: "50%", top: "50%" }}
              />
              {/* Fireball */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 2.2], opacity: [1, 0.9, 0] }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
                className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
                style={{
                  left: "50%",
                  top: "50%",
                  background: `radial-gradient(circle, #fff 0%, ${ex.color} 30%, #ff6600 60%, transparent 80%)`,
                }}
              />
              {/* Shockwave */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: [0, 4, 8], opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                style={{
                  left: "50%",
                  top: "50%",
                  borderColor: ex.color,
                  boxShadow: `0 0 20px ${ex.color}`,
                }}
              />
              <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={{ scale: [0, 6, 12], opacity: [0.6, 0.2, 0] }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                style={{ left: "50%", top: "50%", borderColor: `${ex.color}80` }}
              />
              {/* Debris particles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2) * (30 + Math.random() * 40),
                    y: Math.sin((i / 8) * Math.PI * 2) * (30 + Math.random() * 40),
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 + i * 0.02 }}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    left: "50%",
                    top: "50%",
                    backgroundColor: i % 2 === 0 ? "#ff6600" : ex.color,
                  }}
                />
              ))}
              {/* Smoke */}
              <motion.div
                initial={{ scale: 0, opacity: 0.5, y: 0 }}
                animate={{ scale: [0, 2, 3], opacity: [0.5, 0.3, 0], y: [0, -10, -20] }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                className="absolute w-16 h-16 -translate-x-1/2 rounded-full blur-xl"
                style={{ left: "50%", top: "50%", backgroundColor: "rgba(100,100,100,0.5)" }}
              />
            </div>
          ))}

          {/* Hover crosshair */}
          {isHovering && hoverPos && !isDragging && (
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
        </div>

        {/* Click overlay for map (handles click, but content is transformed) */}
        <div className="absolute inset-0 z-10" onClick={handleClick} aria-hidden />

        {/* Instructions */}
        {impacts.length === 0 && !isHovering && zoom === 1 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl mb-2">☄️</div>
              <div className="text-white font-bold text-sm">Click anywhere to launch</div>
              <div className="text-white/60 text-xs mt-1">
                Scroll to zoom • Drag to pan • Crisp 4K quality
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Legend */}
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
        <span className="ml-auto">
          4K map • Zoom {zoom.toFixed(1)}x • 1°≈111km • No map delete button (use list below)
        </span>
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
