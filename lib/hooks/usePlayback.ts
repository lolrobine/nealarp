"use client";
import { useEffect, useRef, useState } from "react";

export function playbackFraction(elapsed: number, duration: number) {
  return Math.min(1, Math.max(0, elapsed / Math.max(1, duration)));
}

/** Presentation only: physics and scoring never depend on animation frames. */
export function usePlayback() {
  const [progress, setProgress] = useState(1);
  const [running, setRunning] = useState(false);
  const start = useRef(0);
  const duration = useRef(1);
  function prefersStill() {
    return (
      typeof window.matchMedia !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }
  function play(milliseconds: number) {
    duration.current = Math.max(1, milliseconds);
    start.current = performance.now();
    if (prefersStill()) {
      setProgress(1);
      setRunning(false);
      return;
    }
    setProgress(0);
    setRunning(true);
  }
  function resume() {
    if (prefersStill()) {
      setProgress(1);
      setRunning(false);
      return;
    }
    start.current = performance.now() - (progress >= 1 ? 0 : progress) * duration.current;
    if (progress >= 1) setProgress(0);
    setRunning(true);
  }
  function seek(value: number) {
    setRunning(false);
    setProgress(Math.min(1, Math.max(0, value)));
  }
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    function tick(now: number) {
      const next = playbackFraction(now - start.current, duration.current);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
      else setRunning(false);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    function stop(event: MediaQueryListEvent) {
      if (event.matches) {
        setRunning(false);
        setProgress(1);
      }
    }
    media?.addEventListener("change", stop);
    return () => media?.removeEventListener("change", stop);
  }, []);
  return {
    progress,
    running,
    play,
    resume,
    seek,
    pause: () => setRunning(false),
    reset: () => seek(1),
  };
}
