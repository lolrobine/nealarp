"use client";

import { useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { WinScreen } from "@/lib/components/games/WinScreen";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { buildRun, dailySeed, ROUNDS, scoreRound, scoreRun, type RoundScore } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

type Point = { x: number; y: number };
type Stroke = Point[];

const CANVAS_W = 640;
const CANVAS_H = 360;
/** Arrow-key travel per press, and the finer step Shift gives. */
const STEP = 12;
const FINE_STEP = 4;

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

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
  // The pointer route draws wherever the pointer is. The keyboard route needs a
  // cursor it can see and a pen it can put down, so both live here.
  const [cursor, setCursor] = useState<Point>({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const cursorRef = useRef<Point>({ x: CANVAS_W / 2, y: CANVAS_H / 2 });
  const [penDown, setPenDown] = useState(false);
  const penDownRef = useRef(false);
  // Nothing on screen used to say whether the sheet had anything on it, and
  // "Done drawing" was happy to submit a blank one.
  const [strokeCount, setStrokeCount] = useState(0);

  const round = rounds[roundIndex] ?? rounds[0]!;
  const finished = scores.length >= ROUNDS;

  /** Record the segment first, then paint it: the record is what the game is
   * about, and a canvas context is not always there to paint on. */
  function drawSegment(from: Point, to: Point) {
    const strokes = strokesRef.current;
    const current = strokes[strokes.length - 1];
    if (current) current.push(to);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function moveCursor(dx: number, dy: number) {
    const from = cursorRef.current;
    const to = { x: clamp(from.x + dx, CANVAS_W), y: clamp(from.y + dy, CANVAS_H) };
    cursorRef.current = to;
    setCursor(to);
    if (penDownRef.current) drawSegment(from, to);
  }

  function togglePen() {
    const next = !penDownRef.current;
    penDownRef.current = next;
    setPenDown(next);
    if (next) {
      strokesRef.current.push([{ ...cursorRef.current }]);
      setStrokeCount(strokesRef.current.length);
    }
  }

  function clearCanvas() {
    strokesRef.current = [];
    penDownRef.current = false;
    setPenDown(false);
    setStrokeCount(0);
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
      setStrokeCount(strokes.length);
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
                <div className="relative mx-auto w-full" style={{ maxWidth: CANVAS_W }}>
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_W}
                    height={CANVAS_H}
                    tabIndex={0}
                    className="w-full touch-none rounded-xl border border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{ cursor: "crosshair", background: "#fffdf7" }}
                    aria-label="Drawing canvas. Drag to draw, or move the pen with the arrow keys and press Enter to put it down and lift it again."
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      paint(e);
                    }}
                    onPointerMove={paint}
                    onPointerUp={paint}
                    onPointerLeave={paint}
                    onKeyDown={(e) => {
                      const step = e.shiftKey ? FINE_STEP : STEP;
                      if (e.key === "ArrowUp") moveCursor(0, -step);
                      else if (e.key === "ArrowDown") moveCursor(0, step);
                      else if (e.key === "ArrowLeft") moveCursor(-step, 0);
                      else if (e.key === "ArrowRight") moveCursor(step, 0);
                      else if (e.key === "Enter" || e.key === " ") togglePen();
                      else return;
                      e.preventDefault();
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                      penDown ? "border-slate-900 bg-slate-900" : "border-slate-900 bg-transparent"
                    }`}
                    style={{
                      left: `${(cursor.x / CANVAS_W) * 100}%`,
                      top: `${(cursor.y / CANVAS_H) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-center text-xs text-[var(--muted-foreground)]">
                  Arrow keys move the pen, Shift makes the steps smaller, Enter puts it down and
                  lifts it.
                </p>
                <p className="sr-only" aria-live="polite">
                  {penDown ? "Pen down" : "Pen up"} at {Math.round(cursor.x)},{" "}
                  {Math.round(cursor.y)}. {strokeCount} {strokeCount === 1 ? "stroke" : "strokes"}{" "}
                  drawn.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {strokeCount} {strokeCount === 1 ? "stroke" : "strokes"} on the sheet
                  </span>
                  <Button variant="outline" onClick={clearCanvas}>
                    Clear drawing
                  </Button>
                  <Button onClick={() => setPhase("rate")} disabled={strokeCount === 0}>
                    Done drawing
                  </Button>
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
          <WinScreen
            headline="Game complete"
            score={scoreRun(scores)}
            detail={`Round scores: ${scores.map((s) => scoreRound(s.match, s.effort)).join(" · ")}`}
          >
            <Button onClick={restart}>New prompt deck</Button>
          </WinScreen>
        )}
      </Card>

      <PersonalBest record={record} />

      <HowToBeat summary="Keeping a drawing alive">
        <ExampleStep n={1}>
          Draw big, bold landmarks — shape corners survive memory, fine hatching does not.
        </ExampleStep>
        <ExampleStep n={2}>
          Every second round hides the prompt and clears the sheet: what you just drew is the model,
          and only your memory of it comes with you.
        </ExampleStep>
        <ExampleResult>
          Six rounds: match × 12 + effort × 8 per round — faithful redraws keep both near max for
          100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
