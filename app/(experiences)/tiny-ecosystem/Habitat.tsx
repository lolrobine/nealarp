"use client";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Button } from "@/lib/components/ui/button";
import { getAssetUrl } from "@/lib/utils/assets";
import type { Ecosystem } from "./logic";
import styles from "./Habitat.module.css";
export type HabitatKind = "plant" | "bush" | "rabbit" | "fox";
const TOOLS = [
  { kind: "plant", label: "Plant", population: "plants", amount: 10 },
  { kind: "bush", label: "Bush", population: "plants", amount: 10 },
  { kind: "rabbit", label: "Rabbit", population: "herbivores", amount: 1 },
  { kind: "fox", label: "Fox", population: "predators", amount: 1 },
] as const;
export function habitatTool(kind: HabitatKind) {
  return TOOLS.find((tool) => tool.kind === kind)!;
}
type Placement = { kind: HabitatKind; index: number; x: number; y: number };
type Drag = { kind: HabitatKind; x: number; y: number; startX: number; startY: number };
function Species({ kind }: { kind: HabitatKind }) {
  if (kind === "rabbit" || kind === "fox")
    return (
      <image
        href={getAssetUrl(`/experiences/tiny-ecosystem/${kind}.webp`)}
        x={kind === "fox" ? -38 : -27}
        y={kind === "fox" ? -43 : -39}
        width={kind === "fox" ? 76 : 54}
        height="44"
        preserveAspectRatio="xMidYMax meet"
      />
    );
  if (kind === "bush")
    return (
      <g>
        <ellipse cy="1" rx="29" ry="5" fill="#122d17" opacity=".3" />
        <path d="M-19 0L-10-25 0-7 12-31 21 0" stroke="#73583a" strokeWidth="3" />
        {[-17, -5, 12, 23].map((x, i) => (
          <g key={x}>
            <ellipse
              cx={x}
              cy={-12 - (i % 2) * 7}
              rx="13"
              ry="14"
              fill={i % 2 ? "#466c35" : "#6c8c43"}
            />
            <path
              d={`M${x - 5} ${-17 - (i % 2) * 7}q4-8 10-3`}
              fill="none"
              stroke="#a6b86a"
              strokeWidth="2"
              opacity=".6"
            />
          </g>
        ))}
        <circle cx="5" cy="-20" r="2" fill="#d68d65" />
        <circle cx="15" cy="-13" r="2" fill="#d68d65" />
      </g>
    );
  return (
    <g>
      <ellipse cy="2" rx="15" ry="3" fill="#15391d" opacity=".4" />
      <path
        d="M0 0Q-2-16 2-32M0-14Q-17-14-20-27Q-5-31 0-14M1-22Q20-24 20-39Q3-39 1-22"
        fill="#78994c"
        stroke="#436635"
        strokeWidth="1.5"
      />
      <path d="M-17-26L0-14M3-24L16-36" stroke="#c0cd87" strokeWidth="1" />
    </g>
  );
}
export function Habitat({
  state,
  disabled,
  onIntroduce,
}: {
  state: Ecosystem;
  disabled: boolean;
  onIntroduce: (kind: HabitatKind) => boolean;
}) {
  const world = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<HabitatKind>("plant");
  const [drag, setDrag] = useState<Drag | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState("");
  function place(kind: HabitatKind, x: number, y: number) {
    if (disabled) return;
    if (
      y < 155 ||
      y > 325 ||
      x < 20 ||
      x > 580 ||
      ((x - 500) / 80) ** 2 + ((y - 292) / 23) ** 2 < 1
    ) {
      setFeedback("Drop on dry grass, not in the sky or pond. No action spent.");
      return;
    }
    if (!onIntroduce(kind)) return;
    const tool = habitatTool(kind),
      index =
        tool.population === "plants"
          ? Math.ceil(state.plants / 10)
          : Math.ceil(state[tool.population]);
    setPlacements((p) => [...p, { kind, index, x, y }].slice(-80));
    setFeedback(`${tool.label} placed in your world.`);
  }
  function finish(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const rect = world.current?.getBoundingClientRect();
    if (rect && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      )
        place(
          drag.kind,
          ((event.clientX - rect.left) / rect.width) * 600,
          ((event.clientY - rect.top) / rect.height) * 340
        );
      else setFeedback("Drop inside the habitat. No action spent.");
    }
    setDrag(null);
  }
  const sprites: Placement[] = [];
  for (const [population, kind, count] of [
    ["plants", "plant", Math.ceil(state.plants / 10)],
    ["herbivores", "rabbit", Math.ceil(state.herbivores)],
    ["predators", "fox", Math.ceil(state.predators)],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const placed = placements.findLast(
        (p) => habitatTool(p.kind).population === population && p.index === i
      );
      const x = 40 + ((i * 89 + (kind === "fox" ? 150 : kind === "rabbit" ? 35 : 0)) % 510);
      let y = 185 + ((i * 43 + (kind === "fox" ? 45 : 0)) % 120);
      if (x > 425 && y > 264) y -= 45;
      sprites.push(
        placed ?? { kind: kind === "plant" && i % 3 === 0 ? "bush" : kind, index: i, x, y }
      );
    }
  }
  sprites.sort((a, b) => a.y - b.y);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Habitat species tray">
        {TOOLS.map((tool) => (
          <button
            key={tool.kind}
            type="button"
            disabled={disabled}
            aria-label={`Drag ${tool.label.toLowerCase()} into habitat`}
            aria-pressed={selected === tool.kind}
            className={`touch-none select-none rounded-xl border p-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--ring)] disabled:opacity-40 ${selected === tool.kind ? "border-emerald-500 bg-emerald-500/10" : "bg-[var(--secondary)]"}`}
            onClick={() => setSelected(tool.kind)}
            onPointerDown={(e) => {
              if (disabled || e.button !== 0) return;
              e.preventDefault();
              e.currentTarget.focus();
              e.currentTarget.setPointerCapture(e.pointerId);
              setSelected(tool.kind);
              setDrag({
                kind: tool.kind,
                x: e.clientX,
                y: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
              });
            }}
            onPointerMove={(e) => {
              if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY });
            }}
            onPointerUp={finish}
            onPointerCancel={() => setDrag(null)}
          >
            <svg
              viewBox="0 0 100 60"
              className="mx-auto h-16 w-24 pointer-events-none"
              aria-hidden="true"
            >
              <g transform="translate(50 54)">
                <Species kind={tool.kind} />
              </g>
            </svg>
            <strong>{tool.label}</strong>
            <span className="ml-1 text-xs">
              +{tool.amount} {tool.population === "plants" ? "plants" : "animal"}
            </span>
          </button>
        ))}
      </div>
      <p className="text-sm">
        Drag a plant, bush, rabbit or fox onto the grass. Each successful drop costs one
        intervention. On a keyboard or without dragging, select a species above and use “Place
        selected in habitat”. Positions and movement are decorative; population totals drive the
        turn model.
      </p>
      <div
        ref={world}
        className={styles.world}
        data-paused={paused}
        role="region"
        aria-label="Living habitat"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const kind = e.dataTransfer.getData("application/x-nealarp-species");
          if (!TOOLS.some((t) => t.kind === kind)) return;
          const rect = e.currentTarget.getBoundingClientRect();
          place(
            kind as HabitatKind,
            ((e.clientX - rect.left) / rect.width) * 600,
            ((e.clientY - rect.top) / rect.height) * 340
          );
        }}
      >
        <svg
          viewBox="0 0 600 340"
          className="block w-full"
          role="img"
          aria-label={`Living world, round ${state.round}: ${Math.ceil(state.plants)} plants, ${Math.ceil(state.herbivores)} rabbits and ${Math.ceil(state.predators)} foxes`}
        >
          <defs>
            <linearGradient id="habitat-sky" x2="0" y2="1">
              <stop stopColor="#a5c8c7" />
              <stop offset="1" stopColor="#e6d4a9" />
            </linearGradient>
            <linearGradient id="habitat-grass" x2=".3" y2="1">
              <stop stopColor="#71875a" />
              <stop offset="1" stopColor="#304e34" />
            </linearGradient>
            <linearGradient id="habitat-pond" x2="0" y2="1">
              <stop stopColor="#b3d9d7" />
              <stop offset="1" stopColor="#477d83" />
            </linearGradient>
          </defs>
          <path d="M0 0H600V340H0Z" fill="url(#habitat-sky)" />
          <circle cx="490" cy="58" r="26" fill="#f5e1ac" opacity=".9" />
          <path d="M0 145Q100 90 230 140T600 120V340H0Z" fill="#536e57" />
          <path d="M0 170Q150 130 330 170T600 145V340H0Z" fill="url(#habitat-grass)" />
          {Array.from({ length: 18 }, (_, i) => (
            <g key={`tree${i}`} opacity=".35">
              <path d={`M${i * 37} 172v-65`} stroke="#354d40" strokeWidth="6" />
              <ellipse cx={i * 37} cy={110 - (i % 3) * 8} rx="24" ry="38" fill="#365a49" />
            </g>
          ))}
          <ellipse cx="500" cy="294" rx="84" ry="26" fill="#a6ab82" />
          <ellipse cx="500" cy="292" rx="80" ry="23" fill="url(#habitat-pond)" />
          <path d="M450 290q30-7 70-1m-50 12q25-5 49-1" stroke="#c2dcd0" opacity=".5" fill="none" />
          {Array.from({ length: 65 }, (_, i) => (
            <path
              key={`grass${i}`}
              d={`M${12 + ((i * 47) % 570)} ${178 + ((i * 31) % 145)}l-3-7m3 7 4-9`}
              stroke={i % 2 ? "#8fa36b" : "#a8b47e"}
              opacity=".35"
              fill="none"
            />
          ))}
          {sprites.map((sprite) => (
            <g
              key={`${habitatTool(sprite.kind).population}-${sprite.index}`}
              data-species={sprite.kind}
              transform={`translate(${sprite.x} ${sprite.y})`}
            >
              <g
                className={
                  sprite.kind === "plant" || sprite.kind === "bush" ? styles.sway : styles.wander
                }
                style={
                  {
                    "--dx": `${sprite.index % 2 ? 18 : -16}px`,
                    "--pace": `${9 + (sprite.index % 7)}s`,
                    "--delay": `${-sprite.index * 1.7}s`,
                  } as CSSProperties
                }
              >
                <g
                  className={
                    sprite.kind === "rabbit" || sprite.kind === "fox" ? styles.breathe : undefined
                  }
                >
                  <g transform={sprite.index % 2 ? "scale(-1 1)" : undefined}>
                    <Species kind={sprite.kind} />
                  </g>
                </g>
              </g>
            </g>
          ))}
          <text x="20" y="30" fill="#1e3b35" fontSize="12" letterSpacing="2">
            YOUR LIVING WORLD · ROUND {state.round}
          </text>
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="secondary" disabled={disabled} onClick={() => place(selected, 300, 250)}>
          Place selected in habitat
        </Button>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />
          Pause world movement
        </label>
      </div>
      <p aria-live="polite" className="text-sm">
        {feedback}
      </p>
      {drag && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] rounded-xl border bg-[var(--card)]/90 p-1 shadow-xl"
          style={{ left: drag.x, top: drag.y, transform: "translate(-50%,-50%)" }}
        >
          <svg width="100" height="65" viewBox="0 0 100 65">
            <g transform="translate(50 58)">
              <Species kind={drag.kind} />
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
