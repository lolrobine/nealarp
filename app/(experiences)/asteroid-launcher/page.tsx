"use client";

import { Picto, type PictoName } from "@/lib/components/games/Picto";
import { useState, useMemo, useCallback } from "react";
import { GameIcon } from "@/lib/components/GameIcon";
import { calculateImpact, presets } from "./data";
import { CraterCanvas } from "./CraterCanvas";
import { WorldMap, type MapImpact, type ShakeEvent, getImpactColor } from "./WorldMap";
import { CountryMap } from "./CountryMap";
import { countries, isInBounds } from "./countryMaps";
import { getAssetUrl } from "@/lib/utils/assets";

const locations: { id: string; name: string; density: number; icon: PictoName; desc: string }[] = [
  { id: "ocean", name: "Ocean", density: 10, icon: "ocean", desc: "Ocean" },
  { id: "desert", name: "Desert", density: 5, icon: "desert", desc: "Desert" },
  { id: "rural", name: "Rural", density: 50, icon: "rural", desc: "Rural" },
  { id: "suburban", name: "Suburb", density: 500, icon: "suburb", desc: "Suburb" },
  { id: "city", name: "City", density: 5000, icon: "city", desc: "City" },
  { id: "megacity", name: "Megacity", density: 20000, icon: "megacity", desc: "Megacity" },
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

  const [mapMode, setMapMode] = useState<"world" | "countries">("countries");
  const [selectedCountryIds, setSelectedCountryIds] = useState<string[]>([
    "usa",
    "china",
    "india",
    "brazil",
    "russia",
    "australia",
  ]);
  const [countrySearch, setCountrySearch] = useState("");

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

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    const q = countrySearch.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.flag.includes(q)
    );
  }, [countrySearch]);

  const selectedCountries = countries.filter((c) => selectedCountryIds.includes(c.id));

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (impacts.length >= 100) setImpacts((prev) => prev.slice(1));
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
      setImpacts((prev) => [...prev.slice(-99), newImpact]);
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

  const handleRemoveSingle = useCallback((id: string) => {
    setImpacts((prev) => prev.filter((i) => i.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
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
      if (prev.length >= 8) return [...prev.slice(1), id];
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
    for (const c of countries)
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
            Launch asteroids • World + {countries.length} countries • Multi-select
          </p>
        </div>

        <div className="flex justify-center mb-4 gap-2">
          <div className="inline-flex rounded-full border bg-[var(--card)] p-1">
            <button
              onClick={() => setMapMode("world")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "world" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--secondary)]"}`}
            >
              <Picto name="globe" /> World
            </button>
            <button
              onClick={() => setMapMode("countries")}
              className={`px-5 py-1.5 rounded-full text-sm font-medium ${mapMode === "countries" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "hover:bg-[var(--secondary)]"}`}
            >
              <Picto name="map" /> Countries ({countries.length})
            </button>
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
                <div className="flex flex-col md:flex-row gap-2 justify-between items-start md:items-center mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">
                      Countries • {countries.length} maps • Multi-select up to 8
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[var(--secondary)] rounded-full">
                      {filteredCountries.length} shown • {selectedCountryIds.length} selected
                    </span>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="w-full px-3 py-1.5 pr-8 rounded-full border bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] opacity-50">
                        <Picto name="search" size={16} />
                      </span>
                    </div>
                    <button
                      onClick={() => setCountrySearch("")}
                      className="px-3 py-1.5 text-[10px] rounded-full border bg-[var(--secondary)] hover:bg-[var(--muted)]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3 flex-wrap">
                  <button
                    onClick={() => setSelectedCountryIds(countries.slice(0, 8).map((c) => c.id))}
                    className="min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)] hover:bg-[var(--muted)]"
                  >
                    Top 8
                  </button>
                  <button
                    onClick={() =>
                      setSelectedCountryIds([
                        "usa",
                        "china",
                        "india",
                        "brazil",
                        "russia",
                        "australia",
                        "canada",
                        "uk",
                      ])
                    }
                    className="min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                  >
                    Biggest
                  </button>
                  <button
                    onClick={() =>
                      setSelectedCountryIds([
                        "italy",
                        "spain",
                        "france",
                        "germany",
                        "uk",
                        "greece",
                        "portugal",
                        "ireland",
                      ])
                    }
                    className="min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                  >
                    Europe
                  </button>
                  <button
                    onClick={() => setSelectedCountryIds(["usa"])}
                    className="min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                  >
                    Only USA
                  </button>
                  <button
                    onClick={() =>
                      setSelectedCountryIds(filteredCountries.slice(0, 8).map((c) => c.id))
                    }
                    className="min-h-6 inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[10px] rounded-full border bg-[var(--secondary)]"
                  >
                    Select filtered
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {filteredCountries.map((c) => {
                    const count = countryCounts[c.id] ?? 0;
                    const isSelected = selectedCountryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCountry(c.id)}
                        className={`group relative text-left rounded-lg border overflow-hidden transition-all ${isSelected ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/40" : "border-[var(--border)] hover:border-[var(--primary)]/50"}`}
                      >
                        <div className="aspect-[16/10] relative bg-[#0f1e2e] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAssetUrl(c.image)}
                            alt={c.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                          <div className="absolute bottom-1 left-1.5 right-1.5 flex justify-between items-end pointer-events-none">
                            <span className="text-white text-[11px] font-bold flex items-center gap-1 drop-shadow-md">
                              {c.flag} {c.name}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] bg-white text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                <Picto name="check" size={14} />
                              </span>
                            )}
                          </div>
                          {count > 0 && (
                            <span className="absolute top-1 right-1 text-[9px] bg-red-700 text-white rounded-full px-1.5 py-0.5 font-bold pointer-events-none">
                              {count}
                            </span>
                          )}
                        </div>
                        <div className="px-2 py-1 bg-[var(--card)] text-[10px] text-[var(--muted-foreground)] flex justify-between">
                          <span className="truncate">{c.capital}</span>
                          <span>{c.population}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredCountries.length === 0 && (
                  <div className="text-center py-8 text-xs text-[var(--muted-foreground)]">
                    No countries found for &quot;{countrySearch}&quot;
                  </div>
                )}
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
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg text-xs"
                  >
                    Remove selected ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={() => setSelectedIds(impacts.map((i) => i.id))}
                  className="px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs"
                >
                  Select all asteroids
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--muted)] rounded-lg text-xs"
                >
                  Deselect all
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
                Asteroids ({impacts.length}) • Multi-select to delete • Click to toggle
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {impacts.map((impact, idx) => {
                  const isSelected = selectedIds.includes(impact.id);
                  return (
                    <div
                      key={impact.id}
                      className={`px-3 py-2 rounded-lg border text-xs flex items-center gap-2 ${isSelected ? "bg-[var(--primary)]/15 border-[var(--primary)]/50" : "bg-[var(--secondary)] border-[var(--border)]"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectImpact(impact.id)}
                        className="shrink-0"
                      />
                      <button
                        onClick={() => handleSelectImpact(impact.id)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
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
                      <button
                        onClick={() => handleRemoveSingle(impact.id)}
                        aria-label={`Remove impact at ${impact.lat.toFixed(1)}°, ${impact.lng.toFixed(1)}°`}
                        className="min-h-6 inline-flex items-center justify-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-[10px] shrink-0"
                      >
                        <Picto name="cross" size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <Picto name="asteroid" /> Asteroid
            </h3>
            <div>
              <label htmlFor="asteroid-diameter" className="block text-sm font-medium mb-1">
                Diameter: {diameter < 1000 ? `${diameter} m` : `${(diameter / 1000).toFixed(1)} km`}
              </label>
              <input
                id="asteroid-diameter"
                type="range"
                min="1"
                max="15000"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label htmlFor="asteroid-density" className="block text-sm font-medium mb-1">
                Density: {density} kg/m³
              </label>
              <input
                id="asteroid-density"
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
              <label htmlFor="asteroid-velocity" className="block text-sm font-medium mb-1">
                Velocity: {velocity} km/s
              </label>
              <input
                id="asteroid-velocity"
                type="range"
                min="5"
                max="72"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </div>
            <div>
              <label htmlFor="asteroid-angle" className="block text-sm font-medium mb-1">
                Angle: {angle}°
              </label>
              <input
                id="asteroid-angle"
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
                Target: <Picto name={loc.icon} /> {loc.name}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {locations.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLocation(l.id)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border ${location === l.id ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]" : "bg-[var(--secondary)] border-[var(--border)]"}`}
                  >
                    <Picto name={l.icon} size={14} /> {l.name}
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
                        • M{r.earthquakeMagnitude.toFixed(1)}
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
                ? `${selectedIds.length} impacts`
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
