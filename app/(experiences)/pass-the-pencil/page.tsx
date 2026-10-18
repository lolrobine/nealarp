"use client";

import { useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { buildRun, dailySeed, ROUNDS, scoreRound, scoreRun, type RoundScore } from "./logic";

type Stroke = { x: number; y: number }[];

export default function PassThePencilPage() {
  const record = usePersonalBest("pass-the-pencil");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [seed, setSeed] = useState(() => dailySeed());
  const rounds = buildRun(seed);
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<"draw" | "rate">("draw");
  const [match, setMatch] = useState(3);
  const [effort, setEffort] = useState(3);
  const [scores, setScores] = useState<RoundScore[]>([]);

  const round = rounds[roundIndex] ?? rounds[0]!;
  const finished = scores.length >= ROUNDS;

  function clearCanvas() {
    strokesRef.current = [];
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.fillStyle = "#fffdf7";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  function paint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    const strokes = strokesRef.current;
    if (e.type === "pointerdown") {
      drawingRef.current = true;
      strokes.push([{ x, y }]);
    } else if (e.type === "pointermove" && drawingRef.current) {
      const stroke = strokes[strokes.length - 1];
      if (!stroke) return;
      stroke.push({ x, y });
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      const prev = stroke[stroke.length - 2];
      if (prev) {
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    } else if (e.type === "pointerup" || e.type === "pointerleave") {
      drawingRef.current = false;
    }
  }

  function finishRound() {
    const nextScores = [...scores, { index: roundIndex, match, effort }];
    setScores(nextScores);
    if (nextScores.length >= ROUNDS) {
      record.save(scoreRun(nextScores));
      setPhase("draw");
      setRoundIndex(roundIndex + 1);
    } else {
      setRoundIndex(roundIndex + 1);
      setPhase("draw");
      clearCanvas();
      setMatch(3);
      setEffort(3);
    }
  }

  function restart() {
    setSeed(`pass-the-pencil:${Date.now()}`);
    setRoundIndex(0);
    setScores([]);
    setPhase("draw");
    clearCanvas();
    setMatch(3);
    setEffort(3);
  }

  return (
    <GameFrame
      id="pass-the-pencil"
      title="Pass the Pencil"
      intro="A drawing-telephone game for quiet rooms. Draw the prompt, then redraw it from memory when the prompt is hidden — every second round tests what survived. Prompts are original to this app (inspired by Telestrations and Gartic Phone)."
    >
      <Card className="p-6 space-y-4">
        <p className="rounded-lg border border-[var(--border)] bg-[var(--secondary)] p-3 text-sm">
          Solo dry-run mode: with no second player, memory rounds stand in for the handoff. In a
          real handoff, pass the device without showing your drawing or prompt.
        </p>

        {!finished && (
          <>
            <div className="text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                Round {roundIndex + 1} of {ROUNDS}
                {round.memoryRound ? " · memory round" : " · prompt round"}
              </p>
              <p className="mt-1 rounded-xl border border-[var(--border)] p-4 text-xl">
                {round.memoryRound
                  ? "Prompt hidden — redraw your previous drawing from memory."
                  : round.prompt}
              </p>
            </div>

            {phase === "draw" && (
              <>
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  className="mx-auto w-full touch-none rounded-xl border border-[var(--border)]"
                  style={{ maxWidth: 640, cursor: "crosshair", background: "#fffdf7" }}
                  role="img"
                  aria-label="Drawing canvas. Drag to draw."
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    paint(e);
                  }}
                  onPointerMove={paint}
                  onPointerUp={paint}
                  onPointerLeave={paint}
                />
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={clearCanvas}>
                    Clear drawing
                  </Button>
                  <Button onClick={() => setPhase("rate")}>Done drawing</Button>
                </div>
              </>
            )}

            {phase === "rate" && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--muted-foreground)]">
                  Honest marks, no audience: how much of the idea survived, and how hard did you
                  try?
                </p>
                <label className="block">
                  <span className="text-sm">Recognition 0–5: {match}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={match}
                    onChange={(e) => setMatch(Number(e.target.value))}
                    className="w-full"
                    aria-label={`Recognition ${match} of 5`}
                  />
                </label>
                <label className="block">
                  <span className="text-sm">Effort 0–5: {effort}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={effort}
                    onChange={(e) => setEffort(Number(e.target.value))}
                    className="w-full"
                    aria-label={`Effort ${effort} of 5`}
                  />
                </label>
                <div className="flex justify-center gap-2">
                  <Button onClick={finishRound}>
                    Score round ({scoreRound(match, effort)} pts)
                  </Button>
                  <Button variant="outline" onClick={() => setPhase("draw")}>
                    Back to drawing
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {finished && (
          <div
            className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-center"
            aria-live="polite"
          >
            <p className="text-xl font-bold">Game complete · {scoreRun(scores)} / 100</p>
            <p className="text-sm text-[var(--muted-foreground)]">
              Round scores: {scores.map((s) => scoreRound(s.match, s.effort)).join(" · ")}
            </p>
            <Button className="mt-2" onClick={restart}>
              New prompt deck
            </Button>
          </div>
        )}
      </Card>

      <PersonalBest record={record} />
    </GameFrame>
  );
}
