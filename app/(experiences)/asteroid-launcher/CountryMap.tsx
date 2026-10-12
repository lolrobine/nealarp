"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { getAssetUrl } from "@/lib/utils/assets";
import type { MapImpact } from "./WorldMap";
import type { CountryMapDef } from "./countryMaps";
import { pctToLatLngCountry, latLngToPct, isInBounds } from "./countryMaps";

type ShakeEvent = { id: string; magnitude: number; energy: number } | null;

interface Props {
  country: CountryMapDef;
  impacts: MapImpact[];
  onMapClick: (lat: number, lng: number, xPct: number, yPct: number) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  shakeEvent: ShakeEvent;
}

type Explosion = {
  id: string;
  x: number;
  y: number;
  color: string;
  magnitude: number;
};

export function CountryMap({
  country,
  impacts,
  onMapClick,
  selectedId,
  onSelect,
  shakeEvent,
}: Props) {
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
  const [imgError, setImgError] = useState(false);

  const shakeControls = useAnimationControls();

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 8;

  // Filter impacts that are inside this country's bounds
  const visibleImpacts = impacts.filter((imp) => isInBounds(imp.lat, imp.lng, country.bounds));

  // Shake based on asteroid strength
  useEffect(() => {
    if (!shakeEvent) return;
    // Check if this shake event is for an impact inside this country (or latest)
    const magnitude = shakeEvent.magnitude;
    // Intensity based on magnitude: 0-12 scale -> 2px to 40px
    const intensity = Math.min(40, Math.max(2, magnitude * 3.5));
    const duration = Math.min(1.8, Math.max(0.35, magnitude * 0.16));
    const vertical = intensity * 0.4;

    shakeControls.start({
      x: [
        0,
        -intensity,
        intensity,
        -intensity * 0.8,
        intensity * 0.8,
        -intensity * 0.5,
        intensity * 0.5,
        0,
      ],
      y: [0, vertical, -vertical, vertical * 0.6, -vertical * 0.6, 0],
      transition: { duration, ease: "easeOut" },
    });

    // Also trigger explosion for this country if impact is inside
    const latestImpact = impacts.find((i) => i.id === shakeEvent.id);
    if (latestImpact && isInBounds(latestImpact.lat, latestImpact.lng, country.bounds)) {
      const { x, y } = latLngToPct(latestImpact.lat, latestImpact.lng, country.bounds);
      setExplosions((prev) => [
        ...prev,
        { id: shakeEvent.id, x, y, color: latestImpact.color, magnitude },
      ]);
      setTimeout(
        () => {
          setExplosions((prev) => prev.filter((ex) => ex.id !== shakeEvent.id));
        },
        1200 + magnitude * 100
      );
    }

    try {
      const vibPattern =
        magnitude < 4 ? [30] : magnitude < 6 ? [50, 30, 80] : [100, 50, 150, 30, 200];
      navigator.vibrate?.(vibPattern);
    } catch {}
  }, [shakeEvent, impacts, shakeControls, country.bounds]);

  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom));
      if (centerX !== undefined && centerY !== undefined && containerRef.current) {
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
      if (e.ctrlKey || e.metaKey) return;
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
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xInContainer = e.clientX - rect.left;
      const yInContainer = e.clientY - rect.top;
      const xInContent = (xInContainer - pan.x) / zoom;
      const yInContent = (yInContainer - pan.y) / zoom;
      const xPct = (xInContent / rect.width) * 100;
      const yPct = (yInContent / rect.height) * 100;
      if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) {
        const { lat, lng } = pctToLatLngCountry(xPct, yPct, country.bounds);
        setHoverPos({ x: xPct, y: yPct, lat, lng });
      }
    },
    [isDragging, dragStart, pan, zoom, country.bounds]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const xInContainer = e.clientX - rect.left;
      const yInContainer = e.clientY - rect.top;
      const xInContent = (xInContainer - pan.x) / zoom;
      const yInContent = (yInContainer - pan.y) / zoom;
      const xPct = (xInContent / rect.width) * 100;
      const yPct = (yInContent / rect.height) * 100;
      if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
      const { lat, lng } = pctToLatLngCountry(xPct, yPct, country.bounds);
      onMapClick(lat, lng, xPct, yPct);
    },
    [onMapClick, isDragging, pan, zoom, country.bounds]
  );

  const getImpactSize = (result: MapImpact["result"], type: "crater" | "blast") => {
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    // For country maps, scale differently: country width in km approx
    const countryWidthKm =
      (country.bounds.east - country.bounds.west) *
      111 *
      Math.cos((country.center.lat * Math.PI) / 180);
    const pct = (km / Math.max(countryWidthKm, 500)) * 100;
    const minSize = type === "crater" ? 0.8 : 1.5;
    return Math.max(minSize, Math.min(pct * 2, type === "crater" ? 4 : 20));
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {country.flag} {country.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
            Click to fire
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[var(--secondary)] rounded-full">
            {visibleImpacts.length} hits in {country.name}
          </span>
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
        </div>
      </div>

      <motion.div
        ref={containerRef}
        animate={shakeControls}
        className={`relative w-full aspect-[16/10] bg-[#0a1628] overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"}`}
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
        aria-label={`${country.name} map - click to launch, scroll to zoom`}
      >
        <div
          ref={mapContentRef}
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Country map image or fallback */}
          {!imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getAssetUrl(country.image)}
              alt={`${country.name} map`}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0f2a1a] via-[#1a3a2a] to-[#0a1f0f] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-3">{country.flag}</div>
                <div className="text-white font-bold text-xl">{country.name}</div>
                <div className="text-white/60 text-xs mt-1">
                  {country.capital} • {country.population}
                </div>
                <div className="mt-4 grid grid-cols-8 gap-1 opacity-20 max-w-[300px] mx-auto">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <div key={i} className="w-full h-2 bg-white/30 rounded" />
                  ))}
                </div>
              </div>
            </div>
          )}

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
          </svg>

          {/* Impacts in this country */}
          {visibleImpacts.map((impact, idx) => {
            const { x, y } = latLngToPct(impact.lat, impact.lng, country.bounds);
            const isSelected = selectedId === impact.id;
            const blastSize = getImpactSize(impact.result, "blast");
            const craterSize = getImpactSize(impact.result, "crater");
            return (
              <div
                key={impact.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
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
                  }}
                />
                <div
                  className={`relative rounded-full border-2 flex items-center justify-center font-bold text-[10px] text-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${isSelected ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-125" : ""}`}
                  style={{
                    width: `${Math.max(1.2, craterSize)}em`,
                    height: `${Math.max(1.2, craterSize)}em`,
                    backgroundColor: "#000",
                    borderColor: impact.color,
                    boxShadow: `0 0 10px ${impact.color}`,
                  }}
                >
                  {visibleImpacts.length <= 12 ? idx + 1 : ""}
                </div>
                {isSelected && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-30 border border-white/20">
                    <div className="font-bold">{impact.result.equivalentTNT}</div>
                    <div className="text-white/70">
                      {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}°
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Explosions */}
          {explosions.map((ex) => {
            const scaleFactor = Math.min(3, Math.max(0.6, ex.magnitude / 3));
            return (
              <div
                key={ex.id}
                className="absolute pointer-events-none z-50"
                style={{ left: `${ex.x}%`, top: `${ex.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 2 * scaleFactor, 4 * scaleFactor], opacity: [1, 0.8, 0] }}
                  transition={{ duration: 0.4 }}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                  style={{ left: "50%", top: "50%" }}
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2 * scaleFactor, 2 * scaleFactor], opacity: [1, 0.9, 0] }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
                  style={{
                    left: "50%",
                    top: "50%",
                    background: `radial-gradient(circle, #fff 0%, ${ex.color} 30%, #ff6600 60%, transparent 80%)`,
                  }}
                />
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: [0, 3 * scaleFactor, 6 * scaleFactor], opacity: [0.8, 0.4, 0] }}
                  transition={{ duration: 0.8 }}
                  className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ left: "50%", top: "50%", borderColor: ex.color }}
                />
                {Array.from({ length: Math.round(6 + ex.magnitude) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos((i / 8) * Math.PI * 2) * (20 + ex.magnitude * 8),
                      y: Math.sin((i / 8) * Math.PI * 2) * (20 + ex.magnitude * 8),
                      opacity: 0,
                    }}
                    transition={{ duration: 0.7, delay: 0.1 }}
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

        <div className="absolute inset-0 z-10" onClick={handleClick} aria-hidden />

        {visibleImpacts.length === 0 && !isHovering && zoom === 1 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-center">
              <div className="text-2xl mb-2">{country.flag}</div>
              <div className="text-white font-bold text-sm">
                Click anywhere in {country.name} to launch
              </div>
              <div className="text-white/60 text-xs mt-1">
                Scroll to zoom • Shake scales with asteroid power
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="px-3 py-2 bg-[var(--card)] border-t border-[var(--border)] flex flex-wrap gap-2 text-[10px] text-[var(--muted-foreground)]">
        <span>
          {country.flag} {country.name} • {country.capital} • {country.population}
        </span>
        <span className="ml-auto">
          Bounds: {country.bounds.south.toFixed(1)}° to {country.bounds.north.toFixed(1)}° • Shake =
          earthquake magnitude
        </span>
      </div>
    </div>
  );
}
