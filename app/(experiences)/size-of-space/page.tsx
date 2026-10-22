"use client";

import { ChoiceStrip } from "@/lib/components/games/ChoiceStrip";
import { Picto } from "@/lib/components/games/Picto";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GameIcon } from "@/lib/components/GameIcon";
import { getAssetUrl } from "@/lib/utils/assets";
import { spaceObjects, categories, formatSize, type SpaceObject } from "./data";

const STAGE_H = 300;
/** Below this the smaller object would be sub-pixel, so we pin it to a floor
 *  height and say so rather than pretending the drawing is to scale. */
const MIN_DRAWN = 4;

function ObjectFigure({ object, height }: { object: SpaceObject; height: number }) {
  if (!object.image) {
    return (
      <div
        className="rounded-full bg-gradient-to-br from-slate-400 to-slate-700"
        style={{ height, width: height }}
        aria-hidden="true"
      />
    );
  }
  return (
    <Image
      src={getAssetUrl(object.image)}
      alt=""
      width={512}
      height={512}
      className="object-contain"
      style={{ height, width: height }}
    />
  );
}

/** The two objects drawn side by side at their true size ratio. */
function ScaleStage({ base, other }: { base: SpaceObject; other: SpaceObject }) {
  const bigger = base.size >= other.size ? base : other;
  const smaller = base.size >= other.size ? other : base;
  const ratio = bigger.size / smaller.size;
  const trueSmall = STAGE_H / ratio;
  const pinned = trueSmall < MIN_DRAWN;
  const smallH = pinned ? MIN_DRAWN : trueSmall;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-black/40 p-4">
      <div
        className="flex items-end justify-center gap-8 border-b border-[var(--border)] pb-2"
        style={{ minHeight: STAGE_H + 16 }}
      >
        <div className="flex flex-col items-center gap-2">
          <ObjectFigure object={smaller} height={smallH} />
          <span className="text-center text-xs text-[var(--muted-foreground)]">
            {smaller.name}
            <br />
            {formatSize(smaller.size)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ObjectFigure object={bigger} height={STAGE_H} />
          <span className="text-center text-xs text-[var(--muted-foreground)]">
            {bigger.name}
            <br />
            {formatSize(bigger.size)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-center text-sm" role="status">
        <strong>{bigger.name}</strong> is{" "}
        <strong className="text-[var(--primary)]">
          {ratio >= 1000 ? ratio.toExponential(2) : ratio.toFixed(1)}×
        </strong>{" "}
        the size of {smaller.name}.
      </p>
      <p className="mt-1 text-center text-xs text-[var(--muted-foreground)]">
        {pinned
          ? `Drawn to scale would make ${smaller.name} about ${trueSmall.toFixed(
              4
            )} pixels tall here, so it is pinned to ${MIN_DRAWN} pixels — the picture understates the gap.`
          : "Both drawn to scale against each other."}{" "}
        Object pictures are AI-generated illustrations, not photographs.
      </p>
    </div>
  );
}

export default function SizeOfSpacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [baseObject, setBaseObject] = useState<string>("Human");

  const filteredObjects = useMemo(() => {
    const objects =
      selectedCategory === "all"
        ? spaceObjects
        : spaceObjects.filter((obj) => obj.category === selectedCategory);
    return [...objects].sort((a, b) => a.size - b.size);
  }, [selectedCategory]);

  const { logMin, logMax } = useMemo(() => {
    const sizes = spaceObjects.map((o) => o.size);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    return {
      logMin: Math.log10(min),
      logMax: Math.log10(max),
    };
  }, []);

  const baseSize = useMemo(() => {
    const base = spaceObjects.find((o) => o.name === baseObject);
    return base ? base.size : 1.7;
  }, [baseObject]);

  // Zoomable scale canvas
  const scaleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(0);
  const [zoomCenter, setZoomCenter] = useState(0.5);
  const [journeyActive, setJourneyActive] = useState(false);
  const journeyRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = scaleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Determine visible log range based on zoom
    const fullRange = logMax - logMin;
    const visibleRange = fullRange / Math.pow(2, zoom); // zoom in reduces range
    const centerLog = logMin + zoomCenter * fullRange;
    const visibleMin = centerLog - visibleRange / 2;
    const visibleMax = centerLog + visibleRange / 2;

    // Draw grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw objects as dots
    filteredObjects.forEach((obj) => {
      const logSize = Math.log10(obj.size);
      if (logSize < visibleMin || logSize > visibleMax) return;
      const x = ((logSize - visibleMin) / visibleRange) * w;
      const y = h / 2 + Math.sin(logSize * 3) * h * 0.3; // slight wave for visual interest
      const isBase = obj.name === baseObject;
      const isSelected = obj.name === selectedItem;

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, isBase ? 8 : isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isBase ? "#5b5bd6" : isSelected ? "#22c55e" : "rgba(255,255,255,0.6)";
      ctx.fill();

      // Label for base and selected
      if (isBase || isSelected) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "11px sans-serif";
        ctx.fillText(obj.name, x + 10, y - 6);
      }
    });

    // Scale bar
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px monospace";
    ctx.fillText(
      `${formatSize(Math.pow(10, visibleMin))} — ${formatSize(Math.pow(10, visibleMax))}`,
      8,
      h - 8
    );
  }, [filteredObjects, logMin, logMax, zoom, zoomCenter, baseObject, selectedItem]);

  // Journey mode: auto travel from small to large
  useEffect(() => {
    if (!journeyActive) {
      if (journeyRef.current) cancelAnimationFrame(journeyRef.current);
      return;
    }
    const start = performance.now();
    const duration = 20000; // 20s journey
    const animate = (now: number) => {
      const elapsed = now - start;
      const t = (elapsed % duration) / duration; // loop
      setZoomCenter(t);
      setZoom(2 + Math.sin(t * Math.PI * 2) * 0.5); // slight zoom pulse
      // Auto select object closest to center
      const centerLog = logMin + t * (logMax - logMin);
      let closest = filteredObjects[0];
      let minDist = Infinity;
      filteredObjects.forEach((obj) => {
        const d = Math.abs(Math.log10(obj.size) - centerLog);
        if (d < minDist) {
          minDist = d;
          closest = obj;
        }
      });
      if (closest) setSelectedItem(closest.name);
      journeyRef.current = requestAnimationFrame(animate);
    };
    journeyRef.current = requestAnimationFrame(animate);
    return () => {
      if (journeyRef.current) cancelAnimationFrame(journeyRef.current);
    };
  }, [journeyActive, filteredObjects, logMin, logMax]);

  const stageBase = spaceObjects.find((o) => o.name === baseObject);
  const stageOther = spaceObjects.find((o) => o.name === selectedItem);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/size-of-space/icon.webp"
              alt="Size Of Space icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Size of Space
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Explore the incredible scale of the universe
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-sm font-medium">Comparison Mode</span>
            </label>

            <select
              value={baseObject}
              onChange={(e) => setBaseObject(e.target.value)}
              className="bg-[var(--secondary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm"
              aria-label="Base object for comparison"
            >
              {spaceObjects.map((obj) => (
                <option key={obj.name} value={obj.name}>
                  {obj.name}
                </option>
              ))}
            </select>
          </div>

          {stageBase && stageOther && stageBase.name !== stageOther.name && (
            <ScaleStage base={stageBase} other={stageOther} />
          )}

          {comparisonMode && (
            <p className="text-xs text-[var(--muted-foreground)]">
              Shows how many times larger each object is compared to {baseObject}. Second bar shows
              relative position vs base.
            </p>
          )}

          {/* Zoomable Scale Canvas + Journey */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Scale View</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Drag zoom, click list
                </span>
                <button
                  onClick={() => setJourneyActive(!journeyActive)}
                  aria-pressed={journeyActive}
                  className={`min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border ${journeyActive ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--secondary)] border-[var(--border)]"}`}
                >
                  {journeyActive ? (
                    <>
                      <Picto name="pause" /> Stop journey
                    </>
                  ) : (
                    <>
                      <Picto name="rocket" /> Journey
                    </>
                  )}
                </button>
              </div>
            </div>
            <canvas
              ref={scaleCanvasRef}
              className="w-full h-[120px] rounded-lg border border-[var(--border)] bg-black cursor-pointer"
              aria-label="Zoomable scale view of space objects"
              role="img"
              onClick={(e) => {
                const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const t = x / rect.width;
                const fullRange = logMax - logMin;
                const visibleRange = fullRange / Math.pow(2, zoom);
                const centerLog = logMin + zoomCenter * fullRange;
                const visibleMin = centerLog - visibleRange / 2;
                const clickedLog = visibleMin + t * visibleRange;
                const newCenter = (clickedLog - logMin) / fullRange;
                setZoomCenter(Math.max(0, Math.min(1, newCenter)));
              }}
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--muted-foreground)]">
                  Zoom {zoom.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[var(--primary)] h-1"
                  disabled={journeyActive}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[var(--muted-foreground)]">
                  Position {(zoomCenter * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={zoomCenter}
                  onChange={(e) => setZoomCenter(parseFloat(e.target.value))}
                  className="w-full accent-[var(--primary)] h-1"
                  disabled={journeyActive}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <ChoiceStrip label="Categories" className="mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            aria-pressed={selectedCategory === "all"}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              selectedCategory === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              aria-pressed={selectedCategory === cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                selectedCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </ChoiceStrip>

        {/* Objects List */}
        <div className="space-y-3">
          {filteredObjects.map((obj, index) => {
            // Log scale for cosmic sizes, linear would make everything except max invisible
            const logSize = Math.log10(obj.size);
            const logWidth = ((logSize - logMin) / (logMax - logMin)) * 100;
            const widthPercent = logWidth;
            const multiplier = obj.size / baseSize;
            // For comparison mode, also compute relative width vs base (log scale around base)
            const logBase = Math.log10(baseSize);
            const relativeLog = logSize - logBase; // negative if smaller, positive if larger
            // Map relative log -10..+10 to 0..100% centered at 50% for base
            const relativeWidth = comparisonMode
              ? Math.max(0.5, Math.min(100, 50 + relativeLog * 10))
              : 0;
            const isSelected = selectedItem === obj.name;

            return (
              <div
                key={obj.name}
                onClick={() => setSelectedItem(isSelected ? null : obj.name)}
                className="cursor-pointer"
              >
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {obj.image ? (
                        <Image
                          src={getAssetUrl(obj.image)}
                          alt=""
                          width={96}
                          height={96}
                          className="h-9 w-9 rounded-md bg-black/40 object-contain"
                        />
                      ) : (
                        <span
                          className="h-9 w-9 rounded-md bg-gradient-to-br from-slate-500 to-slate-800"
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-semibold">{obj.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono text-[var(--primary)]">
                        {formatSize(obj.size)}
                      </div>
                      {comparisonMode && baseObject !== obj.name && (
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {multiplier >= 1
                            ? `${multiplier.toFixed(1)}x larger`
                            : `${(1 / multiplier).toFixed(1)}x smaller`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Size Bar */}
                  <div className="space-y-1.5">
                    <div className="relative h-3 bg-[var(--secondary)] rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(widthPercent, 0.5)}%` }}
                        transition={{ duration: 0.5, delay: index * 0.02 }}
                      />
                    </div>
                    {comparisonMode && (
                      <div className="relative h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 bg-[var(--primary)]/60 rounded-full"
                          style={{
                            left: `${Math.min(50, relativeWidth)}%`,
                            width: `${Math.abs(relativeWidth - 50)}%`,
                            background:
                              relativeWidth >= 50
                                ? "linear-gradient(to right, var(--primary), #10b981)"
                                : "linear-gradient(to left, var(--primary), #ef4444)",
                          }}
                        />
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)]">
                      <p className="text-sm text-[var(--muted-foreground)]">{obj.description}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-sm text-[var(--muted-foreground)]">
          <p>Click on any object to learn more! Toggle comparison mode to see relative sizes.</p>
        </div>
      </div>
    </div>
  );
}
