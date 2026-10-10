"use client";

import { useState, useMemo } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { calculateImpact, presets } from "./data";

export default function AsteroidLauncherPage() {
  const [diameter, setDiameter] = useState(100); // meters
  const [density, setDensity] = useState(3000); // kg/m³
  const [velocity, setVelocity] = useState(20); // km/s
  const [angle, setAngle] = useState(45); // degrees

  const result = useMemo(() => {
    return calculateImpact({ diameter, density, velocity, angle });
  }, [diameter, density, velocity, angle]);

  const applyPreset = (preset: typeof presets[0]) => {
    setDiameter(preset.diameter);
    setDensity(preset.density);
    setVelocity(preset.velocity);
    setAngle(preset.angle);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-5xl md:text-6xl font-bold mb-4">
            <GameIcon
              src="/experiences/asteroid-launcher/icon.webp"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Asteroid Launcher
          </h1>
          <p className="text-xl text-[var(--muted-foreground)]">
            Launch asteroids at Earth and see the devastation
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sliders */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Diameter: {diameter < 1000 ? `${diameter} m` : `${(diameter / 1000).toFixed(1)} km`}
              </label>
              <input
                type="range"
                min="1"
                max="15000"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Density: {density} kg/m³
              </label>
              <input
                type="range"
                min="1000"
                max="8000"
                step="100"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                <span>Ice</span>
                <span>Rock</span>
                <span>Iron</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Velocity: {velocity} km/s
              </label>
              <input
                type="range"
                min="5"
                max="72"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Impact Angle: {angle}°
              </label>
              <input
                type="range"
                min="10"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="font-semibold mb-4">Presets</h3>
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="w-full text-left px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--muted)] transition-colors"
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">
                    {preset.diameter < 1000
                      ? `${preset.diameter}m`
                      : `${(preset.diameter / 1000).toFixed(1)}km`}{" "}
                    • {preset.velocity} km/s
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Impact Results</h2>

          {/* Energy */}
          <div className="text-center mb-8">
            <div className="text-sm text-[var(--muted-foreground)] mb-2">Energy Released</div>
            <div className="text-3xl font-bold text-[var(--primary)] mb-2">
              {result.equivalentTNT}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">
              {result.comparison}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🕳️</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Crater Diameter</div>
              <div className="font-bold">
                {result.craterDiameter < 1
                  ? `${(result.craterDiameter * 1000).toFixed(0)} m`
                  : `${result.craterDiameter.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">📏</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Crater Depth</div>
              <div className="font-bold">
                {result.craterDepth < 1
                  ? `${(result.craterDepth * 1000).toFixed(0)} m`
                  : `${result.craterDepth.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌍</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Earthquake</div>
              <div className="font-bold">
                {result.earthquakeMagnitude.toFixed(1)} magnitude
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Fireball Radius</div>
              <div className="font-bold">
                {result.fireballRadius < 1
                  ? `${(result.fireballRadius * 1000).toFixed(0)} m`
                  : `${result.fireballRadius.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌡️</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Thermal Radiation</div>
              <div className="font-bold">
                {result.thermalRadiationDistance < 1
                  ? `${(result.thermalRadiationDistance * 1000).toFixed(0)} m`
                  : `${result.thermalRadiationDistance.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">💨</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Blast Wave</div>
              <div className="font-bold">
                {result.blastWaveDistance < 1
                  ? `${(result.blastWaveDistance * 1000).toFixed(0)} m`
                  : `${result.blastWaveDistance.toFixed(1)} km`}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-[var(--muted-foreground)]">
          <p>Adjust the sliders or select a preset to see different impact scenarios!</p>
        </div>
      </div>
    </div>
  );
}
