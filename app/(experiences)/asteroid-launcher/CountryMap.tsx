"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ImpactBurst } from "./ImpactBurst";
import { motion, useAnimationControls } from "framer-motion";
import { getAssetUrl } from "@/lib/utils/assets";
import type { MapImpact, ShakeEvent } from "./WorldMap";
import type { CountryMapDef } from "./countryMaps";
import { pctToLatLngCountry, latLngToPct, isInBounds } from "./countryMaps";

interface Props {
  country: CountryMapDef;
  impacts: MapImpact[];
  onMapClick: (lat: number, lng: number) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  shakeEvent: ShakeEvent;
}

function getVibratePattern(magnitude: number): number[] {
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
  const oscillations = Math.round(4 + magnitude * 2.5);
  const x: number[] = [0];
  const y: number[] = [0];
  for (let i = 0; i < oscillations; i++) {
    const decay = 1 - (i / oscillations) * 0.45;
    const sign = i % 2 === 0 ? -1 : 1;
    x.push(sign * intensity * decay);
    y.push(sign * intensity * 0.32 * decay);
  }
  x.push(0);
  y.push(0);
  return { x, y };
}

export function CountryMap({
  country,
  impacts,
  onMapClick,
  selectedIds,
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [imgError, setImgError] = useState(false);

  const shakeControls = useAnimationControls();

  const visibleImpacts = impacts.filter((imp) => isInBounds(imp.lat, imp.lng, country.bounds));

  const explosions = visibleImpacts.map((impact) => ({
    ...impact,
    ...latLngToPct(impact.lat, impact.lng, country.bounds),
    magnitude: impact.result.earthquakeMagnitude,
  }));

  useEffect(() => {
    if (!shakeEvent) return;
    const magnitude = shakeEvent.magnitude;
    const intensity = Math.min(55, Math.max(3, magnitude * 4.5));
    const duration = Math.min(1, Math.max(0.2, 0.25 + magnitude * 0.04));
    const { x, y } = generateShakePattern(intensity, magnitude);
    shakeControls.start({ x, y, transition: { duration, ease: "easeOut" } });

    try {
      navigator.vibrate?.(getVibratePattern(magnitude));
    } catch {}
  }, [shakeEvent, impacts, shakeControls, country.bounds]);

  const handleZoom = useCallback(
    (newZoom: number, centerX?: number, centerY?: number) => {
      const clamped = Math.min(8, Math.max(1, newZoom));
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

  const getImpactSize = (result: MapImpact["result"], type: "crater" | "blast") => {
    const km = type === "crater" ? result.craterDiameter / 2 : result.blastWaveDistance;
    const countryWidthKm =
      (country.bounds.east - country.bounds.west) *
      111 *
      Math.cos((country.center.lat * Math.PI) / 180);
    return Math.max(
      type === "crater" ? 0.8 : 1.5,
      Math.min((km / Math.max(countryWidthKm, 500)) * 100 * 2, type === "crater" ? 4 : 20)
    );
  };

  return (
    <div className="relative w-full bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      <div className="px-3 py-2 bg-[var(--card)] border-b border-[var(--border)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {country.flag} {country.name}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[var(--secondary)] rounded-full">
            {visibleImpacts.length} hits
          </span>
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
              disabled={zoom >= 8}
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
        className={`relative w-full aspect-[16/10] bg-[#0a1628] overflow-hidden select-none ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-crosshair"}`}
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
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const xPct = ((e.clientX - rect.left - pan.x) / zoom / rect.width) * 100;
          const yPct = ((e.clientY - rect.top - pan.y) / zoom / rect.height) * 100;
          if (xPct >= 0 && xPct <= 100 && yPct >= 0 && yPct <= 100) {
            const { lat, lng } = pctToLatLngCountry(xPct, yPct, country.bounds);
            setHoverPos({ x: xPct, y: yPct, lat, lng });
          }
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
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f2a1a] to-[#1a3a2a] flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl">{country.flag}</div>
                <div className="text-white font-bold mt-2">{country.name}</div>
              </div>
            </div>
          )}

          {visibleImpacts.map((impact, idx) => {
            const { x, y } = latLngToPct(impact.lat, impact.lng, country.bounds);
            const isSelected = selectedIds.includes(impact.id);
            const craterSize = getImpactSize(impact.result, "crater");
            return (
              <div
                key={impact.id}
                className="absolute pointer-events-auto"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isSelected ? 30 : 10 + idx,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(impact.id);
                }}
              >
                <div
                  className={`relative rounded-full border-2 flex items-center justify-center font-bold text-[10px] text-white shadow-lg cursor-pointer hover:scale-110 ${isSelected ? "ring-2 ring-white scale-125" : ""}`}
                  style={{
                    width: `${Math.max(1.2, craterSize)}em`,
                    height: `${Math.max(1.2, craterSize)}em`,
                    backgroundColor: "#000",
                    borderColor: impact.color,
                  }}
                >
                  {visibleImpacts.length <= 20 ? idx + 1 : ""}
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
        </div>

        <div
          className="absolute inset-0 z-10"
          onClick={(e) => {
            if (isDragging) return;
            const rect = containerRef.current!.getBoundingClientRect();
            const xPct = ((e.clientX - rect.left - pan.x) / zoom / rect.width) * 100;
            const yPct = ((e.clientY - rect.top - pan.y) / zoom / rect.height) * 100;
            if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;
            const { lat, lng } = pctToLatLngCountry(xPct, yPct, country.bounds);
            onMapClick(lat, lng);
          }}
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
