export type LifeStat = {
  id: string;
  label: string;
  emoji: string;
  getValue: (ageMs: number) => number;
  format: (value: number) => string;
  category: string;
};

const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const SECONDS_PER_DAY = 24 * 60 * 60;

function daysFromMs(ageMs: number): number {
  return Math.max(0, ageMs / 1000 / SECONDS_PER_DAY);
}

function yearsFromMs(ageMs: number): number {
  return Math.max(0, ageMs / 1000 / SECONDS_PER_YEAR);
}

export const lifeStats: LifeStat[] = [
  {
    id: "heartbeats",
    label: "Heartbeats",
    emoji: "❤️",
    getValue: (ageMs) => {
      const minutes = Math.max(0, ageMs) / 1000 / 60;
      return Math.round(minutes * 72); // ~72 bpm avg
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "breaths",
    label: "Breaths Taken",
    emoji: "🫁",
    getValue: (ageMs) => {
      const minutes = Math.max(0, ageMs) / 1000 / 60;
      return Math.round(minutes * 16); // ~16 per minute
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "blinks",
    label: "Times You've Blinked",
    emoji: "👁️",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      const wakingHours = days * 16; // 16 waking hours
      return Math.round(wakingHours * 60 * 15); // 15 blinks per minute waking
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "sleep",
    label: "Days Asleep",
    emoji: "😴",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days * 0.33); // ~8h per day
    },
    format: (v) => `${v.toLocaleString()} days`,
    category: "body",
  },
  {
    id: "steps",
    label: "Steps Taken",
    emoji: "👟",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      // Babies don't walk first ~1 year, then ramp up
      const walkingDays = Math.max(0, days - 365);
      // First year of walking ~3000/day, then 7500 avg
      if (walkingDays < 365) {
        return Math.round(walkingDays * 3000);
      }
      return Math.round(365 * 3000 + (walkingDays - 365) * 7500);
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "meals",
    label: "Meals Eaten",
    emoji: "🍽️",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days * 3);
    },
    format: (v) => v.toLocaleString(),
    category: "life",
  },
  {
    id: "full-moons",
    label: "Full Moons Seen",
    emoji: "🌕",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days / 29.53); // lunar cycle
    },
    format: (v) => v.toLocaleString(),
    category: "world",
  },
  {
    id: "earth-distance",
    label: "Distance Earth Traveled Around Sun",
    emoji: "🌍",
    getValue: (ageMs) => {
      const years = yearsFromMs(ageMs);
      return Math.round(years * 940_000_000); // km per year
    },
    format: (v) => `${(v / 1_000_000_000).toFixed(1)} billion km`,
    category: "space",
  },
  {
    id: "earth-orbits",
    label: "Earth Orbits Around Sun",
    emoji: "🪐",
    getValue: (ageMs) => {
      const years = yearsFromMs(ageMs);
      return Math.round(years * 100) / 100;
    },
    format: (v) => v.toFixed(2),
    category: "space",
  },
  {
    id: "sunsets",
    label: "Sunsets Witnessed",
    emoji: "🌅",
    getValue: (ageMs) => {
      return Math.round(daysFromMs(ageMs));
    },
    format: (v) => v.toLocaleString(),
    category: "life",
  },
  {
    id: "words",
    label: "Words Spoken",
    emoji: "💬",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      // No words first year, then ramp: ~7000/day avg adult, less for child
      const speakingDays = Math.max(0, days - 365);
      if (speakingDays < 365 * 2) {
        // Toddler: ~1000/day
        return Math.round(speakingDays * 1000);
      }
      // Child to adult: 7000/day avg
      return Math.round(365 * 2 * 1000 + (speakingDays - 365 * 2) * 7000);
    },
    format: (v) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
      return v.toLocaleString();
    },
    category: "life",
  },
  {
    id: "laugh",
    label: "Times Laughed",
    emoji: "😄",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days * 17); // avg 17 times per day
    },
    format: (v) => v.toLocaleString(),
    category: "life",
  },
  {
    id: "hair",
    label: "Hair Grown (meters, net)",
    emoji: "💇",
    getValue: (ageMs) => {
      // ~0.44mm per day = 0.00044 m/day, minus haircuts ~50%
      const days = daysFromMs(ageMs);
      const gross = days * 0.00044;
      const net = gross * 0.5; // account for cuts
      return Math.round(net * 100) / 100;
    },
    format: (v) => `${v.toFixed(1)} m`,
    category: "body",
  },
  {
    id: "blood",
    label: "Blood Pumped (liters)",
    emoji: "🩸",
    getValue: (ageMs) => {
      const minutes = Math.max(0, ageMs) / 1000 / 60;
      return Math.round(minutes * 5); // ~5 L/min
    },
    format: (v) => {
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M liters`;
      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K liters`;
      return `${v.toLocaleString()} liters`;
    },
    category: "body",
  },
  {
    id: "jupiter-orbits",
    label: "Jupiter Orbits Completed",
    emoji: "♃",
    getValue: (ageMs) => {
      const years = yearsFromMs(ageMs);
      return Math.round((years / 11.86) * 1000) / 1000;
    },
    format: (v) => v.toFixed(3),
    category: "space",
  },
  {
    id: "milky-way",
    label: "Distance Around Milky Way",
    emoji: "🌌",
    getValue: (ageMs) => {
      const years = yearsFromMs(ageMs);
      return Math.round((years / 225_000_000) * 10000) / 10000;
    },
    format: (v) => `${(v * 100).toFixed(4)}% of one orbit`,
    category: "space",
  },
  {
    id: "mars-years",
    label: "Mars Years Lived",
    emoji: "🔴",
    getValue: (ageMs) => {
      const years = yearsFromMs(ageMs);
      return Math.round((years / 1.88) * 100) / 100;
    },
    format: (v) => `${v.toFixed(2)} Mars years`,
    category: "space",
  },
  {
    id: "moon-orbits",
    label: "Moon Orbits Around Earth",
    emoji: "🌙",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days / 27.3);
    },
    format: (v) => v.toLocaleString(),
    category: "space",
  },
  {
    id: "earth-rotations",
    label: "Earth Rotations Experienced",
    emoji: "🔄",
    getValue: (ageMs) => Math.round(daysFromMs(ageMs)),
    format: (v) => v.toLocaleString(),
    category: "world",
  },
  {
    id: "water-drunk",
    label: "Water Drunk (liters)",
    emoji: "💧",
    getValue: (ageMs) => {
      const days = daysFromMs(ageMs);
      return Math.round(days * 2);
    },
    format: (v) => {
      if (v >= 1000) return `${(v / 1000).toFixed(1)}K liters`;
      return `${v.toLocaleString()} liters`;
    },
    category: "body",
  },
];

export const statCategories = [
  { id: "body", name: "Body", emoji: "🫀" },
  { id: "life", name: "Life", emoji: "🌱" },
  { id: "world", name: "World", emoji: "🌍" },
  { id: "space", name: "Space", emoji: "🚀" },
];
