"use client";

import { useState, useMemo, useCallback } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { calculateImpact, presets } from "./data";
import { CraterCanvas } from "./CraterCanvas";
import { WorldMap, type MapImpact, getImpactColor } from "./WorldMap";

const locations = [
  { id: "ocean", name: "Ocean", density: 10, emoji: "🌊", desc: "Low casualties, tsunami risk" },
  { id: "desert", name: "Desert", density: 5, emoji: "🏜️", desc: "Very low population" },
  { id: "rural", name: "Rural", density: 50, emoji: "🌾", desc: "Sparse population" },
  { id: "suburban", name: "Suburb", density: 500, emoji: "🏘️", desc: "Medium density" },
  { id: "city", name: "City", density: 5000, emoji: "🏙️", desc: "High density urban" },
  { id: "megacity", name: "Megacity", density: 20000, emoji: "🌆", desc: "Extreme density" },
];

const knownCraters = [
  { name: "Meteor Crater, AZ", diameter: 1.2, age: "50k years", emoji: "📍" },
  { name: "Manicouagan, Canada", diameter: 85, age: "214M years", emoji: "📍" },
  { name: "Chicxulub, Mexico", diameter: 150, age: "66M years", emoji: "💀" },
  { name: "Vredefort, South Africa", diameter: 300, age: "2B years", emoji: "📍" },
];

export default function AsteroidLauncherPage() {
  const [diameter, setDiameter] = useState(100); // meters
  const [density, setDensity] = useState(3000); // kg/m³
  const [velocity, setVelocity] = useState(20); // km/s
  const [angle, setAngle] = useState(45); // degrees
  const [location, setLocation] = useState("rural");

  // Multi-impact state
  const [impacts, setImpacts] = useState<MapImpact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const result = useMemo(() => {
    return calculateImpact({ diameter, density, velocity, angle });
  }, [diameter, density, velocity, angle]);

  const loc = locations.find((l) => l.id === location) ?? locations[2]!;
  const adjustedCasualties = useMemo(() => {
    const area = result.affectedAreaKm2;
    const pop = Math.round(area * loc.density);
    if (pop < 1) return "Minimal";
    if (pop < 1000) return `${pop.toLocaleString()} estimated`;
    if (pop < 1_000_000) return `${(pop / 1000).toFixed(1)}K estimated`;
    return `${(pop / 1_000_000).toFixed(1)}M estimated`;
  }, [result.affectedAreaKm2, loc]);

  const selectedImpact = impacts.find((i) => i.id === selectedId) ?? null;
  const displayResult = selectedImpact ? selectedImpact.result : result;

  const handleMapClick = useCallback(
    (lat: number, lng: number, xPct: number, yPct: number) => {
      // Limit to 50 impacts for performance
      if (impacts.length >= 50) {
        // Remove oldest to make room
        setImpacts((prev) => prev.slice(1));
      }
      const newResult = calculateImpact({ diameter, density, velocity, angle });
      const newImpact: MapImpact = {
        id: Math.random().toString(36).slice(2, 9),
        lat,
        lng,
        x: xPct,
        y: yPct,
        result: newResult,
        diameter,
        velocity,
        color: getImpactColor(impacts.length),
        timestamp: Date.now(),
      };
      setImpacts((prev) => [...prev.slice(-49), newImpact]);
      setSelectedId(newImpact.id);

      // Haptic feedback if available
      try {
        navigator.vibrate?.(100);
      } catch {}
    },
    [diameter, density, velocity, angle, impacts.length]
  );

  const handleRemove = useCallback((id: string) => {
    setImpacts((prev) => prev.filter((i) => i.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleClear = useCallback(() => {
    setImpacts([]);
    setSelectedId(null);
  }, []);

  const applyPreset = (preset: (typeof presets)[0]) => {
    setDiameter(preset.diameter);
    setDensity(preset.density);
    setVelocity(preset.velocity);
    setAngle(preset.angle);
  };

  // Calculate total stats for multi-impact
  const totalStats = useMemo(() => {
    if (impacts.length === 0) return null;
    const totalEnergy = impacts.reduce((sum, i) => sum + i.result.energy, 0);
    const totalArea = impacts.reduce((sum, i) => sum + i.result.affectedAreaKm2, 0);
    const maxCrater = Math.max(...impacts.map((i) => i.result.craterDiameter));
    const avgTNT = totalEnergy / 4.184e9;
    let tntStr = "";
    if (avgTNT < 1000) tntStr = `${avgTNT.toFixed(0)} tons`;
    else if (avgTNT < 1_000_000) tntStr = `${(avgTNT / 1000).toFixed(1)} kt`;
    else if (avgTNT < 1_000_000_000) tntStr = `${(avgTNT / 1_000_000).toFixed(1)} Mt`;
    else tntStr = `${(avgTNT / 1_000_000_000).toFixed(1)} Gt`;

    return {
      totalEnergy,
      totalArea,
      maxCrater,
      tntStr,
      count: impacts.length,
    };
  }, [impacts]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="flex flex-wrap items-center justify-center gap-3 text-4xl md:text-5xl font-bold mb-3">
            <GameIcon
              src="/experiences/asteroid-launcher/icon.webp"
              alt="Asteroid Launcher icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Asteroid Launcher
          </h1>
          <p className="text-lg text-[var(--muted-foreground)]">
            Launch asteroids at Earth and see the devastation • Now with real world map
          </p>
        </div>

        {/* Real World Map - Full width on top */}
        <div className="mb-8">
          <WorldMap
            impacts={impacts}
            onMapClick={handleMapClick}
            onRemoveImpact={handleRemove}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          {/* Multi-impact controls */}
          {impacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                >
                  🗑️ Clear all ({impacts.length})
                </button>
                {selectedImpact && (
                  <button
                    onClick={() => handleRemove(selectedImpact.id)}
                    className="px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs"
                  >
                    Remove selected
                  </button>
                )}
              </div>
              {totalStats && (
                <div className="flex gap-4 text-xs">
                  <span>
                    Total: <b className="text-[var(--primary)]">{totalStats.tntStr} TNT</b>
                  </span>
                  <span>
                    Area: <b>{totalStats.totalArea.toFixed(1)} km²</b>
                  </span>
                  <span>
                    Max crater: <b>{totalStats.maxCrater.toFixed(1)} km</b>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Impacts list */}
          {impacts.length > 0 && (
            <div className="mt-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                <span>Impact History ({impacts.length})</span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  Click map or list to select
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {impacts.map((impact, idx) => (
                  <button
                    key={impact.id}
                    onClick={() => setSelectedId(impact.id)}
                    className={`text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center gap-2 ${
                      selectedId === impact.id
                        ? "bg-[var(--primary)]/10 border-[var(--primary)]/50 ring-1 ring-[var(--primary)]/30"
                        : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: impact.color }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {impact.result.equivalentTNT} • {impact.diameter}m
                      </div>
                      <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                        {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}° •{" "}
                        {impact.result.craterDiameter.toFixed(2)}km crater
                      </div>
                    </div>
                    <span className="text-[10px]">{selectedId === impact.id ? "👁️" : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sliders */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              ☄️ Asteroid Config{" "}
              <span className="text-[10px] px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                Applies to next impact
              </span>
            </h3>
            <div>
              <label htmlFor="diameter" className="block text-sm font-medium mb-2">
                Diameter: {diameter < 1000 ? `${diameter} m` : `${(diameter / 1000).toFixed(1)} km`}
              </label>
              <input
                id="diameter"
                type="range"
                min="1"
                max="15000"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Asteroid diameter"
                aria-valuetext={
                  diameter < 1000
                    ? `${diameter} meters`
                    : `${(diameter / 1000).toFixed(1)} kilometers`
                }
              />
            </div>

            <div>
              <label htmlFor="density" className="block text-sm font-medium mb-2">
                Density: {density} kg/m³
              </label>
              <input
                id="density"
                type="range"
                min="1000"
                max="8000"
                step="100"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Asteroid density"
                aria-valuetext={`${density} kilograms per cubic meter`}
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                <span>Ice</span>
                <span>Rock</span>
                <span>Iron</span>
              </div>
            </div>

            <div>
              <label htmlFor="velocity" className="block text-sm font-medium mb-2">
                Velocity: {velocity} km/s
              </label>
              <input
                id="velocity"
                type="range"
                min="5"
                max="72"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Asteroid velocity"
                aria-valuetext={`${velocity} kilometers per second`}
              />
            </div>

            <div>
              <label htmlFor="angle" className="block text-sm font-medium mb-2">
                Impact Angle: {angle}°
              </label>
              <input
                id="angle"
                type="range"
                min="10"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
                aria-label="Impact angle"
                aria-valuetext={`${angle} degrees`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Target: {loc.emoji} {loc.name}
              </label>
              <div className="grid grid-cols-3 gap-1">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLocation(l.id)}
                    aria-pressed={location === l.id}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                      location === l.id
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"
                    }`}
                    title={l.desc}
                  >
                    {l.emoji} {l.name}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                {loc.desc} • {loc.density}/km²
              </p>
            </div>
          </div>

          {/* Presets & Known Craters */}
          <div className="space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="font-semibold mb-4">Presets</h3>
              <div className="space-y-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="font-semibold mb-3">Known Craters</h3>
              <div className="space-y-2">
                {knownCraters.map((c) => {
                  const ratio = displayResult.craterDiameter / c.diameter;
                  return (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-xs bg-[var(--secondary)] px-3 py-2 rounded-lg"
                    >
                      <span>
                        {c.emoji} {c.name} ({c.diameter}km)
                      </span>
                      <span
                        className={`font-mono ${ratio > 0.8 && ratio < 1.2 ? "text-green-400 font-bold" : "text-[var(--muted-foreground)]"}`}
                      >
                        {ratio < 0.01
                          ? `${(ratio * 100).toFixed(1)}%`
                          : ratio < 1
                            ? `${(ratio * 100).toFixed(0)}%`
                            : `${ratio.toFixed(1)}x`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
                Your crater vs famous impacts {selectedImpact ? "(selected)" : "(current config)"}
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2 text-center">
            {selectedImpact
              ? `Impact #${impacts.indexOf(selectedImpact) + 1} Results`
              : "Impact Preview"}
          </h2>
          {selectedImpact && (
            <p className="text-center text-xs text-[var(--muted-foreground)] mb-6">
              📍 {selectedImpact.lat.toFixed(2)}°, {selectedImpact.lng.toFixed(2)}° •{" "}
              {selectedImpact.diameter}m @ {selectedImpact.velocity}km/s
            </p>
          )}
          {!selectedImpact && impacts.length === 0 && (
            <p className="text-center text-xs text-[var(--muted-foreground)] mb-6">
              Adjust sliders then click the world map to launch • Preview below shows current config
            </p>
          )}

          {/* Energy */}
          <div className="text-center mb-8">
            <div className="text-sm text-[var(--muted-foreground)] mb-2">Energy Released</div>
            <div className="text-3xl font-bold text-[var(--primary)] mb-2">
              {displayResult.equivalentTNT}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">{displayResult.comparison}</div>
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[var(--secondary)] px-3 py-1.5 rounded-full text-xs">
                <span>💀 Base estimate:</span>
                <span className="font-bold">{displayResult.casualtyEstimate}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 px-3 py-1.5 rounded-full text-xs">
                <span>
                  {loc.emoji} {loc.name} ({loc.density}/km²):
                </span>
                <span className="font-bold text-[var(--primary)]">{adjustedCasualties}</span>
              </div>
            </div>
          </div>

          {/* Crater Canvas */}
          <div className="mb-8">
            <CraterCanvas result={displayResult} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🕳️</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Crater Diameter</div>
              <div className="font-bold">
                {displayResult.craterDiameter < 1
                  ? `${(displayResult.craterDiameter * 1000).toFixed(0)} m`
                  : `${displayResult.craterDiameter.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">📏</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Crater Depth</div>
              <div className="font-bold">
                {displayResult.craterDepth < 1
                  ? `${(displayResult.craterDepth * 1000).toFixed(0)} m`
                  : `${displayResult.craterDepth.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌍</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Earthquake</div>
              <div className="font-bold">
                {displayResult.earthquakeMagnitude.toFixed(1)} magnitude
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Fireball Radius</div>
              <div className="font-bold">
                {displayResult.fireballRadius < 1
                  ? `${(displayResult.fireballRadius * 1000).toFixed(0)} m`
                  : `${displayResult.fireballRadius.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🌡️</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Thermal Radiation</div>
              <div className="font-bold">
                {displayResult.thermalRadiationDistance < 1
                  ? `${(displayResult.thermalRadiationDistance * 1000).toFixed(0)} m`
                  : `${displayResult.thermalRadiationDistance.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">💨</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Blast Wave</div>
              <div className="font-bold">
                {displayResult.blastWaveDistance < 1
                  ? `${(displayResult.blastWaveDistance * 1000).toFixed(0)} m`
                  : `${displayResult.blastWaveDistance.toFixed(1)} km`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">📐</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Affected Area</div>
              <div className="font-bold">
                {displayResult.affectedAreaKm2 < 1
                  ? `${(displayResult.affectedAreaKm2 * 1_000_000).toFixed(0)} m²`
                  : displayResult.affectedAreaKm2 < 1000
                    ? `${displayResult.affectedAreaKm2.toFixed(1)} km²`
                    : `${(displayResult.affectedAreaKm2 / 1000).toFixed(1)}k km²`}
              </div>
            </div>

            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">⚖️</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Mass</div>
              <div className="font-bold text-xs">
                {displayResult.mass < 1000
                  ? `${displayResult.mass.toFixed(0)} kg`
                  : displayResult.mass < 1e6
                    ? `${(displayResult.mass / 1000).toFixed(1)} tons`
                    : `${(displayResult.mass / 1e9).toFixed(2)} Mt`}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-[var(--muted-foreground)]">
          <p>
            🌍 Click the real world map to fire multiple asteroids • Each impact uses current slider
            config
          </p>
        </div>
      </div>
    </div>
  );
}
