"use client";

import { useEffect, useRef } from "react";

interface Props {
  depth: number;
  enabled?: boolean;
}

export function MarineSnow({ depth, enabled = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    // More particles deeper
    const baseCount = depth < 200 ? 30 : depth < 1000 ? 60 : depth < 4000 ? 100 : 150;
    const particles = Array.from({ length: baseCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.3,
      speed: Math.random() * 0.5 + 0.1 + depth / 20000,
      drift: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }));

    let lastTime = 0;
    function animate(time: number) {
      if (!ctx) return;
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.y += p.speed * (delta / 16);
        p.x += p.drift * (delta / 16);
        p.twinkle += 0.02;

        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const twinkleOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.twinkle));
        // Make particles more visible in deep water, less in shallow
        const depthFactor = depth < 200 ? 0.3 : depth < 1000 ? 0.6 : 1;

        ctx.globalAlpha = twinkleOpacity * depthFactor;
        ctx.fillStyle = depth < 1000 ? "rgba(255,255,255,0.9)" : "rgba(200,230,255,0.8)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow for deeper
        if (depth > 1000 && p.size > 1.2) {
          ctx.globalAlpha = twinkleOpacity * 0.15 * depthFactor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [depth, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ opacity: 0.8 }}
    />
  );
}
