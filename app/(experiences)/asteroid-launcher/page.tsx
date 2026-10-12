"use client";

import { useState, useMemo, useCallback } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { calculateImpact, presets } from "./data";
import { CraterCanvas } from "./CraterCanvas";
import { WorldMap, type MapImpact, type ShakeEvent, getImpactColor } from "./WorldMap";
import { CountryMap } from "./CountryMap";
import { popularCountries, isInBounds } from "./countryMaps";

const locations = [
  { id: "ocean", name: "Ocean", density: 10, emoji: "🌊", desc: "Ocean" },
  { id: "desert", name: "Desert", density: 5, emoji: "🏜️", desc: "Desert" },
  { id: "rural", name: "Rural", density: 50, emoji: "🌾", desc: "Rural" },
  { id: "suburban", name: "Suburb", density: 500, emoji: "🏘️", desc: "Suburb" },
  { id: "city", name: "City", density: 5000, emoji: "🏙️", desc: "City" },
  { id: "megacity", name: "Megacity", density: 20000, emoji: "🌆", desc: "Megacity" },
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
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>(["usa", "china", "india"]);

  const result = useMemo(
    () => calculateImpact({ diameter, density, velocity, angle }),
    [diameter, density, velocity, angle]
  );
  const loc = locations.find((l) => l.id === location) ?? locations[2]!;

  const selectedImpacts = impacts.filter((i) => selectedIds.includes(i.id));
  const displayResult = useMemo(() => {
    if (selectedImpacts.length === 1) return selectedImpacts[0]!.result;
    if (selectedImpacts.length > 1) {
      const totalEnergy = selectedImpacts.reduce((s, i) => s + i.result.energy, 0);
      const maxCrater = Math.max(...selectedImpacts.map((i) => i.result.craterDiameter));
      const totalArea = selectedImpacts.reduce((s, i) => s + i.result.affectedAreaKm2, 0);
      return {
        ...selectedImpacts[0]!.result,
        energy: totalEnergy,
        craterDiameter: maxCrater,
        affectedAreaKm2: totalArea,
        equivalentTNT: `${(totalEnergy / 4.184e9 / 1000).toFixed(1)} kt combined`,
        comparison: `${selectedImpacts.length} impacts`,
        casualtyEstimate: `${selectedImpacts.length} impacts`,
        earthquakeMagnitude: Math.max(...selectedImpacts.map((i) => i.result.earthquakeMagnitude)),
      };
    }
    return result;
  }, [selectedImpacts, result]);

  const selectedCountries = popularCountries.filter((c) => selectedCountryIds.includes(c.id));

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (impacts.length >= 80) setImpacts((prev) => prev.slice(1));
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
      setImpacts((prev) => [...prev.slice(-79), newImpact]);
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
      if (prev.length >= 6) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }, []);

  const totalStats = useMemo(() => {
    if (impacts.length === 0) return null;
    const totalEnergy = impacts.reduce((s, i) => s + i.result.energy, 0);
    const avgTNT = totalEnergy / 4.184e9;
    let tntStr = "";
    if (avgTNT < 1000) tntStr = `${avgTNT.toFixed(0)} t`;
    else if (avgTNT < 1_000_000) tntStr = `${(avgTNT / 1000).toFixed(1)} kt`;
    else if (avgTNT < 1_000_000_000) tntStr = `${(avgTNT / 1_000_000).toFixed(1)} Mt`;
    else tntStr = `${(avgTNT / 1_000_000_000).toFixed(1)} Gt`;
    return { tntStr, count: impacts.length };
  }, [impacts]);

  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of popularCountries)
      counts[c.id] = impacts.filter((imp) => isInBounds(imp.lat, imp.lng, c.bounds)).length;
    return counts;
  }, [impacts]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="flex items-center justify-center gap-3 text-4xl md:text-5xl font-bold mb-2">
            <GameIcon
              src="/experiences/asteroid-launcher/icon.webp"
              alt="icon"
              className="h-10 w-10 rounded-lg object-cover md:h-12 md:w-12"
            />
            Asteroid Launcher
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Launch asteroids • World + {popularCountries.length} countries • Multi-select impacts
          </p>
        </div>

        <div className="flex justify-center mb-4 gap-2">
          <div className="inline-flex rounded-full border bg-[var(--card)] p-1">
            <button
              onClick={() => setMapMode("world")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "world" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
            >
              🌍 World
            </button>
            <button
              onClick={() => setMapMode("countries")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "countries" ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--secondary)]"}`}
            >
              🗺️ Countries ({popularCountries.length})
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] text-[var(--muted-foreground)]">
            <span>💥 {impacts.length} impacts</span>
            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                {selectedIds.length} selected
              </span>
            )}
          </div>
        </div>

        <div className="mb-6">
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
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold">
                    {popularCountries.length} maps • Click to show • Multi-select up to 6
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        setSelectedCountryIds(popularCountries.slice(0, 6).map((c) => c.id))
                      }
                      className="px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                    >
                      Top 6
                    </button>
                    <button
                      onClick={() =>
                        setSelectedCountryIds(popularCountries.map((c) => c.id).slice(0, 6))
                      }
                      className="px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                    >
                      Random 6
                    </button>
                    <button
                      onClick={() => setSelectedCountryIds(["usa"])}
                      className="px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {popularCountries.map((c) => {
                    const count = countryCounts[c.id] ?? 0;
                    const isSelected = selectedCountryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCountry(c.id)}
                        className={`group relative text-left rounded-lg border overflow-hidden transition-all ${isSelected ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-[var(--border)] hover:border-[var(--primary)]/50"}`}
                      >
                        <div className="aspect-[16/10] relative bg-[#0a1628]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/experiences/asteroid-launcher/country-${c.id}.jpg`}
                            alt={c.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-1 left-1.5 right-1.5 flex justify-between items-end">
                            <span className="text-white text-[11px] font-bold flex items-center gap-1">
                              {c.flag} {c.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] bg-white text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                ✓
                              </span>
                            )}
                          </div>
                          {count > 0 && (
                            <span className="absolute top-1 right-1 text-[9px] bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                              {count}
                            </span>
                          )}
                        </div>
                        <div className="px-2 py-1 bg-[var(--card)] text-[10px] text-[var(--muted-foreground)] flex justify-between">
                          <span>{c.capital}</span>
                          <span>{c.population}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className={`grid gap-3 ${selectedCountries.length === 1 ? "grid-cols-1" : selectedCountries.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}
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
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs"
                >
                  Clear all ({impacts.length})
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="px-3 py-1.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-xs"
                  >
                    Remove selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={() => setSelectedIds(impacts.map((i) => i.id))}
                  className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-xs"
                >
                  Select all
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-[var(--secondary)] rounded-lg text-xs"
                >
                  Deselect
                </button>
              </div>
              {totalStats && (
                <span className="text-xs">
                  Total: <b className="text-[var(--primary)]">{totalStats.tntStr}</b> •{" "}
                  {selectedIds.length} selected
                </span>
              )}
            </div>
          )}

          {impacts.length > 0 && (
            <div className="mt-3 bg-[var(--card)] border border-[var(--border)] rounded-xl p-3">
              <div className="text-xs font-semibold mb-2">
                Impacts ({impacts.length}) • Click crater to toggle multi-select • Vibration faster
                for bigger
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {impacts.map((impact, idx) => {
                  const isSelected = selectedIds.includes(impact.id);
                  return (
                    <button
                      key={impact.id}
                      onClick={() => handleSelectImpact(impact.id)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs flex items-center gap-2 transition-colors ${isSelected ? "bg-[var(--primary)]/15 border-[var(--primary)]/50" : "bg-[var(--secondary)] border-[var(--border)] hover:bg-[var(--muted)]"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="pointer-events-none"
                      />
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: impact.color }}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">
                          {impact.result.equivalentTNT} • M
                          {impact.result.earthquakeMagnitude.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)] truncate">
                          {impact.lat.toFixed(1)}°, {impact.lng.toFixed(1)}° • {impact.diameter}m
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
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
            <h3 className="font-semibold">☄️ Asteroid</h3>
            <div>
              <label className="block text-sm font-medium mb-1">
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
              <label className="block text-sm font-medium mb-1">Density: {density} kg/m³</label>
              <input
                type="range"
                min="1000"
                max="8000"
                step="100"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Velocity: {velocity} km/s</label>
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
              <label className="block text-sm font-medium mb-1">Angle: {angle}°</label>
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
              <div className="text-sm font-medium mb-2">
                Target: {loc.emoji} {loc.name}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLocation(l.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border ${location === l.id ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--secondary)] border-[var(--border)]"}`}
                  >
                    {l.emoji} {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold mb-3">Presets</h3>
              <div className="space-y-2">
                {presets.map((p) => {
                  const r = calculateImpact(p);
                  return (
                    <button
                      key={p.name}
                      onClick={() => {
                        setDiameter(p.diameter);
                        setDensity(p.density);
                        setVelocity(p.velocity);
                        setAngle(p.angle);
                      }}
                      className="w-full text-left px-3 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--muted)]"
                    >
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">
                        {p.diameter < 1000
                          ? `${p.diameter}m`
                          : `${(p.diameter / 1000).toFixed(1)}km`}{" "}
                        • M{r.earthquakeMagnitude.toFixed(1)} •{" "}
                        {r.earthquakeMagnitude > 7 ? "FAST vib" : "slow vib"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-center mb-4">
            {selectedIds.length === 1
              ? `Impact #${impacts.findIndex((i) => i.id === selectedIds[0]) + 1}`
              : selectedIds.length > 1
                ? `${selectedIds.length} impacts selected`
                : "Preview"}
          </h2>
          <div className="text-center mb-6">
            <div className="text-2xl font-bold text-[var(--primary)]">
              {displayResult.equivalentTNT}
            </div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">
              {displayResult.comparison}
            </div>
          </div>
          <CraterCanvas result={displayResult} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted-foreground)]">Crater</div>
              <div className="font-bold text-sm">
                {displayResult.craterDiameter < 1
                  ? `${(displayResult.craterDiameter * 1000).toFixed(0)}m`
                  : `${displayResult.craterDiameter.toFixed(1)}km`}
              </div>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted-foreground)]">Magnitude</div>
              <div className="font-bold text-sm">
                M{displayResult.earthquakeMagnitude.toFixed(1)}
              </div>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted-foreground)]">Fireball</div>
              <div className="font-bold text-sm">
                {displayResult.fireballRadius < 1
                  ? `${(displayResult.fireballRadius * 1000).toFixed(0)}m`
                  : `${displayResult.fireballRadius.toFixed(1)}km`}
              </div>
            </div>
            <div className="bg-[var(--secondary)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--muted-foreground)]">Blast</div>
              <div className="font-bold text-sm">
                {displayResult.blastWaveDistance < 1
                  ? `${(displayResult.blastWaveDistance * 1000).toFixed(0)}m`
                  : `${displayResult.blastWaveDistance.toFixed(1)}km`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
