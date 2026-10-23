"use client";

import { cssVar } from "@/lib/utils/cssVar";
import {
  calculateCircleScore,
  isCircleGhost,
  isCircleHistory,
  isCircleScore,
  type CircleGhost,
  type Point,
} from "./logic";
import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { GameIcon } from "@/lib/components/GameIcon";
import { Confetti } from "@/lib/components/Confetti";
import { useStoredValue } from "@/lib/hooks/useSavedProgress";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/** Hex from the theme plus an alpha channel, for the faint guide strokes. */
function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

type GameState = "idle" | "drawing" | "scored";
function getScoreMessage(score: number, closed: boolean, coverage: number): string {
  if (!closed) return "🔓 Try to close the circle — connect end to start!";
  if (coverage < 0.5) return "⭕ You drew an arc, not a full circle!";
  if (score >= 98) return "🏆 Perfect! Are you even human?";
  if (score >= 95) return "🥇 Incredible! Nearly perfect!";
  if (score >= 90) return "🥈 Excellent! Very impressive!";
  if (score >= 80) return "🥉 Great job!";
  if (score >= 70) return "👍 Not bad!";
  if (score >= 50) return "😅 You can do better!";
  if (score >= 30) return "😬 Keep practicing...";
  return "💀 What was that?";
}

export default function PerfectCirclePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const isDrawingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState<number | null>(null);
  const { value: bestScore, save: setBestScore } = useStoredValue(
    "perfect-circle-best",
    0,
    isCircleScore
  );
  const { value: storedHistory, save: setHistory } = useStoredValue<number[]>(
    "perfect-circle-history",
    [],
    isCircleHistory
  );
  const history = storedHistory.slice(0, 20);
  const { value: bestCircle, save: setBestCircle } = useStoredValue<CircleGhost | null>(
    "perfect-circle-best-circle",
    null,
    isCircleGhost
  );
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [pointCount, setPointCount] = useState(0);
  const [lastResult, setLastResult] = useState<{
    closed: boolean;
    coverage: number;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showGhost] = useState(true);
  const [isReplaying, setIsReplaying] = useState(false);
  const lastPointsRef = useRef<Point[]>([]);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      const size = Math.min(window.innerWidth - 40, 500);
      setCanvasSize({ width: size, height: size });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Draw the canvas — no longer depends on React state for points
  const drawCanvas = useCallback(
    (
      pts: Point[],
      isComplete: boolean = false,
      ghost: { centerX: number; centerY: number; radius: number } | null = null
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(128, 128, 128, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Ghost circle (best attempt)
      if (ghost && pts.length === 0 && showGhost) {
        ctx.beginPath();
        ctx.arc(ghost.centerX, ghost.centerY, ghost.radius, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(cssVar("--primary", "#5b5bd6"), 0.25);
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        ctx.fillStyle = withAlpha(cssVar("--primary", "#5b5bd6"), 0.5);
        ctx.font = "12px monospace";
        ctx.fillText(`Best ${bestScore}%`, ghost.centerX + ghost.radius + 6, ghost.centerY);
      }

      if (pts.length === 0) return;

      // Draw the path
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i]!.x, pts[i]!.y);
      }
      if (isComplete) {
        ctx.closePath();
      }
      ctx.strokeStyle = isComplete
        ? cssVar("--primary", "#5b5bd6")
        : withAlpha(cssVar("--primary", "#5b5bd6"), 0.65);
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // If scored, draw the ideal circle
      if (isComplete && pts.length >= 5) {
        const result = calculateCircleScore(pts);
        const { centerX, centerY, radius } = result;

        if (radius > 0) {
          // Draw ideal circle
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw center point
          ctx.beginPath();
          ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#22c55e";
          ctx.fill();
        }
      }
    },
    [bestScore, showGhost]
  );

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      const t = e.touches[0]!;
      clientX = t.clientX;
      clientY = t.clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const scheduleDraw = useCallback(
    (isComplete = false) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        drawCanvas(pointsRef.current, isComplete, bestCircle);
        rafRef.current = null;
      });
    },
    [drawCanvas, bestCircle]
  );

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    isDrawingRef.current = true;
    setGameState("drawing");
    pointsRef.current = [point];
    setPointCount(1);
    setScore(null);
    setLastResult(null);
    drawCanvas([point], false, null);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    pointsRef.current.push(point);
    // Update count occasionally to avoid too many React renders
    if (pointsRef.current.length % 5 === 0) {
      setPointCount(pointsRef.current.length);
    }
    scheduleDraw(false);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    setPointCount(pointsRef.current.length);

    const pts = pointsRef.current;
    lastPointsRef.current = [...pts];
    const result = calculateCircleScore(pts);
    setScore(result.score);
    setLastResult({ closed: result.closed, coverage: result.coverage });
    setGameState("scored");
    if (result.score > 0) {
      const newHistory = [result.score, ...history].slice(0, 20);
      setHistory(newHistory);
      if (result.score > bestScore) {
        setBestScore(result.score);
        const circle = { centerX: result.centerX, centerY: result.centerY, radius: result.radius };
        setBestCircle(circle);
      }
      if (result.score >= 90 && !prefersReducedMotion) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
    }
    drawCanvas(pts, true, null);
  };

  const handleReset = () => {
    pointsRef.current = [];
    setPointCount(0);
    setScore(null);
    setGameState("idle");
    setLastResult(null);
    drawCanvas([], false, bestCircle);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `perfect-circle-${score ?? 0}pct.png`;
    a.click();
  };

  const handleReplay = () => {
    if (lastPointsRef.current.length === 0 || prefersReducedMotion) return;
    setIsReplaying(true);
    setGameState("idle");
    let idx = 0;
    const pts = lastPointsRef.current;
    const replay = () => {
      idx += 3;
      if (idx >= pts.length) {
        setIsReplaying(false);
        setGameState("scored");
        drawCanvas(pts, true, null);
        return;
      }
      drawCanvas(pts.slice(0, idx), false, null);
      requestAnimationFrame(replay);
    };
    requestAnimationFrame(replay);
  };

  // Redraw ghost when bestCircle changes and idle
  useEffect(() => {
    if (gameState === "idle") {
      drawCanvas([], false, bestCircle);
    }
  }, [bestCircle, gameState, drawCanvas]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Confetti active={showConfetti && !prefersReducedMotion} />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/perfect-circle/icon.webp"
              alt="Perfect Circle icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Perfect Circle
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">Try to draw a perfect circle</p>
        </div>

        {/* Canvas */}
        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="bg-[var(--card)] border-2 border-[var(--border)] rounded-2xl cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            role="img"
            aria-label="Drawing canvas — draw a circle with your mouse or finger"
          />
        </div>

        {/* Instructions */}
        {gameState === "idle" && (
          <p className="text-center text-[var(--muted-foreground)] mb-6">
            Draw a circle on the canvas above ↑
          </p>
        )}

        {/* Score */}
        {gameState === "scored" && score !== null && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center mb-6">
            <div className="text-6xl font-bold mb-4">
              <span
                className={
                  score >= 90 ? "text-green-500" : score >= 70 ? "text-yellow-500" : "text-red-500"
                }
              >
                {score}%
              </span>
            </div>
            <p className="text-xl mb-2">
              {getScoreMessage(score, lastResult?.closed ?? true, lastResult?.coverage ?? 1)}
            </p>
            <p className="text-sm text-[var(--muted-foreground)]">
              The green dashed line shows the ideal circle (Kasa fit)
            </p>
            {bestScore > 0 && (
              <p className="text-sm text-[var(--muted-foreground)] mt-2">🏆 Best: {bestScore}%</p>
            )}
            {history.length > 1 && (
              <div className="mt-6">
                <p className="text-xs text-[var(--muted-foreground)] mb-2">Recent attempts</p>
                <div className="flex items-end justify-center gap-1 h-12">
                  {history.slice(0, 10).map((h, i) => (
                    <div
                      key={i}
                      className="w-6 bg-[var(--primary)]/60 rounded-t"
                      style={{ height: `${Math.max(4, (h / 100) * 48)}px` }}
                      title={`${h}%`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset & Export Buttons */}
        {gameState === "scored" && (
          <div className="text-center flex gap-3 justify-center flex-wrap">
            <motion.button
              onClick={handleReset}
              className="px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Try again"
            >
              Try Again
            </motion.button>
            <motion.button
              onClick={handleExport}
              className="px-6 py-3 bg-[var(--secondary)] rounded-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Export as image"
            >
              🖼️ Export
            </motion.button>
            <motion.button
              onClick={handleReplay}
              disabled={isReplaying}
              className="px-6 py-3 bg-[var(--secondary)] rounded-xl font-medium disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Replay drawing"
            >
              {isReplaying ? "Replaying..." : "▶️ Replay"}
            </motion.button>
          </div>
        )}

        {/* Drawing indicator */}
        {gameState === "drawing" && (
          <div className="text-center text-[var(--muted-foreground)] mt-4" aria-live="polite">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
              Drawing... ({pointCount} points)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
