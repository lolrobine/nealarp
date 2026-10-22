export type SpaceObject = {
  name: string;
  size: number; // in meters
  category: string;
  description: string;
  /** Path to a picture of this object. Every one of these is AI-generated
   *  imagery, not a photograph — see public/experiences/size-of-space/objects/
   *  README.md. Objects without a picture fall back to a drawn disc. */
  image?: string;
};

// Sizes in meters (diameter or characteristic length)
export const spaceObjects: SpaceObject[] = [
  // Everyday objects for scale
  {
    name: "Human",
    size: 1.7,
    category: "earth",
    description: "Average human height",
    image: "/experiences/size-of-space/objects/human.jpg",
  },
  {
    name: "Blue Whale",
    size: 30,
    category: "earth",
    description: "Largest animal on Earth",
    image: "/experiences/size-of-space/objects/blue-whale.jpg",
  },
  {
    name: "Statue of Liberty",
    size: 93,
    category: "earth",
    description: "Ground to torch",
    image: "/experiences/size-of-space/objects/statue-of-liberty.jpg",
  },
  {
    name: "Big Ben",
    size: 96,
    category: "earth",
    description: "Clock tower in London",
    image: "/experiences/size-of-space/objects/big-ben.jpg",
  },
  {
    name: "Eiffel Tower",
    size: 330,
    category: "earth",
    description: "Iconic Paris landmark",
    image: "/experiences/size-of-space/objects/eiffel-tower.jpg",
  },

  // Earth features
  {
    name: "International Space Station",
    size: 109,
    category: "earth",
    description: "Largest human-made object in space",
    image: "/experiences/size-of-space/objects/iss.jpg",
  },
  {
    name: "Mount Everest",
    size: 8849,
    category: "earth",
    description: "Tallest mountain on Earth",
    image: "/experiences/size-of-space/objects/mount-everest.jpg",
  },
  {
    name: "Moon",
    size: 3_474_000,
    category: "solar",
    description: "Earth's only natural satellite",
    image: "/experiences/size-of-space/objects/moon.jpg",
  },
  {
    name: "Earth",
    size: 12_742_000,
    category: "solar",
    description: "Our home planet",
    image: "/experiences/size-of-space/objects/earth.jpg",
  },

  // Solar system
  {
    name: "Jupiter",
    size: 139_820_000,
    category: "solar",
    description: "Largest planet in our solar system",
    image: "/experiences/size-of-space/objects/jupiter.jpg",
  },
  {
    name: "Sun",
    size: 1_392_700_000,
    category: "solar",
    description: "Our star",
    image: "/experiences/size-of-space/objects/sun.jpg",
  },

  // Stars
  {
    name: "Proxima Centauri",
    size: 200_000_000,
    category: "stars",
    description: "Nearest star to the Sun",
    image: "/experiences/size-of-space/objects/proxima-centauri.jpg",
  },
  {
    name: "Betelgeuse",
    size: 1_235_000_000_000,
    category: "stars",
    description: "Red supergiant, 700x the Sun's radius",
    image: "/experiences/size-of-space/objects/betelgeuse.jpg",
  },
  {
    name: "UY Scuti",
    size: 3_430_000_000_000,
    category: "stars",
    description: "One of the largest known stars",
    image: "/experiences/size-of-space/objects/uy-scuti.jpg",
  },

  // Solar system distances (for scale)
  {
    name: "Distance to Moon",
    size: 384_400_000,
    category: "distances",
    description: "Average distance from Earth",
    image: "/experiences/size-of-space/objects/distance-moon.jpg",
  },
  {
    name: "Distance to Sun",
    size: 149_600_000_000,
    category: "distances",
    description: "1 Astronomical Unit (AU)",
    image: "/experiences/size-of-space/objects/distance-sun.jpg",
  },
  {
    name: "Distance to Jupiter",
    size: 778_500_000_000,
    category: "distances",
    description: "When closest to Earth",
    image: "/experiences/size-of-space/objects/distance-jupiter.jpg",
  },
  {
    name: "Distance to Pluto",
    size: 5_900_000_000_000,
    category: "distances",
    description: "At closest approach",
    image: "/experiences/size-of-space/objects/distance-pluto.jpg",
  },
  {
    name: "Distance to Proxima Centauri",
    size: 40_141_000_000_000_000,
    category: "distances",
    description: "4.24 light-years",
    image: "/experiences/size-of-space/objects/distance-proxima.jpg",
  },

  // Galaxies and beyond
  {
    name: "Solar System (diameter)",
    size: 9_000_000_000_000_000,
    category: "galaxies",
    description: "Out to the Oort Cloud",
    image: "/experiences/size-of-space/objects/solar-system.jpg",
  },
  {
    name: "Milky Way Galaxy",
    size: 946_073_047_258_080_000,
    category: "galaxies",
    description: "100,000 light-years across",
    image: "/experiences/size-of-space/objects/milky-way.jpg",
  },
  {
    name: "Andromeda Galaxy",
    size: 200_000 * 9.46e15,
    category: "galaxies",
    description: "220,000 light-years across",
    image: "/experiences/size-of-space/objects/andromeda.jpg",
  },
  {
    name: "Observable Universe",
    size: 8.8e26,
    category: "galaxies",
    description: "93 billion light-years in diameter",
    image: "/experiences/size-of-space/objects/observable-universe.jpg",
  },
];

export const categories = [
  { id: "earth", name: "Earth Scale" },
  { id: "solar", name: "Solar System" },
  { id: "stars", name: "Stars" },
  { id: "distances", name: "Distances" },
  { id: "galaxies", name: "Galaxies & Beyond" },
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
