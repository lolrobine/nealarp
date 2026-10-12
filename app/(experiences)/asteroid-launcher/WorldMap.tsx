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

export type ShakeEvent = { id: string; magnitude: number; energy: number } | null;

interface Props {
  impacts: MapImpact[];
  onMapClick: (lat: number, lng: number) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  shakeEvent: ShakeEvent;
}

function pctToLatLng(xPct: number, yPct: number) {
  const lng = (xPct / 100) * 360 - 180;
  const lat = 90 - (yPct / 100) * 180;
  return { lat, lng };
}

type Explosion = { id: string; x: number; y: number; color: string; magnitude: number };

function getVibratePattern(magnitude: number): number[] {
  // Faster vibration for bigger asteroids: gap decreases as magnitude increases
  if (magnitude < 2) return [25];
  if (magnitude < 3) return [35, 18, 45];
  if (magnitude < 4) return [45, 12, 65, 12, 85];
  if (magnitude < 5) return [55, 8, 75, 8, 95, 8, 110];
  if (magnitude < 6) return [65, 6, 85, 6, 105, 6, 125, 6, 145];
  if (magnitude < 7) return [75, 5, 95, 5, 115, 5, 135, 5, 155, 5, 175];
  if (magnitude < 8) return [85, 4, 105, 4, 125, 4, 145, 4, 165, 4, 185, 4, 205];
  if (magnitude < 9) return [95, 3, 115, 3, 135, 3, 155, 3, 175, 3, 195, 3, 215, 3, 235];
  return [110, 2, 130, 2, 150, 2, 170, 2, 190, 2, 210, 2, 230, 2, 250, 2, 270];
}

function generateShakePattern(intensity: number, magnitude: number) {
  const oscillations = Math.round(3 + magnitude * 1.8); // M2=>6, M10=>21 - more oscillations = faster for bigger
  const x: number[] = [0];
  const y: number[] = [0];
  for (let i = 0; i < oscillations; i++) {
    const decay = 1 - (i / oscillations) * 0.5;
    const sign = i % 2 === 0 ? -1 : 1;
    x.push(sign * intensity * decay);
    y.push(sign * intensity * 0.35 * decay * (i % 3 === 0 ? 1 : -0.7));
  }
  x.push(0);
  y.push(0);
  return { x, y, oscillations };
}

export function WorldMap({ impacts, onMapClick, selectedIds, onSelect, shakeEvent }: Props) {
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

  useEffect(() => {
    if (!shakeEvent) return;
    const magnitude = shakeEvent.magnitude;
    const intensity = Math.min(50, Math.max(2, magnitude * 4));
    const duration = Math.min(1.2, Math.max(0.25, 0.3 + magnitude * 0.05)); // bigger = slightly longer but much more oscillations = faster
    const { x, y } = generateShakePattern(intensity, magnitude);

    shakeControls.start({ x, y, transition: { duration, ease: "easeOut" } });

    const latest = impacts.find((i) => i.id === shakeEvent.id);
    if (latest) {
      setExplosions((prev) => [
        ...prev,
        { id: latest.id, x: latest.x, y: latest.y, color: latest.color, magnitude },
      ]);
      setTimeout(
        () => setExplosions((prev) => prev.filter((ex) => ex.id !== latest.id)),
        1200 + magnitude * 120
      );
    }

    try {
      const pattern = getVibratePattern(magnitude);
      navigator.vibrate?.(pattern);
    } catch {}
  }, [shakeEvent, impacts, shakeControls]);

  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;
        const zoomRatio = clamped / zoom;
        setPan({
          x: mouseX - zoomRatio * (mouseX - pan.x),
          y: mouseY - zoomRatio * (mouseY - pan.y),
        });
      }
      setZoom(clamped);
      if (clamped === 1) setPan({ x: 0, y: 0 });
    },
    [zoom, pan]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      handleZoom(zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX, e.clientY);
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
        setPan({
          x: dragStart.panX + (e.clientX - dragStart.x),
          y: dragStart.panY + (e.clientY - dragStart.y),
        });
      }
      if (!containerRef.current || !mapContentRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xInContainer = e.clientX - rect.left;
      const yInContainer = e.clientY - rect.top;
      const xPct = ((xInContainer - pan.x) / zoom / rect.width) * 100;
      const yPct = ((yInContainer - pan.y) / zoom / rect.height) * 100;
      if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) {
        const { lat, lng } = pctToLatLng(xPct, yPct);
        setHoverPos({ x: xPct, y: yPct, lat, lng });
      }
    },
    [isDragging, dragStart, pan, zoom]
  );

  const getImpactSize = (result: ImpactResult, type: "crater" | "blast") => {
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    const pct = (km / 111 / 360) * 100;
    return Math.max(type === "crater" ? 0.6 : 1.2, Math.min(pct * 2, type === "crater" ? 3 : 15));
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">🌍 World Map</span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
            Click to fire • Multi-select enabled
          </span>
          {zoom > 1 && (
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
              {zoom.toFixed(1)}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-full border bg-[var(--secondary)] overflow-hidden">
            <button
              onClick={() => handleZoom(zoom * 0.8)}
              disabled={zoom <= MIN_ZOOM}
              className="px-2.5 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-30"
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
            {impacts.length} impacts • {selectedIds.length} selected
          </span>
        </div>
      </div>

      <motion.div
        ref={containerRef}
        animate={shakeControls}
        className={`relative w-full aspect-[2/1] bg-[#0a1628] overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveContainer}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false);
          setIsHovering(false);
          setHoverPos(null);
        }}
        onMouseEnter={() => setIsHovering(true)}
      >
        <div
          ref={mapContentRef}
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getAssetUrl("/experiences/asteroid-launcher/world-map-4k.jpg")}
            alt="World map 4K"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-blue-900/10 pointer-events-none" />
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
          </svg>

          {impacts.map((impact, idx) => {
            const isSelected = selectedIds.includes(impact.id);
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
                  zIndex: isSelected ? 30 : 10 + idx,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(impact.id);
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
                  }}
                />
                <div
                  className={`relative rounded-full border-2 flex items-center justify-center font-bold text-[10px] text-white shadow-lg cursor-pointer transition-all hover:scale-110 ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-125" : ""}`}
                  style={{
                    width: `${Math.max(1.2, craterSize)}em`,
                    height: `${Math.max(1.2, craterSize)}em`,
                    backgroundColor: "#000",
                    borderColor: impact.color,
                    boxShadow: `0 0 10px ${impact.color}`,
                  }}
                >
                  {impacts.length <= 20 ? idx + 1 : ""}
                </div>
                {isSelected && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 border border-white/20">
                    <div className="font-bold">{impact.result.equivalentTNT}</div>
                    <div className="text-white/70">
                      {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}° • M
                      {impact.result.earthquakeMagnitude.toFixed(1)} • {impact.diameter}m
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {explosions.map((ex) => {
            const scale = Math.min(3.5, Math.max(0.5, ex.magnitude / 3));
            return (
              <div
                key={ex.id}
                className="absolute pointer-events-none z-50"
                style={{ left: `${ex.x}%`, top: `${ex.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 3 * scale, 6 * scale], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 0.35 }}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                  style={{ left: "50%", top: "50%" }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.5 * scale, 2.2 * scale], opacity: [1, 0.9, 0] }}
                  transition={{ duration: 0.5, delay: 0.05 }}
                  className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
                  style={{
                    left: "50%",
                    top: "50%",
                    background: `radial-gradient(circle, #fff 0%, ${ex.color} 30%, #ff6600 60%, transparent 80%)`,
                  }}
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: [0, 4 * scale, 8 * scale], opacity: [0.8, 0.4, 0] }}
                  transition={{ duration: 0.6 }}
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ left: "50%", top: "50%", borderColor: ex.color }}
                />
                {Array.from({ length: Math.round(8 + ex.magnitude) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * (20 + ex.magnitude * 6),
                      y: Math.sin((i / 8) * Math.PI * 2) * (20 + ex.magnitude * 6),
                      opacity: 0,
                    }}
                    transition={{ duration: 0.6, delay: 0.05 }}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{
                      left: "50%",
                      top: "50%",
                      backgroundColor: i % 2 === 0 ? "#ff6600" : ex.color,
                    }}
                  />
                ))}
              </div>
            );
          })}

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
        <div
          className="absolute inset-0 z-10"
          onClick={(e) => {
            if (isDragging) return;
            const rect = containerRef.current!.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left - pan.x) / zoom / rect.width) * 100;
            const yPct = ((e.clientY - rect.top - pan.y) / zoom / rect.height) * 100;
            if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
            const { lat, lng } = pctToLatLng(xPct, yPct);
            onMapClick(lat, lng);
          }}
          aria-hidden
        />
        {impacts.length === 0 && !isHovering && zoom === 1 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl mb-2">☄️</div>
              <div className="text-white font-bold text-sm">Click anywhere to launch</div>
              <div className="text-white/60 text-xs mt-1">
                Multi-select: click craters • Faster shake for bigger asteroids
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="px-3 py-2 bg-[var(--card)] border-t border-[var(--border)] flex flex-wrap gap-3 text-[10px] text-[var(--muted-foreground)]">
        <span>
          4K map • {zoom.toFixed(1)}x • Multi-select enabled • Shake faster when bigger (M×4px,{" "}
          {selectedIds.length} selected)
        </span>
        <span className="ml-auto">
          No X on map — use list below • Vibration gap ↓ as magnitude ↑
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
