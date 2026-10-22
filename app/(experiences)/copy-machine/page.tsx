"use client";

import { useEffect, useRef, useState } from "react";
import { GameFrame, PersonalBest } from "@/lib/components/games/GameFrame";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { usePersonalBest } from "@/lib/hooks/usePersonalBest";
import { copyScore, normalize, stabilityScore, type Drawing, type Pt } from "./logic";
import { ExampleResult, ExampleStep, HowToBeat } from "@/lib/components/games/HowToBeat";

const GLYPHS: { name: string; drawing: Drawing }[] = [
  {
    name: "Spiral",
    drawing: [
      Array.from({ length: 40 }, (_, i) => {
        const t = (i / 39) * Math.PI * 4.5;
        const r = 8 + i * 1.6;
        return { x: 160 + Math.cos(t) * r, y: 160 + Math.sin(t) * r };
      }),
    ],
  },
  {
    name: "Star",
    drawing: [
      Array.from({ length: 11 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 95 : 42;
        return { x: 160 + Math.cos(angle) * r, y: 160 + Math.sin(angle) * r };
      }),
    ],
  },
  {
    name: "House",
    drawing: [
      [
        { x: 70, y: 170 },
        { x: 70, y: 260 },
        { x: 250, y: 260 },
        { x: 250, y: 170 },
      ],
      [
        { x: 55, y: 175 },
        { x: 160, y: 85 },
        { x: 265, y: 175 },
      ],
      [
        { x: 140, y: 260 },
        { x: 140, y: 205 },
        { x: 185, y: 205 },
        { x: 185, y: 260 },
      ],
    ],
  },
  {
    name: "Wave",
    drawing: [
      Array.from({ length: 36 }, (_, i) => ({
        x: 45 + i * 6.7,
        y: 165 + Math.sin((i / 35) * Math.PI * 3) * 62,
      })),
    ],
  },
  {
    name: "Smiley",
    drawing: [
      Array.from({ length: 30 }, (_, i) => {
        const angle = (i / 29) * Math.PI * 2;
        return { x: 160 + Math.cos(angle) * 105, y: 160 + Math.sin(angle) * 105 };
      }),
      [
        { x: 118, y: 128 },
        { x: 118, y: 145 },
      ],
      [
        { x: 202, y: 128 },
        { x: 202, y: 145 },
      ],
      [
        { x: 108, y: 195 },
        { x: 135, y: 222 },
        { x: 185, y: 222 },
        { x: 212, y: 195 },
      ],
    ],
  },
  {
    name: "Leaf",
    drawing: [
      [
        ...Array.from({ length: 22 }, (_, i) => {
          const t = i / 21;
          return { x: 70 + t * 180, y: 160 - Math.sin(t * Math.PI) * 68 };
        }),
        ...Array.from({ length: 22 }, (_, i) => {
          const t = 1 - i / 21;
          return { x: 70 + t * 180, y: 160 + Math.sin(t * Math.PI) * 68 };
        }),
      ],
      [
        { x: 70, y: 160 },
        { x: 250, y: 160 },
      ],
    ],
  },
  {
    name: "Bolt",
    drawing: [
      [
        { x: 182, y: 48 },
        { x: 108, y: 172 },
        { x: 154, y: 172 },
        { x: 128, y: 272 },
        { x: 214, y: 146 },
        { x: 166, y: 146 },
        { x: 202, y: 48 },
        { x: 182, y: 48 },
      ],
    ],
  },
  {
    name: "Fish",
    drawing: [
      Array.from({ length: 30 }, (_, i) => {
        const t = (i / 29) * Math.PI * 2;
        return { x: 148 + Math.cos(t) * 84, y: 165 + Math.sin(t) * 48 };
      }),
      [
        { x: 232, y: 165 },
        { x: 288, y: 118 },
        { x: 288, y: 212 },
        { x: 232, y: 165 },
      ],
      Array.from({ length: 10 }, (_, i) => {
        const t = (i / 9) * Math.PI * 2;
        return { x: 104 + Math.cos(t) * 9, y: 150 + Math.sin(t) * 9 };
      }),
    ],
  },
  {
    name: "Key",
    drawing: [
      Array.from({ length: 26 }, (_, i) => {
        const t = (i / 25) * Math.PI * 2;
        return { x: 104 + Math.cos(t) * 46, y: 160 + Math.sin(t) * 46 };
      }),
      [
        { x: 150, y: 160 },
        { x: 268, y: 160 },
      ],
      [
        { x: 230, y: 160 },
        { x: 230, y: 198 },
      ],
      [
        { x: 256, y: 160 },
        { x: 256, y: 190 },
      ],
    ],
  },
  {
    name: "Boat",
    drawing: [
      [
        { x: 58, y: 202 },
        { x: 90, y: 252 },
        { x: 228, y: 252 },
        { x: 262, y: 202 },
        { x: 58, y: 202 },
      ],
      [
        { x: 160, y: 202 },
        { x: 160, y: 68 },
      ],
      [
        { x: 160, y: 80 },
        { x: 240, y: 186 },
        { x: 160, y: 186 },
      ],
    ],
  },
];

const GENERATIONS = 5;

function toSvgPath(drawing: Drawing): string[] {
  return normalize(drawing)
    .filter((stroke) => stroke.length > 0)
    .map(
      (stroke) =>
        stroke
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"}${(p.x * 100 + 50).toFixed(2)} ${(p.y * 100 + 50).toFixed(2)}`
          )
          .join(" ") + " "
    );
}

function drawScene(
  canvas: HTMLCanvasElement,
  model: Drawing,
  strokes: Drawing,
  colors: { bg: string; model: string; ink: string }
) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const dpr = window.devicePixelRatio || 1;
  const size = 320;
  if (canvas.width !== size * dpr) {
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.fillStyle = colors.bg;
  context.fillRect(0, 0, size, size);
  const paint = (drawing: Drawing, color: string, width: number) => {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const stroke of drawing) {
      if (stroke.length === 0) continue;
      context.beginPath();
      context.moveTo(stroke[0]!.x, stroke[0]!.y);
      for (const p of stroke.slice(1)) context.lineTo(p.x, p.y);
      if (stroke.length === 1) context.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y);
      context.stroke();
    }
  };
  paint(model, colors.model, 3);
  paint(strokes, colors.ink, 4);
}

async function downloadLineage(lineage: Drawing[], score: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export unavailable");
  context.fillStyle = "#170f2c";
  context.fillRect(0, 0, 1200, 630);
  context.fillStyle = "#ffffff";
  context.font = "bold 44px sans-serif";
  context.fillText("Copy Machine — drift lineage", 56, 84);
  context.font = "26px sans-serif";
  context.fillStyle = "#ddd6fe";
  context.fillText(
    `Stability score ${score.toFixed(1)} / 100 · Saved locally · No leaderboard`,
    56,
    130
  );
  const cell = 170;
  lineage.forEach((drawing, i) => {
    const x = 56 + i * 185;
    const y = 200;
    context.fillStyle = "#241a3f";
    context.fillRect(x, y, cell, cell);
    context.strokeStyle = "#5b21b6";
    context.lineWidth = 3;
    const normalized = normalize(drawing);
    for (const poly of normalized) {
      context.beginPath();
      poly.forEach((p, j) => {
        const px = x + cell / 2 + p.x * (cell - 30);
        const py = y + cell / 2 + p.y * (cell - 30);
        if (j === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      });
      context.stroke();
    }
    context.fillStyle = "#a5b4fc";
    context.font = "20px sans-serif";
    context.fillText(i === 0 ? "model" : `copy ${i}`, x + 8, y + cell + 30);
  });
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) => (value ? resolve(value) : reject(new Error("Image export failed"))),
      "image/png"
    )
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "copy-machine-lineage.png";
  link.click();
  URL.revokeObjectURL(url);
}

export default function CopyMachinePage() {
  const record = usePersonalBest("copy-machine");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Drawing>([]);
  const drawingRef = useRef(false);
  const [glyphIndex, setGlyphIndex] = useState(0);
  const [gen, setGen] = useState(0);
  const [model, setModel] = useState<Drawing>(GLYPHS[0]!.drawing);
  const [lineage, setLineage] = useState<Drawing[]>([GLYPHS[0]!.drawing]);
  const [scores, setScores] = useState<number[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const finished = gen >= GENERATIONS;
  const stability = finished ? stabilityScore(lineage) : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScene(canvas, model, strokesRef.current, {
      bg: "#111827",
      model: "#6b7280",
      ink: "#818cf8",
    });
  }, [model, gen, glyphIndex, finished]);

  function resetTo(index: number) {
    strokesRef.current = [];
    setStrokeCount(0);
    setGlyphIndex(index);
    setModel(GLYPHS[index]!.drawing);
    setLineage([GLYPHS[index]!.drawing]);
    setScores([]);
    setGen(0);
  }

  function eventPoint(event: React.PointerEvent<HTMLCanvasElement>): Pt {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 320,
      y: ((event.clientY - rect.top) / rect.height) * 320,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (finished) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([eventPoint(event)]);
    setStrokeCount(strokesRef.current.length);
    drawScene(event.currentTarget, model, strokesRef.current, {
      bg: "#111827",
      model: "#6b7280",
      ink: "#818cf8",
    });
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || finished) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    if (!stroke) return;
    stroke.push(eventPoint(event));
    drawScene(event.currentTarget, model, strokesRef.current, {
      bg: "#111827",
      model: "#6b7280",
      ink: "#818cf8",
    });
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    setStrokeCount(strokesRef.current.length);
    drawScene(event.currentTarget, model, strokesRef.current, {
      bg: "#111827",
      model: "#6b7280",
      ink: "#818cf8",
    });
  }

  function finishCopy() {
    if (finished) return;
    const copy = strokesRef.current;
    if (copy.length === 0) return;
    const score = copyScore(model, copy);
    const nextScores = [...scores, score];
    const nextLineage = [...lineage, copy];
    setScores(nextScores);
    setLineage(nextLineage);
    strokesRef.current = [];
    setStrokeCount(0);
    if (gen + 1 >= GENERATIONS) {
      setGen(GENERATIONS);
      record.save(stabilityScore(nextLineage));
    } else {
      setGen(gen + 1);
      setModel(copy);
    }
  }

  function undoStroke() {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    const canvas = canvasRef.current;
    if (canvas)
      drawScene(canvas, model, strokesRef.current, {
        bg: "#111827",
        model: "#6b7280",
        ink: "#818cf8",
      });
  }

  return (
    <GameFrame
      id="copy-machine"
      title="Copy Machine"
      intro="Copy the faint doodle as exactly as you can — then your copy becomes the model. Five generations, then watch your hand drift."
    >
      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {GLYPHS.map((glyph, i) => (
            <Button
              key={glyph.name}
              variant={i === glyphIndex ? "default" : "outline"}
              onClick={() => resetTo(i)}
              aria-pressed={i === glyphIndex}
            >
              {glyph.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-3">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-xl border border-[var(--border)] max-w-full touch-none"
            style={{ width: 320, height: 320 }}
            role="img"
            aria-label={`Drawing canvas. Model is faint gray, your copy is indigo. Generation ${gen + 1} of ${GENERATIONS}.`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <p className="text-sm text-[var(--muted-foreground)]">
            {finished
              ? "Lineage complete."
              : `Draw over the faint model. Generation ${gen + 1} of ${GENERATIONS}. ${strokeCount === 0 ? "Draw it with a finger or the mouse." : "Stroke(s) ready."}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={undoStroke} disabled={finished || strokeCount === 0}>
            Undo stroke
          </Button>
          <Button onClick={finishCopy} disabled={finished || strokeCount === 0}>
            {gen >= GENERATIONS - 1 ? "Finish lineage" : "This is my copy"}
          </Button>
        </div>
      </Card>

      {scores.length > 0 && (
        <Card className="p-6 space-y-2">
          <h2 className="font-bold">Copy scores</h2>
          <ul className="space-y-1">
            {scores.map((score, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm">Copy {i + 1}</span>
                <span
                  className="h-3 rounded bg-[var(--primary)]"
                  style={{ width: `${Math.max(2, score)}%`, maxWidth: "60%" }}
                  aria-hidden="true"
                />
                <span className="text-sm">{score.toFixed(0)} / 100</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {finished && stability !== null && (
        <Card className="p-6 space-y-4 text-center">
          <h2 className="text-2xl font-bold">The drift film</h2>
          <div
            className="flex flex-wrap justify-center gap-2"
            aria-label="Lineage of model and copies"
          >
            {lineage.map((drawing, i) => (
              <figure key={i} className="text-center">
                <svg
                  viewBox="0 0 200 200"
                  width="104"
                  height="104"
                  className="rounded-lg bg-[var(--secondary)]"
                >
                  <title>{i === 0 ? "Model" : `Copy ${i}`}</title>
                  {toSvgPath(drawing).map((d, j) => (
                    <path
                      key={j}
                      d={d}
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <figcaption className="text-xs text-[var(--muted-foreground)]">
                  {i === 0 ? "model" : `copy ${i}`}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-xl font-bold" aria-live="polite">
            Stability score: {stability.toFixed(1)} / 100
          </p>
          <p className="text-sm text-[var(--muted-foreground)]">
            Stability is the average closeness of each copy to the one before it — a heuristic, not
            a vision test.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await downloadLineage(lineage, stability);
                } catch {
                  /* export unsupported — scores remain visible */
                }
              }}
            >
              Download lineage card
            </Button>
            <Button onClick={() => resetTo(glyphIndex)}>Copy again</Button>
          </div>
        </Card>
      )}

      <PersonalBest record={record} />

      <HowToBeat summary="How five clean generations score">
        <ExampleStep n={1}>
          Position and size are free: every drawing is centred and scaled to the same box before
          each stroke is resampled to 24 points, so only the <em>shape</em> is compared. Draw big
          and copy the silhouette — jitter is what the comparison punishes.
        </ExampleStep>
        <ExampleStep n={2}>
          A round scores 100 × (1 − distance / 0.45), where distance is the mean gap between the two
          normalised outlines. So 0.45 apart scores 0, and nothing in between is wasted: a square
          copied as a triangle still banks 67, and as a straight line 35.
        </ExampleStep>
        <ExampleResult>
          Your copy becomes the next generation&apos;s model, so the run score is the mean of the
          four comparisons — keep each one tight and the lineage stays near 100.
        </ExampleResult>
      </HowToBeat>
    </GameFrame>
  );
}
