"use client";

import { useEffect, useRef } from "react";
import type { ImpactResult } from "./data";

interface Props {
  result: ImpactResult;
}

export function CraterCanvas({ result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
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
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background gradient (terrain)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 1.2);
    grad.addColorStop(0, "#1f2937");
    grad.addColorStop(0.5, "#111827");
    grad.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Scale: fit blast wave into 90% of canvas
    const maxRadiusKm = Math.max(result.blastWaveDistance, result.craterDiameter / 2, 0.1);
    const pixelsPerKm = (Math.min(w, h) * 0.45) / maxRadiusKm;

    const safeCtx = ctx;
    function drawCircle(
      radiusKm: number,
      color: string,
      lineWidth = 1,
      fillAlpha = 0,
      dashed = false
    ) {
      const r = radiusKm * pixelsPerKm;
      if (r < 1) return;
      if (fillAlpha > 0) {
        safeCtx.fillStyle = color;
        safeCtx.globalAlpha = fillAlpha;
        safeCtx.beginPath();
        safeCtx.arc(cx, cy, r, 0, Math.PI * 2);
        safeCtx.fill();
        safeCtx.globalAlpha = 1;
      }
      safeCtx.beginPath();
      safeCtx.arc(cx, cy, r, 0, Math.PI * 2);
      safeCtx.strokeStyle = color;
      safeCtx.lineWidth = lineWidth;
      if (dashed) safeCtx.setLineDash([6, 4]);
      else safeCtx.setLineDash([]);
      safeCtx.stroke();
      safeCtx.setLineDash([]);
    }

    // Blast wave (outermost)
    drawCircle(result.blastWaveDistance, "rgba(239, 68, 68, 0.5)", 1, 0.04, true);
    // Thermal
    drawCircle(result.thermalRadiationDistance, "rgba(249, 115, 22, 0.7)", 1.5, 0.08);
    // Fireball
    drawCircle(result.fireballRadius, "rgba(234, 179, 8, 0.9)", 2, 0.15);
    // Crater
    const craterR = result.craterDiameter / 2;
    if (craterR * pixelsPerKm > 2) {
      ctx.beginPath();
      ctx.arc(cx, cy, craterR * pixelsPerKm, 0, Math.PI * 2);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, craterR * pixelsPerKm);
      cg.addColorStop(0, "#000000");
      cg.addColorStop(0.6, "#1f1f1f");
      cg.addColorStop(1, "#374151");
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = "rgba(156, 163, 175, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Dot for tiny crater
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Scale bar
    const scaleKm = maxRadiusKm > 100 ? 50 : maxRadiusKm > 10 ? 5 : maxRadiusKm > 1 ? 1 : 0.1;
    const scalePx = scaleKm * pixelsPerKm;
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(12, h - 12);
    ctx.lineTo(12 + scalePx, h - 12);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "10px monospace";
    ctx.fillText(`${scaleKm} km`, 12, h - 16);

    // Legend
    const legend = [
      { label: "Crater", color: "#6b7280" },
      { label: "Fireball", color: "#eab308" },
      { label: "Thermal", color: "#f97316" },
      { label: "Blast", color: "#ef4444" },
    ];
    legend.forEach((item, i) => {
      const y = 12 + i * 16;
      ctx.fillStyle = item.color;
      ctx.fillRect(12, y, 10, 10);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "11px sans-serif";
      ctx.fillText(item.label, 26, y + 9);
    });
  }, [result]);

  return (
    <div className="bg-[var(--secondary)] rounded-xl overflow-hidden border border-[var(--border)]">
      <canvas
        ref={canvasRef}
        className="w-full h-[280px] md:h-[360px] block"
        aria-label={`Impact visualization: crater ${result.craterDiameter.toFixed(2)}km, blast ${result.blastWaveDistance.toFixed(1)}km`}
        role="img"
      />
      <div className="px-3 py-2 text-[10px] text-[var(--muted-foreground)] text-center">
        Scaled view — concentric rings show damage zones
      </div>
    </div>
  );
}
