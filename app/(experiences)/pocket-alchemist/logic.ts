/** Twelve ingredients with hidden trait vectors. Mix any two: the result is the
 * named concept whose vector sits closest to the blend. No fixed recipe list exists —
 * every result comes from the geometry (inspired by Little Alchemy 2, not copying it). */

export type Vec = { x: number; y: number };
export type Ingredient = { id: string; name: string; vector: Vec; note: string };
export type Concept = { id: string; name: string; vector: Vec; blurb: string };

export const INGREDIENTS: Ingredient[] = [
  { id: "water", name: "Water", vector: { x: 0.85, y: -0.2 }, note: "Cool and fluid." },
  { id: "fire", name: "Fire", vector: { x: -0.75, y: 0.55 }, note: "Hot and rising." },
  { id: "earth", name: "Earth", vector: { x: 0.1, y: -0.9 }, note: "Heavy and still." },
  { id: "air", name: "Air", vector: { x: -0.2, y: 0.9 }, note: "Light and everywhere." },
  { id: "seed", name: "Seed", vector: { x: 0.7, y: -0.65 }, note: "Patient potential." },
  { id: "stone", name: "Stone", vector: { x: 0.35, y: -1 }, note: "Very patient." },
  { id: "sun", name: "Sun", vector: { x: -1, y: 0.45 }, note: "Generous and bright." },
  { id: "moon", name: "Moon", vector: { x: -0.85, y: -0.55 }, note: "Quiet pull." },
  { id: "metal", name: "Metal", vector: { x: 0.45, y: -0.8 }, note: "Cold strength." },
  { id: "smoke", name: "Smoke", vector: { x: -0.55, y: 0.7 }, note: "Memory of fire." },
  { id: "mud", name: "Mud", vector: { x: 0.65, y: -0.85 }, note: "Earth softened." },
  { id: "glass", name: "Glass", vector: { x: -0.35, y: -0.45 }, note: "Sand changed by heat." },
];

export const CONCEPTS: Concept[] = [
  { id: "puddle", name: "Puddle", vector: { x: 0.48, y: -0.55 }, blurb: "Water meeting earth." },
  { id: "steam", name: "Steam", vector: { x: 0.05, y: 0.18 }, blurb: "Water escaping upward." },
  { id: "magma", name: "Magma", vector: { x: -0.32, y: -0.18 }, blurb: "Stone remembering heat." },
  { id: "dust", name: "Dust", vector: { x: -0.05, y: 0.0 }, blurb: "Everything a little bit." },
  { id: "breeze", name: "Breeze", vector: { x: -0.2, y: 0.9 }, blurb: "Air in a hurry." },
  { id: "swamp", name: "Swamp", vector: { x: 0.38, y: -0.88 }, blurb: "Mud with ambitions." },
  { id: "sprout", name: "Sprout", vector: { x: 0.7, y: -0.65 }, blurb: "A seed taking the risk." },
  { id: "brick", name: "Brick", vector: { x: 0.28, y: -0.72 }, blurb: "Mud fired into order." },
  { id: "mirror", name: "Mirror", vector: { x: -0.28, y: -0.38 }, blurb: "Glass that looks back." },
  { id: "ember", name: "Ember", vector: { x: -0.65, y: 0.62 }, blurb: "Fire kept small." },
  {
    id: "moonlight",
    name: "Moonlight",
    vector: { x: -0.92, y: -0.05 },
    blurb: "Sun bounced off the moon.",
  },
  {
    id: "metal-glass",
    name: "Spectacles",
    vector: { x: 0.05, y: -0.62 },
    blurb: "Glass and metal, helping you see.",
  },
  { id: "clay", name: "Clay", vector: { x: 0.68, y: -0.78 }, blurb: "Earth ready to be shaped." },
  { id: "fog", name: "Fog", vector: { x: 0.32, y: 0.35 }, blurb: "Water pretending to be air." },
  {
    id: "sunbeam",
    name: "Sunbeam",
    vector: { x: -0.6, y: 0.68 },
    blurb: "Sunlight with direction.",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    vector: { x: -0.22, y: -0.62 },
    blurb: "Fire cooled too fast.",
  },
  {
    id: "gunpowder",
    name: "Firecracker",
    vector: { x: -0.4, y: -0.12 },
    blurb: "Stone and fire, briefly.",
  },
  {
    id: "telescope",
    name: "Telescope",
    vector: { x: -0.5, y: -0.55 },
    blurb: "Spectacles for the sky.",
  },
  { id: "nest", name: "Nest", vector: { x: 0.62, y: -0.72 }, blurb: "Sprouts woven together." },
  { id: "well", name: "Well", vector: { x: 0.45, y: -0.75 }, blurb: "Water, carefully asked for." },
  {
    id: "sunset",
    name: "Sunset",
    vector: { x: -0.88, y: 0.1 },
    blurb: "Sun and moon on speaking terms.",
  },
  { id: "rust", name: "Rust", vector: { x: 0.55, y: -0.62 }, blurb: "Metal and water, slowly." },
  {
    id: "glasshouse",
    name: "Glasshouse",
    vector: { x: 0.15, y: -0.55 },
    blurb: "Glass keeping sprouts warm.",
  },
  { id: "kite", name: "Kite", vector: { x: -0.05, y: 0.55 }, blurb: "Air, briefly held." },
];

export function blend(a: Vec, b: Vec): Vec {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function distance(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mix(ingA: Ingredient, ingB: Ingredient): Concept {
  const target = blend(ingA.vector, ingB.vector);
  let best = CONCEPTS[0]!;
  let bestDist = Infinity;
  for (const concept of CONCEPTS) {
    const d = distance(target, concept.vector);
    if (d < bestDist) {
      bestDist = d;
      best = concept;
    }
  }
  return best;
}

export function discoveryScore(discovered: number): number {
  return Math.max(0, Math.min(100, Math.round((discovered / 12) * 100)));
}
