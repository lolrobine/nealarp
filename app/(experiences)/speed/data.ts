export type SpeedItem = {
  name: string;
  speed: number; // km/h
  emoji: string;
  category: string;
  funFact?: string;
};

export const speedItems: SpeedItem[] = [
  // Animals
  {
    name: "Sloth",
    speed: 0.27,
    emoji: "🦥",
    category: "animals",
    funFact: "Sloths are so slow, algae grows on them",
  },
  { name: "Snail", speed: 0.05, emoji: "🐌", category: "animals" },
  { name: "Human (walking)", speed: 5, emoji: "🚶", category: "animals" },
  {
    name: "Human (running)",
    speed: 24,
    emoji: "🏃",
    category: "animals",
    funFact: "Usain Bolt's top speed was 44.72 km/h",
  },
  { name: "Cat", speed: 48, emoji: "🐱", category: "animals" },
  { name: "Horse", speed: 70, emoji: "🐴", category: "animals" },
  { name: "Dolphin", speed: 60, emoji: "🐬", category: "animals" },
  {
    name: "Cheetah",
    speed: 120,
    emoji: "🐆",
    category: "animals",
    funFact: "Can accelerate from 0 to 100 km/h in 3 seconds",
  },
  {
    name: "Peregrine Falcon (diving)",
    speed: 390,
    emoji: "🦅",
    category: "animals",
    funFact: "Fastest animal on Earth",
  },

  // Vehicles
  { name: "Bicycle", speed: 25, emoji: "🚴", category: "vehicles" },
  { name: "Car (highway)", speed: 120, emoji: "🚗", category: "vehicles" },
  {
    name: "Sports Car",
    speed: 330,
    emoji: "🏎️",
    category: "vehicles",
    funFact: "Bugatti Chiron tops out at 420 km/h",
  },
  { name: "High-Speed Train", speed: 320, emoji: "🚄", category: "vehicles" },
  { name: "Commercial Jet", speed: 900, emoji: "✈️", category: "vehicles" },
  { name: "Fighter Jet", speed: 2500, emoji: "🛩️", category: "vehicles" },
  { name: "Formula 1 Car", speed: 370, emoji: "🏁", category: "vehicles" },

  // Technology
  {
    name: "Internet (fiber optic)",
    speed: 720_000_000,
    emoji: "🌐",
    category: "tech",
    funFact: "Light in fiber is ~200,000 km/s, ~2/3 speed in vacuum",
  },
  {
    name: "Sound (in air)",
    speed: 1235,
    emoji: "🔊",
    category: "tech",
    funFact: "343 m/s at 20°C",
  },
  { name: "Bullet", speed: 3500, emoji: "🎯", category: "tech", funFact: "~972 m/s for rifle" },
  {
    name: "Rocket (escape velocity)",
    speed: 40270,
    emoji: "🚀",
    category: "tech",
    funFact: "11.2 km/s to escape Earth",
  },
  {
    name: "ISS",
    speed: 27600,
    emoji: "🛰️",
    category: "tech",
    funFact: "Orbits Earth every 90 minutes",
  },

  // Nature
  { name: "Wind (hurricane)", speed: 250, emoji: "🌪️", category: "nature" },
  { name: "Tsunami", speed: 800, emoji: "🌊", category: "nature" },
  {
    name: "Lightning (return stroke)",
    speed: 360_000_000,
    emoji: "⚡",
    category: "nature",
    funFact: "Return stroke ~100,000 km/s",
  },
  {
    name: "Earth (orbiting Sun)",
    speed: 107000,
    emoji: "🌍",
    category: "nature",
    funFact: "We're moving this fast right now!",
  },
  {
    name: "Light (vacuum)",
    speed: 1079252849,
    emoji: "💡",
    category: "nature",
    funFact: "299,792 km/s - the cosmic speed limit!",
  },
];

export const categories = [
  { id: "animals", name: "Animals", emoji: "🐾" },
  { id: "vehicles", name: "Vehicles", emoji: "🚗" },
  { id: "tech", name: "Technology", emoji: "⚙️" },
  { id: "nature", name: "Nature", emoji: "🌍" },
];

export type SpeedUnit = "kmh" | "mph" | "ms";

const CONVERSION: Record<SpeedUnit, number> = {
  kmh: 1,
  mph: 0.621371,
  ms: 0.277778,
};

const UNIT_LABEL: Record<SpeedUnit, string> = {
  kmh: "km/h",
  mph: "mph",
  ms: "m/s",
};

export function convertSpeed(speedKmh: number, unit: SpeedUnit): number {
  return speedKmh * CONVERSION[unit];
}

export function formatSpeed(speedKmh: number, unit: SpeedUnit = "kmh"): string {
  const converted = convertSpeed(speedKmh, unit);
  const label = UNIT_LABEL[unit];
  if (converted >= 1_000_000) {
    return `${(converted / 1_000_000).toFixed(1)}M ${label}`;
  }
  if (converted >= 1000) {
    return `${(converted / 1000).toFixed(1)}K ${label}`;
  }
  if (unit === "ms" && converted < 1) {
    return `${converted.toFixed(2)} ${label}`;
  }
  return `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${label}`;
}
