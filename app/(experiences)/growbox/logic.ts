export type ItemId = "soil" | "seeds" | "water" | "light" | "warmth" | "bees" | "shelf" | "vent";

export const ITEMS: { id: ItemId; name: string; blurb: string }[] = [
  { id: "soil", name: "Soil", blurb: "Fresh growing soil." },
  { id: "seeds", name: "Seeds", blurb: "A handful of seeds." },
  { id: "water", name: "Water", blurb: "A watering can." },
  { id: "light", name: "Light", blurb: "A grow lamp." },
  { id: "warmth", name: "Warmth", blurb: "A gentle heater." },
  { id: "bees", name: "Bees", blurb: "A busy little hive." },
  { id: "shelf", name: "Shelf", blurb: "A planting shelf." },
  { id: "vent", name: "Vent", blurb: "A circulating vent." },
];

export const MAX_LEVEL = 2;
export const PERFECT_TOTAL = ITEMS.length * MAX_LEVEL;

/**
 * Gains are timing-sensitive: "post" fires only when `when` is placed after `then`
 * already exists; "pre" fires only when `then` is placed while `when` already exists.
 * Order therefore decides which gains you keep.
 */
export type Effect = { then: ItemId; when: ItemId; mode: "pre" | "post"; text: string };

export const EFFECTS: Effect[] = [
  { then: "soil", when: "water", mode: "post", text: "Water makes the soil rich." },
  { then: "seeds", when: "light", mode: "post", text: "Light wakes the seeds." },
  { then: "water", when: "warmth", mode: "post", text: "Warmth keeps the water flowing." },
  { then: "light", when: "bees", mode: "post", text: "Bees keep the lamps clean." },
  { then: "warmth", when: "bees", mode: "post", text: "Bees keep the warmth buzzing." },
  { then: "bees", when: "shelf", mode: "post", text: "The shelf gives the bees a hive stand." },
  { then: "shelf", when: "vent", mode: "post", text: "The vent keeps the shelf dry." },
  { then: "vent", when: "warmth", mode: "pre", text: "Warm air feeds the vent." },
];

export type GrowboxState = {
  placed: ItemId[];
  levels: Record<ItemId, number>;
  fired: number[];
  log: string[];
};

export function emptyState(): GrowboxState {
  return {
    placed: [],
    levels: Object.fromEntries(ITEMS.map((i) => [i.id, 0])) as Record<ItemId, number>,
    fired: [],
    log: [],
  };
}

/** Pure, deterministic transition. Replaying `placed` in order always rebuilds the same state. */
export function applyPlacement(state: GrowboxState, id: ItemId): GrowboxState {
  if (state.placed.includes(id)) return state;
  const placed = [...state.placed, id];
  const levels = { ...state.levels, [id]: 1 };
  const fired = [...state.fired];
  const log = [...state.log, `Placed ${nameOf(id)}.`];
  for (const [index, effect] of EFFECTS.entries()) {
    if (fired.includes(index)) continue;
    const target = effect.then;
    // "pre" fires when the target itself is placed and its need already exists;
    // "post" fires when the need is placed while the target already exists.
    const trigger = effect.mode === "pre" ? id === target : id === effect.when;
    const ready =
      effect.mode === "pre" ? state.placed.includes(effect.when) : placed.includes(target);
    if (trigger && ready && levels[target] < MAX_LEVEL) {
      levels[target] = (levels[target] ?? 0) + 1;
      fired.push(index);
      log.push(`${effect.text} ${nameOf(target)} reaches level ${levels[target]}.`);
    }
  }
  return { placed, levels, fired, log };
}

export function totalLevels(state: GrowboxState): number {
  return ITEMS.reduce((sum, item) => sum + (state.levels[item.id] ?? 0), 0);
}

export function growboxScore(state: GrowboxState): number {
  return Math.round((100 * totalLevels(state)) / PERFECT_TOTAL);
}

export function isFinished(state: GrowboxState): boolean {
  return state.placed.length === ITEMS.length;
}

export function nameOf(id: ItemId): string {
  return ITEMS.find((i) => i.id === id)?.name ?? id;
}

/** Dev/test helper: best total over every placement order. */
export function bestTotalOverAllOrders(): { total: number; order: ItemId[] } {
  let best = { total: -1, order: [] as ItemId[] };
  const ids = ITEMS.map((i) => i.id);
  const permute = (rest: ItemId[], acc: ItemId[]) => {
    if (rest.length === 0) {
      let state = emptyState();
      for (const id of acc) state = applyPlacement(state, id);
      const total = totalLevels(state);
      if (total > best.total) best = { total, order: [...acc] };
      return;
    }
    for (const [i, id] of rest.entries()) {
      permute(
        rest.filter((_, j) => j !== i),
        [...acc, id]
      );
    }
  };
  permute(ids, []);
  return best;
}
