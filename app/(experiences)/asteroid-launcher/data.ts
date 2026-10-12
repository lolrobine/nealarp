export type AsteroidConfig = {
  diameter: number; // meters
  density: number; // kg/m³
  velocity: number; // km/s
  angle: number; // degrees from horizontal (10-90)
};

export type ImpactResult = {
  energy: number; // joules
  mass: number; // kg
  craterDiameter: number; // km
  craterDepth: number; // km
  earthquakeMagnitude: number;
  fireballRadius: number; // km
  thermalRadiationDistance: number; // km
  blastWaveDistance: number; // km
  equivalentTNT: string;
  comparison: string;
  casualtyEstimate: string;
  affectedAreaKm2: number;
};

// Calculate kinetic energy: E = 0.5 * m * v²
// Recalibrated using empirical scaling from NASA Impact Earth calculator
// and Collins et al. (2005) Pi-scaling
export function calculateImpact(config: AsteroidConfig): ImpactResult {
  const { diameter, density, velocity, angle } = config;

  // Calculate volume (sphere) and mass
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  const mass = volume * density;

  // Kinetic energy in joules
  const velocityMs = velocity * 1000;
  const energy = 0.5 * mass * Math.pow(velocityMs, 2);

  // Angle factor: vertical (90°) = max, shallow = less (sin)
  const angleRad = (angle * Math.PI) / 180;
  const sinAngle = Math.max(0.1, Math.sin(angleRad)); // avoid zero

  // Crater diameter: empirical ~10 * D * (v/15)^0.5 * (density/3000)^0.33 * sin^0.33
  // Gives ~10m crater for 1m rock at 20km/s, ~1km for 100m, ~100km for 10km (Chicxulub ~150km)
  const craterDiameterM =
    10 *
    diameter *
    Math.pow(velocity / 15, 0.5) *
    Math.pow(density / 3000, 0.33) *
    Math.pow(sinAngle, 0.33);
  const craterDiameterKm = craterDiameterM / 1000;
  const craterDepthKm = craterDiameterKm * 0.2;

  // Earthquake magnitude with seismic efficiency 1e-4 (only 0.01% of energy goes to seismic)
  // M = (log10(E*1e-4) - 4.8)/1.5
  const seismicEnergy = energy * 1e-4;
  const earthquakeMagnitude = (Math.log10(Math.max(seismicEnergy, 1)) - 4.8) / 1.5;

  // Fireball, thermal, blast scale with E^0.33 (cube root, from nuclear weapons scaling)
  // Calibrated to give reasonable values for Chelyabinsk (20m): fireball ~2.4km, thermal ~6km, blast ~12km
  const energyPow = Math.pow(energy, 0.33);
  const fireballRadius = (0.02 * energyPow) / 1000; // m to km
  const thermalRadiationDistance = (0.05 * energyPow) / 1000;
  const blastWaveDistance = (0.1 * energyPow) / 1000;

  // TNT equivalent
  const tntTons = energy / 4.184e9; // joules to tons of TNT
  let equivalentTNT: string;
  if (tntTons < 1000) {
    equivalentTNT = `${tntTons.toFixed(0)} tons of TNT`;
  } else if (tntTons < 1_000_000) {
    equivalentTNT = `${(tntTons / 1000).toFixed(1)} kilotons of TNT`;
  } else if (tntTons < 1_000_000_000) {
    equivalentTNT = `${(tntTons / 1_000_000).toFixed(1)} megatons of TNT`;
  } else {
    equivalentTNT = `${(tntTons / 1_000_000_000).toFixed(1)} gigatons of TNT`;
  }

  // Historical comparisons based on energy
  let comparison: string;
  if (energy < 1e12) {
    comparison = "Similar to a large conventional bomb";
  } else if (energy < 6.3e13) {
    comparison = "Comparable to the Hiroshima atomic bomb (15 kilotons)";
  } else if (energy < 2.1e15) {
    comparison = "Similar to the Chelyabinsk airburst (440 kilotons)";
  } else if (energy < 2.1e16) {
    comparison = "Similar to the Tsar Bomba, largest nuclear weapon ever (50 megatons)";
  } else if (energy < 1e20) {
    comparison = "Could cause regional devastation, city-sized crater";
  } else if (energy < 1e23) {
    comparison = "Global effects, climate impact for years";
  } else {
    comparison = "Similar to the Chicxulub impact that killed the dinosaurs";
  }

  // Rough casualty estimate based on blast area and average density
  // Assume urban density ~1000/km², but scale down for small events
  const affectedAreaKm2 = Math.PI * blastWaveDistance * blastWaveDistance;
  let casualtyEstimate: string;
  if (energy < 1e13) {
    casualtyEstimate = "Minimal — airburst high in atmosphere";
  } else if (energy < 1e15) {
    const est = Math.round(affectedAreaKm2 * 10);
    casualtyEstimate = est < 100 ? `<100 (localized)` : `${est.toLocaleString()} (localized)`;
  } else if (energy < 1e18) {
    const est = Math.round(affectedAreaKm2 * 200);
    casualtyEstimate = `${est.toLocaleString()} — city-scale`;
  } else if (energy < 1e21) {
    const est = Math.round(affectedAreaKm2 * 500);
    casualtyEstimate = `${(est / 1_000_000).toFixed(1)}M — regional`;
  } else {
    casualtyEstimate = "Millions to billions — global catastrophe";
  }

  return {
    energy,
    mass,
    craterDiameter: craterDiameterKm,
    craterDepth: craterDepthKm,
    earthquakeMagnitude: Math.min(Math.max(earthquakeMagnitude, 0), 12),
    fireballRadius: Math.max(fireballRadius, 0),
    thermalRadiationDistance: Math.max(thermalRadiationDistance, 0),
    blastWaveDistance: Math.max(blastWaveDistance, 0),
    equivalentTNT,
    comparison,
    casualtyEstimate,
    affectedAreaKm2,
  };
}

export const presets = [
  {
    name: "Small Rock (1m)",
    diameter: 1,
    density: 3000,
    velocity: 20,
    angle: 45,
  },
  {
    name: "Car-sized (5m)",
    diameter: 5,
    density: 3500,
    velocity: 17,
    angle: 45,
  },
  {
    name: "House-sized (20m)",
    diameter: 20,
    density: 3000,
    velocity: 15,
    angle: 45,
  },
  {
    name: "Chelyabinsk (20m, 18°)",
    diameter: 20,
    density: 3300,
    velocity: 19,
    angle: 18,
  },
  {
    name: "City Killer (100m)",
    diameter: 100,
    density: 3000,
    velocity: 20,
    angle: 45,
  },
  {
    name: "Dinosaur Killer (10km)",
    diameter: 10000,
    density: 2700,
    velocity: 20,
    angle: 45,
  },
];
