"use client";

import { useMemo } from "react";
import { getAssetUrl } from "@/lib/utils/assets";
import { MAX_DEPTH } from "./data";

interface Props {
  depth: number;
}

export function RealisticOceanBackground({ depth }: Props) {
  const progress = depth / MAX_DEPTH;

  // Determine opacity for each layer based on depth
  const layers = useMemo(() => {
    // 0-200 sunlight, 200-1000 twilight, 1000-4000 midnight, 4000+ abyssal
    if (depth < 150) {
      return { sunlight: 1, twilight: 0, midnight: 0, abyssal: 0 };
    } else if (depth < 400) {
      const t = (depth - 150) / 250;
      return { sunlight: 1 - t, twilight: t, midnight: 0, abyssal: 0 };
    } else if (depth < 900) {
      return { sunlight: 0, twilight: 1, midnight: 0, abyssal: 0 };
    } else if (depth < 1500) {
      const t = (depth - 900) / 600;
      return { sunlight: 0, twilight: 1 - t, midnight: t, abyssal: 0 };
    } else if (depth < 3500) {
      return { sunlight: 0, twilight: 0, midnight: 1, abyssal: 0 };
    } else if (depth < 5000) {
      const t = (depth - 3500) / 1500;
      return { sunlight: 0, twilight: 0, midnight: 1 - t, abyssal: t };
    } else {
      return { sunlight: 0, twilight: 0, midnight: 0, abyssal: 1 };
    }
  }, [depth]);

  // Light intensity for sun rays
  const sunIntensity = Math.max(0, 1 - depth / 300);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Base black */}
      <div className="absolute inset-0 bg-black" />

      {/* Sunlight layer */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: layers.sunlight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("/experiences/deep-sea/sunlight.jpg")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-blue-500/10 to-transparent" />
        {/* Sun rays CSS */}
        {sunIntensity > 0.1 && (
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: sunIntensity }}>
            <div
              className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-white/30 via-white/10 to-transparent blur-[1px]"
              style={{ transform: "rotate(5deg)", transformOrigin: "top" }}
            />
            <div
              className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-[1px]"
              style={{ transform: "rotate(-3deg)", transformOrigin: "top" }}
            />
            <div
              className="absolute top-0 left-3/4 w-[2px] h-full bg-gradient-to-b from-white/20 via-white/5 to-transparent blur-sm"
              style={{ transform: "rotate(8deg)", transformOrigin: "top" }}
            />
            <div
              className="absolute top-0 left-[10%] w-32 h-[60%] bg-gradient-to-b from-white/[0.07] to-transparent blur-2xl"
              style={{ transform: "rotate(12deg)" }}
            />
            <div
              className="absolute top-0 left-[60%] w-40 h-[70%] bg-gradient-to-b from-white/[0.05] to-transparent blur-3xl"
              style={{ transform: "rotate(-8deg)" }}
            />
          </div>
        )}
      </div>

      {/* Twilight layer */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: layers.twilight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("/experiences/deep-sea/twilight.jpg")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#0a1a3a]/60" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-indigo-950/80" />
      </div>

      {/* Midnight layer */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: layers.midnight }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("/experiences/deep-sea/midnight.jpg")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/40" />
        {/* Bioluminescence glow spots */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-cyan-400 rounded-full blur-[2px] animate-pulse" />
          <div className="absolute top-[60%] left-[70%] w-1 h-1 bg-blue-300 rounded-full blur-[1px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 bg-teal-300 rounded-full blur-[1px] animate-pulse delay-500" />
          <div className="absolute top-[80%] left-[20%] w-1 h-1 bg-cyan-200 rounded-full blur-[1px] animate-pulse delay-700" />
        </div>
      </div>

      {/* Abyssal layer */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: layers.abyssal }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getAssetUrl("/experiences/deep-sea/abyssal.jpg")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Depth-based color overlay for realism */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-500"
        style={{
          background: `linear-gradient(to bottom, 
            rgba(14,165,233,${Math.max(0, 0.15 - progress * 0.5)}) 0%,
            rgba(30,64,175,${Math.max(0, 0.2 - progress * 0.3)}) 20%,
            rgba(12,10,9,${Math.min(0.6, progress * 0.8)}) 60%,
            rgba(0,0,0,${Math.min(0.85, progress * 1.2)}) 100%)`,
        }}
      />

      {/* Vignette for depth immersion */}
      <div className="absolute inset-0 bg-radial pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.6)_100%)]" />

      {/* Surface wave distortion at top when shallow */}
      {depth < 100 && (
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden opacity-60">
          <div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(90deg, 
                transparent 0px, 
                rgba(255,255,255,0.03) 20px, 
                transparent 40px)`,
              animation: "wave-drift 8s linear infinite",
            }}
          />
          <style>{`
            @keyframes wave-drift {
              0% { transform: translateX(0); }
              100% { transform: translateX(40px); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
