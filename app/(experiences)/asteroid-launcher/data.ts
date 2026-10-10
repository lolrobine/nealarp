export type AsteroidConfig = {
  diameter: number; // meters
  density: number; // kg/m³
  velocity: number; // km/s
  angle: number; // degrees from horizontal
};

export type ImpactResult = {
  energy: number; // joules
  craterDiameter: number; // km
  craterDepth: number; // km
  earthquakeMagnitude: number;
  fireballRadius: number; // km
  thermalRadiationDistance: number; // km
  blastWaveDistance: number; // km
  equivalentTNT: string;
  comparison: string;
};

// Calculate kinetic energy: E = 0.5 * m * v²
export function calculateImpact(config: AsteroidConfig): ImpactResult {
  const { diameter, density, velocity } = config;

  // Calculate volume (sphere) and mass
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const mass = volume * density;

  // Kinetic energy in joules
  const velocityMs = velocity * 1000;
  const energy = 0.5 * mass * Math.pow(velocityMs, 2);

  // Crater calculations (simplified Pi-scaling)
  const craterDiameter = 1.8 * Math.pow(energy, 0.29) * Math.pow(density, -0.11);
  const craterDepth = craterDiameter * 0.2;

  // Earthquake magnitude (approximate)
  const earthquakeMagnitude = (Math.log10(energy) - 4.8) / 1.5;

  // Fireball radius (km)
  const fireballRadius = 0.001 * Math.pow(energy, 0.33);

  // Thermal radiation distance (km) - 3rd degree burns
  const thermalRadiationDistance = 0.01 * Math.pow(energy, 0.33);

  // Blast wave distance (km) - 5 psi overpressure
  const blastWaveDistance = 0.05 * Math.pow(energy, 0.33);

  // TNT equivalent
  const tntEquivalent = energy / 4.184e9; // joules to tons of TNT
  let equivalentTNT: string;
  if (tntEquivalent < 1000) {
    equivalentTNT = `${tntEquivalent.toFixed(0)} tons of TNT`;
  } else if (tntEquivalent < 1_000_000) {
    equivalentTNT = `${(tntEquivalent / 1000).toFixed(1)} kilotons of TNT`;
  } else if (tntEquivalent < 1_000_000_000) {
    equivalentTNT = `${(tntEquivalent / 1_000_000).toFixed(1)} megatons of TNT`;
  } else {
    equivalentTNT = `${(tntEquivalent / 1_000_000_000).toFixed(1)} gigatons of TNT`;
  }

  // Historical comparisons
  let comparison: string;
  if (energy < 1e12) {
    comparison = "Similar to a large conventional bomb";
  } else if (energy < 6.3e13) {
    comparison = "Comparable to the Hiroshima atomic bomb (15 kilotons)";
  } else if (energy < 2.1e15) {
    comparison = "Similar to the Tsar Bomba, largest nuclear weapon ever (50 megatons)";
  } else if (energy < 1e23) {
    comparison = "Could cause regional devastation";
  } else if (energy < 1e24) {
    comparison = "Global catastrophe, mass extinction likely";
  } else {
    comparison = "Similar to the Chicxulub impact that killed the dinosaurs";
  }

  return {
    energy,
    craterDiameter: craterDiameter / 1000,
    craterDepth: craterDepth / 1000,
    earthquakeMagnitude: Math.min(earthquakeMagnitude, 12),
    fireballRadius,
    thermalRadiationDistance,
    blastWaveDistance,
    equivalentTNT,
    comparison,
  };
}

export const presets = [
  {
    name: "Small Rock",
    diameter: 1,
    density: 3000,
    velocity: 20,
    angle: 45,
  },
  {
    name: "Car-sized",
    diameter: 5,
    density: 3500,
    velocity: 17,
    angle: 45,
  },
  {
    name: "House-sized",
    diameter: 20,
    density: 3000,
    velocity: 15,
    angle: 45,
  },
  {
    name: "Chelyabinsk",
    diameter: 20,
    density: 3300,
    velocity: 19,
    angle: 18,
  },
  {
    name: "City Killer",
    diameter: 100,
    density: 3000,
    velocity: 20,
    angle: 45,
  },
  {
    name: "Dinosaur Killer",
    diameter: 10000,
    density: 2700,
    velocity: 20,
    angle: 45,
  },
];
