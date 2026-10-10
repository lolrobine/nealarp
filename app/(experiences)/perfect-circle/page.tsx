"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GameState = "idle" | "drawing" | "scored";

function calculateCircleScore(points: { x: number; y: number }[]): {
  score: number;
  centerX: number;
  centerY: number;
  radius: number;
} {
  if (points.length < 5) return { score: 0, centerX: 0, centerY: 0, radius: 0 };

  // Find center (average of all points)
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const centerX = sumX / points.length;
  const centerY = sumY / points.length;

  // Find average radius
  const distances = points.map((p) =>
    Math.sqrt((p.x - centerX) ** 2 + (p.y - centerY) ** 2)
  );
  const radius = distances.reduce((s, d) => s + d, 0) / distances.length;

  // Calculate deviation from perfect circle
  const deviations = distances.map((d) => Math.abs(d - radius));
  const avgDeviation = deviations.reduce((s, d) => s + d, 0) / deviations.length;

  // Score: 100 = perfect, 0 = terrible
  const maxDeviation = radius * 0.5; // 50% deviation = 0 score
  const normalizedDeviation = Math.min(avgDeviation / maxDeviation, 1);
  const score = Math.round((1 - normalizedDeviation) * 100);

  return { score: Math.max(0, score), centerX, centerY, radius };
}

function getScoreMessage(score: number): string {
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
  const [gameState, setGameState] = useState<GameState>("idle");
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });

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

  // Draw the canvas
  const drawCanvas = useCallback(
    (pts: { x: number; y: number }[], isComplete: boolean = false) => {
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

      if (pts.length === 0) return;

      // Draw the path
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      if (isComplete) {
        ctx.closePath();
      }
      ctx.strokeStyle = isComplete ? "#6366f1" : "#818cf8";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // If scored, draw the "perfect" circle
      if (isComplete && pts.length >= 5) {
        const { centerX, centerY, radius } = calculateCircleScore(pts);

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
    },
    []
  );

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    setGameState("drawing");
    setPoints([point]);
    setScore(null);
    drawCanvas([point]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    setPoints((prev) => {
      const newPoints = [...prev, point];
      drawCanvas(newPoints);
      return newPoints;
    });
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);

    const { score: calculatedScore } = calculateCircleScore(points);
    setScore(calculatedScore);
    setGameState("scored");
    if (calculatedScore > bestScore) {
      setBestScore(calculatedScore);
    }
    drawCanvas(points, true);
  };

  const handleReset = () => {
    setPoints([]);
    setScore(null);
    setGameState("idle");
    drawCanvas([]);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">⭕ Perfect Circle</h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Try to draw a perfect circle
          </p>
        </motion.div>

        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
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
          />
        </motion.div>

        {/* Instructions */}
        {gameState === "idle" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[var(--muted-foreground)] mb-6"
          >
            Draw a circle on the canvas above ↑
          </motion.p>
        )}

        {/* Score */}
        <AnimatePresence>
          {gameState === "scored" && score !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center mb-6"
            >
              <div className="text-6xl font-bold mb-4">
                <span
                  className={
                    score >= 90
                      ? "text-green-500"
                      : score >= 70
                      ? "text-yellow-500"
                      : "text-red-500"
                  }
                >
                  {score}%
                </span>
              </div>
              <p className="text-xl mb-2">{getScoreMessage(score)}</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                The green dashed line shows the ideal circle
              </p>
              {bestScore > 0 && (
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  🏆 Best: {bestScore}%
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reset Button */}
        {gameState === "scored" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.button
              onClick={handleReset}
              className="px-8 py-3 bg-[var(--primary)] text-white rounded-xl font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* Drawing indicator */}
        {gameState === "drawing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[var(--muted-foreground)] mt-4"
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse" />
              Drawing... ({points.length} points)
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
