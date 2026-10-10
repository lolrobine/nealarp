export type SpaceObject = {
  name: string;
  size: number; // in meters
  emoji: string;
  category: string;
  description: string;
};

// Sizes in meters (diameter or characteristic length)
export const spaceObjects: SpaceObject[] = [
  // Everyday objects for scale
  { name: "Human", size: 1.7, emoji: "🧍", category: "earth", description: "Average human height" },
  { name: "Blue Whale", size: 30, emoji: "🐋", category: "earth", description: "Largest animal on Earth" },
  { name: "Statue of Liberty", size: 93, emoji: "🗽", category: "earth", description: "Ground to torch" },
  { name: "Big Ben", size: 96, emoji: "🕰️", category: "earth", description: "Clock tower in London" },
  { name: "Eiffel Tower", size: 330, emoji: "🗼", category: "earth", description: "Iconic Paris landmark" },

  // Earth features
  { name: "International Space Station", size: 109, emoji: "🛰️", category: "earth", description: "Largest human-made object in space" },
  { name: "Mount Everest", size: 8849, emoji: "🏔️", category: "earth", description: "Tallest mountain on Earth" },
  { name: "Moon", size: 3_474_000, emoji: "🌙", category: "solar", description: "Earth's only natural satellite" },
  { name: "Earth", size: 12_742_000, emoji: "🌍", category: "solar", description: "Our home planet" },

  // Solar system
  { name: "Jupiter", size: 139_820_000, emoji: "🪐", category: "solar", description: "Largest planet in our solar system" },
  { name: "Sun", size: 1_392_700_000, emoji: "☀️", category: "solar", description: "Our star" },

  // Stars
  { name: "Proxima Centauri", size: 200_000_000, emoji: "⭐", category: "stars", description: "Nearest star to the Sun" },
  { name: "Betelgeuse", size: 1_235_000_000_000, emoji: "🌟", category: "stars", description: "Red supergiant, 700x the Sun's radius" },
  { name: "UY Scuti", size: 3_430_000_000_000, emoji: "💫", category: "stars", description: "One of the largest known stars" },

  // Solar system distances (for scale)
  { name: "Distance to Moon", size: 384_400_000, emoji: "🚀", category: "distances", description: "Average distance from Earth" },
  { name: "Distance to Sun", size: 149_600_000_000, emoji: "🌞", category: "distances", description: "1 Astronomical Unit (AU)" },
  { name: "Distance to Jupiter", size: 778_500_000_000, emoji: "🪐", category: "distances", description: "When closest to Earth" },
  { name: "Distance to Pluto", size: 5_900_000_000_000, emoji: "🔭", category: "distances", description: "At closest approach" },
  { name: "Distance to Proxima Centauri", size: 40_141_000_000_000_000, emoji: "✨", category: "distances", description: "4.24 light-years" },

  // Galaxies and beyond
  { name: "Solar System (diameter)", size: 9_000_000_000_000_000, emoji: "🌌", category: "galaxies", description: "Out to the Oort Cloud" },
  { name: "Milky Way Galaxy", size: 946_073_047_258_080_000, emoji: "🌀", category: "galaxies", description: "100,000 light-years across" },
  { name: "Andromeda Galaxy", size: 200_000 * 9.46e15, emoji: "🌠", category: "galaxies", description: "220,000 light-years across" },
  { name: "Observable Universe", size: 8.8e26, emoji: "🔮", category: "galaxies", description: "93 billion light-years in diameter" },
];

export const categories = [
  { id: "earth", name: "Earth Scale", emoji: "🌍" },
  { id: "solar", name: "Solar System", emoji: "☀️" },
  { id: "stars", name: "Stars", emoji: "⭐" },
  { id: "distances", name: "Distances", emoji: "🚀" },
  { id: "galaxies", name: "Galaxies & Beyond", emoji: "🌌" },
];

export function formatSize(size: number): string {
  if (size < 1000) return `${size.toFixed(1)} m`;
  if (size < 1_000_000) return `${(size / 1000).toFixed(1)} km`;
  if (size < 1_000_000_000) return `${(size / 1_000_000).toFixed(1)}M km`;
  if (size < 1_000_000_000_000) return `${(size / 1_000_000_000).toFixed(1)}B km`;
  if (size < 9.46e15) return `${(size / 1_000_000_000_000).toFixed(1)}T km`;

  // Convert to light-years
  const lightYears = size / 9.46e15;
  if (lightYears < 1000) return `${lightYears.toFixed(1)} light-years`;
  if (lightYears < 1_000_000) return `${(lightYears / 1000).toFixed(1)}K light-years`;
  if (lightYears < 1_000_000_000) return `${(lightYears / 1_000_000).toFixed(1)}M light-years`;
  return `${(lightYears / 1_000_000_000).toFixed(1)}B light-years`;
}
