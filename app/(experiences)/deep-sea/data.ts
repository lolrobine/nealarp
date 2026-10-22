export type Creature = {
  name: string;
  depth: number; // meters below sea level
  description: string;
  funFact?: string;
};

export const SEA_LEVEL = 0;
export const MAX_DEPTH = 11034; // Challenger Deep, Mariana Trench

export const zones = [
  { name: "Sunlight Zone", minDepth: 0, maxDepth: 200, color: "#0ea5e9" },
  { name: "Twilight Zone", minDepth: 200, maxDepth: 1000, color: "#1e40af" },
  { name: "Midnight Zone", minDepth: 1000, maxDepth: 4000, color: "#1e1b4b" },
  { name: "Abyssal Zone", minDepth: 4000, maxDepth: 6000, color: "#0c0a09" },
  { name: "Hadal Zone", minDepth: 6000, maxDepth: 11034, color: "#000000" },
];

export const creatures: Creature[] = [
  {
    name: "Dolphin",
    depth: 10,
    description: "Intelligent marine mammals known for their playful behavior",
    funFact: "Dolphins sleep with one eye open!",
  },
  {
    name: "Sea Turtle",
    depth: 30,
    description: "Ancient reptiles that have roamed the oceans for 100 million years",
    funFact: "Sea turtles can hold their breath for up to 7 hours",
  },
  {
    name: "Clownfish",
    depth: 15,
    description: "Bright orange fish that live in symbiosis with sea anemones",
    funFact: "All clownfish are born male and can change to female",
  },
  {
    name: "Great White Shark",
    depth: 50,
    description: "Apex predator of the ocean, capable of detecting tiny electrical fields",
    funFact: "Great whites can leap entirely out of the water when hunting",
  },
  {
    name: "Octopus",
    depth: 150,
    description: "Highly intelligent creatures with three hearts and blue blood",
    funFact: "Octopuses have nine brains - one central and one in each arm",
  },
  {
    name: "Swordfish",
    depth: 200,
    description: "Fast swimmers with elongated bills that can reach 4 meters",
    funFact: "Swordfish can swim at speeds up to 100 km/h",
  },
  {
    name: "Giant Squid",
    depth: 300,
    description: "Mysterious deep-sea creature with eyes the size of dinner plates",
    funFact: "Giant squid have the largest eyes in the animal kingdom",
  },
  {
    name: "Anglerfish",
    depth: 1000,
    description: "Deep-sea predator with a bioluminescent lure to attract prey",
    funFact: "Male anglerfish fuse permanently to females, becoming parasitic",
  },
  {
    name: "Vampire Squid",
    depth: 900,
    description: "Despite the name, it feeds on marine snow, not blood",
    funFact: "It turns inside out to display spiny webbing when threatened",
  },
  {
    name: "Goblin Shark",
    depth: 1200,
    description: "Rare deep-sea shark with a protruding jaw that snaps forward",
    funFact: "Its jaw can extend out to capture prey like a slingshot",
  },
  {
    name: "Barreleye Fish",
    depth: 600,
    description: "Transparent-headed fish with tubular eyes that look upward",
    funFact: "You can see its brain through its transparent head",
  },
  {
    name: "Frilled Shark",
    depth: 1500,
    description: "Living fossil with 300 trident-shaped teeth",
    funFact: "Has remained virtually unchanged for 80 million years",
  },
  {
    name: "Giant Tube Worm",
    depth: 2000,
    description: "Can grow up to 2 meters tall near hydrothermal vents",
    funFact: "They have no mouth, stomach, or eyes - they absorb nutrients through their skin",
  },
  {
    name: "Dumbo Octopus",
    depth: 3000,
    description: "Named for ear-like fins that resemble Disney's Dumbo",
    funFact: "The deepest living octopus, found at depths over 7,000m",
  },
  {
    name: "BLOBFISH",
    depth: 1200,
    description: "Looks like a gelatinous blob when out of water",
    funFact: "At depth, it looks like a normal fish - it only 'melts' at surface pressure",
  },
  {
    name: "Sea Cucumber",
    depth: 4000,
    description: "Soft-bodied echinoderms that clean the ocean floor",
    funFact: "They breathe through their anus",
  },
  {
    name: "Amphipod",
    depth: 7000,
    description: "Tiny crustaceans found in the deepest ocean trenches",
    funFact: "Some species have survived pressures 1,100 times atmospheric pressure",
  },
  {
    name: "Snailfish",
    depth: 8000,
    description: "The deepest-living fish ever recorded",
    funFact: "Its body is mostly transparent and gelatinous",
  },
  {
    name: "Xenophyophore",
    depth: 10000,
    description: "Giant single-celled organisms up to 20cm across",
    funFact: "Despite being single-celled, they can be as big as your hand",
  },
  {
    name: "Mariana Trench Life",
    depth: 11034,
    description: "Life exists even at the deepest point on Earth",
    funFact: "Microorganisms thrive under crushing pressure and total darkness",
  },
];

// Sort creatures by depth
export const sortedCreatures = [...creatures].sort((a, b) => a.depth - b.depth);

export function getZone(depth: number) {
  return zones.find((z) => depth >= z.minDepth && depth < z.maxDepth) || zones[zones.length - 1]!;
}

export function getBackgroundColor(depth: number): string {
  // Create gradient from light blue to black
  const progress = Math.min(depth / MAX_DEPTH, 1);

  if (progress < 0.02) {
    // Surface: bright sky blue
    return `rgb(14, 165, 233)`;
  } else if (progress < 0.1) {
    // Shallow: medium blue
    const t = (progress - 0.02) / 0.08;
    return `rgb(${Math.round(14 - 10 * t)}, ${Math.round(165 - 100 * t)}, ${Math.round(233 - 100 * t)})`;
  } else if (progress < 0.3) {
    // Mid: dark blue
    const t = (progress - 0.1) / 0.2;
    return `rgb(${Math.round(4 - 3 * t)}, ${Math.round(65 - 50 * t)}, ${Math.round(133 - 100 * t)})`;
  } else if (progress < 0.6) {
    // Deep: very dark blue/black
    const t = (progress - 0.3) / 0.3;
    return `rgb(${Math.round(1 - 1 * t)}, ${Math.round(15 - 14 * t)}, ${Math.round(33 - 30 * t)})`;
  } else {
    // Bottom: pitch black
    return `rgb(0, 0, 0)`;
  }
}
