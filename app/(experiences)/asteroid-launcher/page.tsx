"use client";

import { useState, useMemo, useCallback } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { calculateImpact, presets } from "./data";
import { CraterCanvas } from "./CraterCanvas";
import { WorldMap, type MapImpact, type ShakeEvent, getImpactColor } from "./WorldMap";
import { CountryMap } from "./CountryMap";
import { popularCountries, isInBounds } from "./countryMaps";

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

function latLngToWorldPct(lat: number, lng: number) {
  return { x: ((lng + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

export default function AsteroidLauncherPage() {
  const [diameter, setDiameter] = useState(100);
  const [density, setDensity] = useState(3000);
  const [velocity, setVelocity] = useState(20);
  const [angle, setAngle] = useState(45);
  const [location, setLocation] = useState("rural");

  const [impacts, setImpacts] = useState<MapImpact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shakeEvent, setShakeEvent] = useState<ShakeEvent>(null);

  const [mapMode, setMapMode] = useState<"world" | "countries">("world");
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>(["usa"]);

  const result = useMemo(
    () => calculateImpact({ diameter, density, velocity, angle }),
    [diameter, density, velocity, angle]
  );
  const loc = locations.find((l) => l.id === location) ?? locations[2]!;

  const selectedImpacts = impacts.filter((i) => selectedIds.includes(i.id));
  const displayResult =
    selectedImpacts.length === 1
      ? selectedImpacts[0]!.result
      : selectedImpacts.length > 1
        ? (() => {
            const totalEnergy = selectedImpacts.reduce((s, i) => s + i.result.energy, 0);
            const maxCrater = Math.max(...selectedImpacts.map((i) => i.result.craterDiameter));
            const totalArea = selectedImpacts.reduce((s, i) => s + i.result.affectedAreaKm2, 0);
            return {
              ...selectedImpacts[0]!.result,
              energy: totalEnergy,
              craterDiameter: maxCrater,
              affectedAreaKm2: totalArea,
              equivalentTNT: `${(totalEnergy / 4.184e9 / 1000).toFixed(1)} kt combined (${selectedImpacts.length} impacts)`,
              comparison: `${selectedImpacts.length} impacts combined`,
              casualtyEstimate: `${selectedImpacts.length} impacts`,
              earthquakeMagnitude: Math.max(
                ...selectedImpacts.map((i) => i.result.earthquakeMagnitude)
              ),
            };
          })()
        : result;

  const selectedCountries = popularCountries.filter((c) => selectedCountryIds.includes(c.id));

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (impacts.length >= 50) setImpacts((prev) => prev.slice(1));
      const newResult = calculateImpact({ diameter, density, velocity, angle });
      const { x, y } = latLngToWorldPct(lat, lng);
      const newImpact: MapImpact = {
        id: Math.random().toString(36).slice(2, 9),
        lat,
        lng,
        x,
        y,
        result: newResult,
        diameter,
        velocity,
        color: getImpactColor(impacts.length),
        timestamp: Date.now(),
      };
      setImpacts((prev) => [...prev.slice(-49), newImpact]);
      setSelectedIds((prev) => [...prev, newImpact.id]);
      setShakeEvent({
        id: newImpact.id,
        magnitude: newResult.earthquakeMagnitude,
        energy: newResult.energy,
      });
    },
    [diameter, density, velocity, angle, impacts.length]
  );

  const handleSelectImpact = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const handleRemoveSelected = useCallback(() => {
    setImpacts((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
    setSelectedIds([]);
  }, [selectedIds]);

  const handleClear = useCallback(() => {
    setImpacts([]);
    setSelectedIds([]);
  }, []);

  const handleSelectCountry = useCallback((id: string) => {
    setSelectedCountryIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== id);
      }
      return [...prev, id];
    });
  }, []);

  const applyPreset = (preset: (typeof presets)[0]) => {
    setDiameter(preset.diameter);
    setDensity(preset.density);
    setVelocity(preset.velocity);
    setAngle(preset.angle);
  };

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
    return { totalEnergy, totalArea, maxCrater, tntStr, count: impacts.length };
  }, [impacts]);

  const countryImpactsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of popularCountries)
      counts[c.id] = impacts.filter((imp) => isInBounds(imp.lat, imp.lng, c.bounds)).length;
    return counts;
  }, [impacts]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            World + 12 popular countries • Multi-select • Faster vibration when bigger
          </p>
        </div>

        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-full border bg-[var(--card)] p-1">
            <button
              onClick={() => setMapMode("world")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "world" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
            >
              🌍 World Map
            </button>
            <button
              onClick={() => setMapMode("countries")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "countries" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
            >
              🗺️ Countries ({popularCountries.length}) • {selectedCountryIds.length} selected
            </button>
          </div>
        </div>

        <div className="mb-8">
          {mapMode === "world" ? (
            <WorldMap
              impacts={impacts}
              onMapClick={handleMapClick}
              selectedIds={selectedIds}
              onSelect={handleSelectImpact}
              shakeEvent={shakeEvent}
            />
          ) : (
            <div className="space-y-3">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
                <div className="text-xs font-semibold mb-2 flex justify-between">
                  <span>
                    Popular Countries — multi-select enabled (click to toggle, at least 1) • Maps
                    actually show up with 4K satellite
                  </span>
                  <span className="text-[10px] text-[var(--muted-foreground)]">
                    {selectedCountryIds.length} maps selected • Click crater to multi-select impacts
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {popularCountries.map((c) => {
                    const count = countryImpactsCount[c.id] ?? 0;
                    const isSelected = selectedCountryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCountry(c.id)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs transition-all relative overflow-hidden ${isSelected ? "bg-[var(--primary)] text-white border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                      >
                        <div className="absolute inset-0 opacity-20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/experiences/asteroid-launcher/country-${c.id}.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                        <div className="relative">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="text-base">{c.flag}</span> {c.name} {isSelected && "✓"}
                          </div>
                          <div className="text-[10px] opacity-80 mt-0.5">
                            {c.capital} • {c.population} • {count} hits
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setSelectedCountryIds(popularCountries.map((c) => c.id))}
                    className="px-3 py-1 text-[10px] rounded-full border bg-[var(--secondary)] hover:bg-[var(--muted)]"
                  >
                    Select all 12
                  </button>
                  <button
                    onClick={() => setSelectedCountryIds(["usa"])}
                    className="px-3 py-1 text-[10px] rounded-full border bg-[var(--secondary)] hover:bg-[var(--muted)]"
                  >
                    Only USA
                  </button>
                </div>
              </div>

              <div
                className={`grid gap-3 ${selectedCountries.length === 1 ? "grid-cols-1" : selectedCountries.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}
              >
                {selectedCountries.map((country) => (
                  <CountryMap
                    key={country.id}
                    country={country}
                    impacts={impacts}
                    onMapClick={handleMapClick}
                    selectedIds={selectedIds}
                    onSelect={handleSelectImpact}
                    shakeEvent={shakeEvent}
                  />
                ))}
              </div>
            </div>
          )}

          {impacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center justify-between bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="flex gap-2 items-center flex-wrap">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium"
                >
                  🗑️ Clear all ({impacts.length})
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs"
                  >
                    Remove selected ({selectedIds.length})
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs"
                  >
                    Deselect all
                  </button>
                )}
                <button
                  onClick={() => setSelectedIds(impacts.map((i) => i.id))}
                  className="px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs"
                >
                  Select all impacts
                </button>
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
                    Selected: <b>{selectedIds.length}</b>
                  </span>
                </div>
              )}
            </div>
          )}

          {impacts.length > 0 && (
            <div className="mt-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="text-xs font-semibold mb-2 flex justify-between">
                <span>
                  Impact History ({impacts.length}) — multi-select: click to toggle • Vibration
                  faster when bigger (gap 18ms→2ms)
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  No X on map — delete here • M{shakeEvent ? shakeEvent.magnitude.toFixed(1) : "-"}{" "}
                  last shake
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {impacts.map((impact, idx) => {
                  const isSelected = selectedIds.includes(impact.id);
                  return (
                    <button
                      key={impact.id}
                      onClick={() => handleSelectImpact(impact.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center gap-2 ${isSelected ? "bg-[var(--primary)]/20 border-[var(--primary)] ring-1 ring-[var(--primary)]/30" : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                    >
                      <input type="checkbox" checked={isSelected} readOnly className="shrink-0" />
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: impact.color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {impact.result.equivalentTNT} • {impact.diameter}m • M
                          {impact.result.earthquakeMagnitude.toFixed(1)}{" "}
                          {impact.result.earthquakeMagnitude > 7 ? "⚡fast" : ""}
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                          {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}° •{" "}
                          {impact.result.craterDiameter.toFixed(2)}km • vib{" "}
                          {impact.result.earthquakeMagnitude < 4
                            ? "slow"
                            : impact.result.earthquakeMagnitude < 7
                              ? "medium"
                              : "FAST"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-6">
            <h3 className="font-semibold flex items-center gap-2">
              ☄️ Asteroid Config{" "}
              <span className="text-[10px] px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                Faster vib when bigger
              </span>
            </h3>
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
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Density: {density} kg/m³</label>
              <input
                type="range"
                min="1000"
                max="8000"
                step="100"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mt-1">
                <span>Ice</span>
                <span>Rock</span>
                <span>Iron</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Velocity: {velocity} km/s</label>
              <input
                type="range"
                min="5"
                max="72"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Impact Angle: {angle}°</label>
              <input
                type="range"
                min="10"
                max="90"
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
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
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border ${location === l.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                  >
                    {l.emoji} {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="font-semibold mb-4">Presets • Vibration speed</h3>
              <div className="space-y-2">
                {presets.map((preset) => {
                  const r = calculateImpact(preset);
                  const vibSpeed =
                    r.earthquakeMagnitude < 4
                      ? "slow 18ms gap"
                      : r.earthquakeMagnitude < 7
                        ? "medium 6ms gap"
                        : "FAST 2ms gap";
                  return (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--muted)]"
                    >
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {preset.diameter < 1000
                          ? `${preset.diameter}m`
                          : `${(preset.diameter / 1000).toFixed(1)}km`}{" "}
                        • M{r.earthquakeMagnitude.toFixed(1)} • {vibSpeed}
                      </div>
                    </button>
                  );
                })}
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
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2 text-center">
            {selectedImpacts.length === 1
              ? `Impact #${impacts.indexOf(selectedImpacts[0]!) + 1} Results`
              : selectedImpacts.length > 1
                ? `${selectedImpacts.length} Impacts Selected`
                : "Impact Preview"}
          </h2>
          {selectedImpacts.length > 0 && (
            <p className="text-center text-xs text-[var(--muted-foreground)] mb-6">
              {selectedImpacts.length} selected • Shake M
              {displayResult.earthquakeMagnitude.toFixed(1)} • Vib{" "}
              {displayResult.earthquakeMagnitude < 4
                ? "slow"
                : displayResult.earthquakeMagnitude < 7
                  ? "medium"
                  : "FAST"}{" "}
              • Gap{" "}
              {displayResult.earthquakeMagnitude < 4
                ? "18ms"
                : displayResult.earthquakeMagnitude < 7
                  ? "6ms"
                  : "2ms"}
            </p>
          )}

          <div className="text-center mb-8">
            <div className="text-sm text-[var(--muted-foreground)] mb-2">Energy Released</div>
            <div className="text-3xl font-bold text-[var(--primary)] mb-2">
              {displayResult.equivalentTNT}
            </div>
            <div className="text-sm text-[var(--muted-foreground)]">{displayResult.comparison}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <div className="inline-flex items-center gap-2 bg-[var(--secondary)] px-3 py-1.5 rounded-full text-xs">
                <span>💀 Base:</span>
                <span className="font-bold">{displayResult.casualtyEstimate}</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-xs">
                <span>🌍 Shake:</span>
                <span className="font-bold text-orange-400">
                  M{displayResult.earthquakeMagnitude.toFixed(1)} ={" "}
                  {Math.min(50, Math.max(2, displayResult.earthquakeMagnitude * 4)).toFixed(0)}px •{" "}
                  {(3 + displayResult.earthquakeMagnitude * 1.8).toFixed(0)} shakes •{" "}
                  {(0.3 + displayResult.earthquakeMagnitude * 0.05).toFixed(2)}s ={" "}
                  {(
                    (3 + displayResult.earthquakeMagnitude * 1.8) /
                    (0.3 + displayResult.earthquakeMagnitude * 0.05)
                  ).toFixed(1)}
                  Hz {displayResult.earthquakeMagnitude > 7 ? "⚡FAST" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <CraterCanvas result={displayResult} />
          </div>

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
              <div className="text-2xl mb-1">🌍</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Shake / Vib Speed</div>
              <div className="font-bold">
                {displayResult.earthquakeMagnitude.toFixed(1)} •{" "}
                {displayResult.earthquakeMagnitude < 4
                  ? "slow"
                  : displayResult.earthquakeMagnitude < 7
                    ? "med"
                    : "FAST"}{" "}
                •{" "}
                {displayResult.earthquakeMagnitude < 4
                  ? "18ms"
                  : displayResult.earthquakeMagnitude < 7
                    ? "6ms"
                    : "2ms"}{" "}
                gap
              </div>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <div className="text-xs text-[var(--muted-foreground)] mb-1">Fireball</div>
              <div className="font-bold">
                {displayResult.fireballRadius < 1
                  ? `${(displayResult.fireballRadius * 1000).toFixed(0)} m`
                  : `${displayResult.fireballRadius.toFixed(1)} km`}
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
          </div>
        </div>

        <div className="text-center text-sm text-[var(--muted-foreground)]">
          <p>
            🌍 World + 12 countries • All 12 maps 4K actually show up • Multi-select impacts +
            countries • Vibration faster when bigger (gap 18ms→2ms, freq 16Hz→26Hz)
          </p>
        </div>
      </div>
    </div>
  );
}
