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

export const lifeStats: LifeStat[] = [
  {
    id: "heartbeats",
    label: "Heartbeats",
    emoji: "❤️",
    getValue: (ageMs) => {
      const minutes = ageMs / 1000 / 60;
      return Math.round(minutes * 72); // ~72 beats per minute
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "breaths",
    label: "Breaths Taken",
    emoji: "🫁",
    getValue: (ageMs) => {
      const minutes = ageMs / 1000 / 60;
      return Math.round(minutes * 16); // ~16 breaths per minute
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "blinks",
    label: "Times You've Blinked",
    emoji: "👁️",
    getValue: (ageMs) => {
      const wakingHours = (ageMs / 1000 / SECONDS_PER_DAY) * 16; // 16 waking hours
      return Math.round(wakingHours * 60 * 15); // 15 blinks per minute
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "sleep",
    label: "Days Asleep",
    emoji: "😴",
    getValue: (ageMs) => {
      const days = ageMs / 1000 / SECONDS_PER_DAY;
      return Math.round(days * 0.33); // ~8 hours per day
    },
    format: (v) => `${v.toLocaleString()} days`,
    category: "body",
  },
  {
    id: "steps",
    label: "Steps Taken",
    emoji: "👟",
    getValue: (ageMs) => {
      const days = ageMs / 1000 / SECONDS_PER_DAY;
      return Math.round(days * 7500); // avg 7500 steps per day
    },
    format: (v) => v.toLocaleString(),
    category: "body",
  },
  {
    id: "meals",
    label: "Meals Eaten",
    emoji: "🍽️",
    getValue: (ageMs) => {
      const days = ageMs / 1000 / SECONDS_PER_DAY;
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
      const days = ageMs / 1000 / SECONDS_PER_DAY;
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
      const years = ageMs / 1000 / SECONDS_PER_YEAR;
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
      const years = ageMs / 1000 / SECONDS_PER_YEAR;
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
      const days = ageMs / 1000 / SECONDS_PER_DAY;
      return Math.round(days);
    },
    format: (v) => v.toLocaleString(),
    category: "life",
  },
  {
    id: "words",
    label: "Words Spoken",
    emoji: "💬",
    getValue: (ageMs) => {
      const wakingHours = (ageMs / 1000 / SECONDS_PER_DAY) * 16;
      return Math.round(wakingHours * 2000); // ~2000 words per hour of talking
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
      const days = ageMs / 1000 / SECONDS_PER_DAY;
      return Math.round(days * 17); // avg 17 times per day
    },
    format: (v) => v.toLocaleString(),
    category: "life",
  },
  {
    id: "hair",
    label: "Hair Grown (meters)",
    emoji: "💇",
    getValue: (ageMs) => {
      // ~0.44mm per day = 0.00044 meters per day, minus haircuts
      const days = ageMs / 1000 / SECONDS_PER_DAY;
      return Math.round(days * 0.00044 * 100) / 100; // net ~half accounting for cuts
    },
    format: (v) => `${v.toFixed(1)} m`,
    category: "body",
  },
  {
    id: "blood",
    label: "Blood Pumped (liters)",
    emoji: "🩸",
    getValue: (ageMs) => {
      const minutes = ageMs / 1000 / 60;
      return Math.round(minutes * 5); // ~5 liters per minute
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
      const years = ageMs / 1000 / SECONDS_PER_YEAR;
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
      const years = ageMs / 1000 / SECONDS_PER_YEAR;
      // Sun orbits milky way every ~225 million years
      return Math.round((years / 225_000_000) * 10000) / 10000;
    },
    format: (v) => `${(v * 100).toFixed(4)}% of one orbit`,
    category: "space",
  },
];

export const statCategories = [
  { id: "body", name: "Body", emoji: "🫀" },
  { id: "life", name: "Life", emoji: "🌱" },
  { id: "world", name: "World", emoji: "🌍" },
  { id: "space", name: "Space", emoji: "🚀" },
];
