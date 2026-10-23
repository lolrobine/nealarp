"use client";

import { Picto } from "@/lib/components/games/Picto";
import { useRef, useState, useCallback, useEffect } from "react";
import { ImpactBurst } from "./ImpactBurst";
import { motion, useAnimationControls } from "framer-motion";
import { getAssetUrl } from "@/lib/utils/assets";
import type { ImpactResult } from "./data";
import { clampPct, describeLatLng } from "./countryMaps";

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
  return { lng: (xPct / 100) * 360 - 180, lat: 90 - (yPct / 100) * 180 };
}

/** Spoken form of a crosshair position, for the button label and the live region. */
function describeAim({ xPct, yPct }: { xPct: number; yPct: number }): string {
  const { lat, lng } = pctToLatLng(xPct, yPct);
  return describeLatLng(lat, lng);
}

function getVibratePattern(magnitude: number): number[] {
  // Faster vibration when bigger: gap shrinks to 1ms for huge asteroids
  if (magnitude < 2) return [30];
  if (magnitude < 3) return [40, 15, 50];
  if (magnitude < 4) return [50, 8, 70, 8, 90];
  if (magnitude < 5) return [60, 4, 80, 4, 100, 4, 120];
  if (magnitude < 6) return [70, 3, 90, 3, 110, 3, 130, 3, 150];
  if (magnitude < 7) return [80, 2, 100, 2, 120, 2, 140, 2, 160, 2, 180];
  if (magnitude < 8) return [90, 1, 110, 1, 130, 1, 150, 1, 170, 1, 190, 1, 210];
  return [100, 1, 120, 1, 140, 1, 160, 1, 180, 1, 200, 1, 220, 1, 240, 1, 260];
}

function generateShakePattern(intensity: number, magnitude: number) {
  // More oscillations and shorter duration = faster when bigger
  const oscillations = Math.round(4 + magnitude * 2.5); // M2=9, M10=29
  const x: number[] = [0];
  const y: number[] = [0];
  for (let i = 0; i < oscillations; i++) {
    const decay = 1 - (i / oscillations) * 0.45;
    const sign = i % 2 === 0 ? -1 : 1;
    x.push(sign * intensity * decay);
    y.push(sign * intensity * 0.32 * decay * (i % 2 === 0 ? 1 : -0.8));
  }
  x.push(0);
  y.push(0);
  return { x, y };
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  /** Where the keyboard is aiming. Starts at the centre of the map. */
  const [aim, setAim] = useState({ xPct: 50, yPct: 50 });
  const [aiming, setAiming] = useState(false);

  const shakeControls = useAnimationControls();

  const explosions = impacts.map((impact) => ({
    ...impact,
    magnitude: impact.result.earthquakeMagnitude,
  }));

  useEffect(() => {
    if (!shakeEvent) return;
    const magnitude = shakeEvent.magnitude;
    const intensity = Math.min(55, Math.max(3, magnitude * 4.5));
    const duration = Math.min(1, Math.max(0.2, 0.25 + magnitude * 0.04)); // faster when bigger: more shakes in less time increase
    const { x, y } = generateShakePattern(intensity, magnitude);
    shakeControls.start({ x, y, transition: { duration, ease: "easeOut" } });

    try {
      navigator.vibrate?.(getVibratePattern(magnitude));
    } catch {}
  }, [shakeEvent, impacts, shakeControls]);

  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clamped = Math.min(6, Math.max(1, newZoom));
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mx = centerX - rect.left;
        const my = centerY - rect.top;
        const ratio = clamped / zoom;
        setPan({ x: mx - ratio * (mx - pan.x), y: my - ratio * (my - pan.y) });
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

  const getImpactSize = (result: ImpactResult, type: "crater" | "blast") => {
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    const pct = (km / 111 / 360) * 100;
    return Math.max(type === "crater" ? 0.6 : 1.2, Math.min(pct * 2, type === "crater" ? 3 : 15));
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <Picto name="globe" size={14} /> World
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
            {impacts.length} impacts
          </span>
          {selectedIds.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
              {selectedIds.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-full border bg-[var(--secondary)] overflow-hidden">
            <button
              onClick={() => handleZoom(zoom * 0.8)}
              disabled={zoom <= 1}
              className="px-2.5 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-30"
            >
              −
            </button>
            <span className="px-2 py-1 text-[10px] font-mono border-x bg-[var(--card)] min-w-[36px] text-center">
              {zoom.toFixed(1)}x
            </span>
            <button
              onClick={() => handleZoom(zoom * 1.25)}
              disabled={zoom >= 6}
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
              className="min-h-6 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <motion.div
        ref={containerRef}
        animate={shakeControls}
        className={`relative w-full aspect-[2/1] bg-[#0a1628] overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"}`}
        onMouseDown={(e) => {
          if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
          }
        }}
        onMouseMove={(e) => {
          if (isDragging && zoom > 1)
            setPan({
              x: dragStart.panX + (e.clientX - dragStart.x),
              y: dragStart.panY + (e.clientY - dragStart.y),
            });
          if (!containerRef.current || !mapContentRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const xPct = ((e.clientX - rect.left - pan.x) / zoom / rect.width) * 100;
          const yPct = ((e.clientY - rect.top - pan.y) / zoom / rect.height) * 100;
          if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100)
            setHoverPos({ x: xPct, y: yPct, ...pctToLatLng(xPct, yPct) });
        }}
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
            alt="World map"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
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
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: `${blastSize * 2}em`,
                    height: `${blastSize * 2}em`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, ${impact.color}35 0%, transparent 70%)`,
                    border: `1px solid ${impact.color}50`,
                  }}
                />
                <div
                  className={`relative rounded-full border-2 flex items-center justify-center font-bold text-[10px] text-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${isSelected ? "ring-2 ring-white scale-125" : ""}`}
                  style={{
                    width: `${Math.max(1.2, craterSize)}em`,
                    height: `${Math.max(1.2, craterSize)}em`,
                    backgroundColor: "#000",
                    borderColor: impact.color,
                  }}
                >
                  {impacts.length <= 20 ? idx + 1 : ""}
                </div>
              </div>
            );
          })}

          {explosions.map((ex) => {
            const scale = Math.min(3.5, Math.max(0.5, ex.magnitude / 3));
            return (
              <ImpactBurst key={ex.id} timestamp={ex.timestamp} magnitude={ex.magnitude}>
                <div
                  className="absolute pointer-events-none z-50"
                  style={{ left: `${ex.x}%`, top: `${ex.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 3 * scale, 6 * scale], opacity: [1, 0.8, 0] }}
                    transition={{ duration: 0.3 }}
                    className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                    style={{ left: "50%", top: "50%" }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.5 * scale, 2.2 * scale], opacity: [1, 0.9, 0] }}
                    transition={{ duration: 0.45 }}
                    className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
                    style={{
                      left: "50%",
                      top: "50%",
                      background: `radial-gradient(circle, #fff 0%, ${ex.color} 30%, #ff6600 60%, transparent 80%)`,
                    }}
                  />
                  {Array.from({ length: Math.round(6 + ex.magnitude) }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos((i / 8) * Math.PI * 2) * (18 + ex.magnitude * 5),
                        y: Math.sin((i / 8) * Math.PI * 2) * (18 + ex.magnitude * 5),
                        opacity: 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-1.5 h-1.5 rounded-full"
                      style={{
                        left: "50%",
                        top: "50%",
                        backgroundColor: i % 2 === 0 ? "#ff6600" : ex.color,
                      }}
                    />
                  ))}
                </div>
              </ImpactBurst>
            );
          })}

          {isHovering && hoverPos && !isDragging && (
            <div
              className="absolute bg-black/80 text-white text-[10px] px-2 py-1 rounded pointer-events-none z-30 whitespace-nowrap"
              style={{
                left: `${Math.min(85, hoverPos.x + 2)}%`,
                top: `${Math.max(5, hoverPos.y - 8)}%`,
              }}
            >
              {hoverPos.lat.toFixed(1)}°, {hoverPos.lng.toFixed(1)}°
            </div>
          )}

          {aiming && (
            <div
              className="pointer-events-none absolute z-30"
              style={{ left: `${aim.xPct}%`, top: `${aim.yPct}%` }}
            >
              <div className="relative h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.7)]">
                <span className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-white" />
                <span className="absolute left-1/2 top-1/2 h-px w-3.5 -translate-x-1/2 -translate-y-1/2 bg-white" />
              </div>
              <div className="absolute left-4 top-3 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-white">
                {pctToLatLng(aim.xPct, aim.yPct).lat.toFixed(1)}°,{" "}
                {pctToLatLng(aim.xPct, aim.yPct).lng.toFixed(1)}°
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="absolute inset-0 z-10 cursor-crosshair bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]"
          aria-label={`Launch site: ${describeAim(aim)}. Arrow keys move the crosshair, hold Shift for fine steps, Enter launches an asteroid.`}
          onFocus={() => setAiming(true)}
          onBlur={() => setAiming(false)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 1 : 5;
            const moves: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            };
            const move = moves[e.key];
            if (!move) return;
            e.preventDefault();
            setAiming(true);
            setAim((current) => ({
              xPct: clampPct(current.xPct + move[0]),
              yPct: clampPct(current.yPct + move[1]),
            }));
          }}
          onClick={(e) => {
            if (isDragging) return;
            // detail === 0 means Enter or Space, where there is no pointer to read a position
            // from. Without this branch the keyboard would always launch at the top-left.
            if (e.detail === 0) {
              const { lat, lng } = pctToLatLng(aim.xPct, aim.yPct);
              onMapClick(lat, lng);
              return;
            }
            const rect = containerRef.current!.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left - pan.x) / zoom / rect.width) * 100;
            const yPct = ((e.clientY - rect.top - pan.y) / zoom / rect.height) * 100;
            if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
            setAim({ xPct, yPct });
            const { lat, lng } = pctToLatLng(xPct, yPct);
            onMapClick(lat, lng);
          }}
        />
        <p className="sr-only" aria-live="polite">
          {aiming ? `Crosshair at ${describeAim(aim)}` : ""}
        </p>
      </motion.div>
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
