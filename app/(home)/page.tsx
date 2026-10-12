"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLiveExperiences } from "@/lib/registry/experiences";
import { GameIcon } from "@/lib/components/GameIcon";
import { getAssetUrl } from "@/lib/utils/assets";
import { useRecentlyPlayedStore } from "@/lib/store/recentlyPlayed";
import { useFavoritesStore } from "@/lib/store/favorites";

const allCategories = [
  { id: "all", name: "All", emoji: "🌟" },
  { id: "game", name: "Games", emoji: "🎮" },
  { id: "visualization", name: "Visualizations", emoji: "📊" },
  { id: "simulation", name: "Simulations", emoji: "🧪" },
  { id: "calculator", name: "Calculators", emoji: "🧮" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "featured" | "alpha" | "category">("recent");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const played = useRecentlyPlayedStore((s) => s.played);
  const clearPlayed = useRecentlyPlayedStore((s) => s.clear);
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const router = useRouter();

  const allExperiences = useMemo(() => getLiveExperiences(), []);

  const filtered = useMemo(() => {
    let list = [...allExperiences];
    if (activeCategory !== "all") {
      list = list.filter((exp) => exp.category === activeCategory);
    }
    if (showFavoritesOnly) {
      list = list.filter((exp) => favorites[exp.id]);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (exp) =>
          exp.title.toLowerCase().includes(q) ||
          exp.description.toLowerCase().includes(q) ||
          exp.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sortBy === "alpha") {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "category") {
      return list.sort(
        (a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)
      );
    }
    if (sortBy === "featured") {
      return list.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
    }
    // recent (default): recently played first, then featured
    return list.sort((a, b) => {
      const aPlayed = played[a.id] || 0;
      const bPlayed = played[b.id] || 0;
      if (aPlayed !== bPlayed) return bPlayed - aPlayed;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });
  }, [allExperiences, activeCategory, search, played, favorites, showFavoritesOnly, sortBy]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (filtered.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        const exp = filtered[focusedIdx];
        if (exp) router.push(`/${exp.id}`);
      } else if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) {
        const rand = filtered[Math.floor(Math.random() * filtered.length)];
        if (rand) router.push(`/${rand.id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, focusedIdx, router]);

  useEffect(() => {
    // Clamp focused index when filtered list shrinks
    if (focusedIdx >= filtered.length && filtered.length > 0) {
      setFocusedIdx(filtered.length - 1);
      return;
    }
    const el = document.querySelector(`[data-idx="${focusedIdx}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedIdx, filtered.length]);

  const recentlyPlayedList = useMemo(() => {
    const ids = Object.entries(played)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
      .slice(0, 5)
      .map(([id]) => id);
    return allExperiences.filter((exp) => ids.includes(exp.id));
  }, [played, allExperiences]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-cyan-600 to-sky-600 dark:from-emerald-300 dark:via-cyan-400 dark:to-sky-500 bg-clip-text text-transparent">
          Games and Stuff
        </h1>
        <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-2xl mx-auto mb-8">
          Interactive web experiences that make you think, laugh, and wonder
        </p>

        <div className="max-w-md mx-auto relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search experiences..."
              aria-label="Search experiences"
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-full px-5 py-3 pr-12 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)] transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
              🔍
            </span>
          </div>
          <button
            onClick={() => {
              const rand =
                filtered[Math.floor(Math.random() * filtered.length)] ??
                allExperiences[Math.floor(Math.random() * allExperiences.length)];
              if (rand) router.push(`/${rand.id}`);
            }}
            aria-label="Random experience"
            title="Random (press R)"
            className="px-4 py-3 bg-[var(--secondary)] rounded-full text-sm hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            🎲
          </button>
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-2">
          Press R for random • Arrow keys navigate • Enter to open
        </p>
      </div>

      {recentlyPlayedList.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>🕒</span> Recently played
            </h2>
            <button
              onClick={() => clearPlayed()}
              className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-2 py-1 rounded-full bg-[var(--secondary)]"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlyPlayedList.map((exp) => (
              <Link
                key={exp.id}
                href={`/${exp.id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-full px-4 py-2 hover:border-[var(--primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
              >
                <GameIcon
                  src={exp.icon}
                  alt={`${exp.title} icon`}
                  className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-sm font-medium">{exp.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {allCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={activeCategory === cat.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                activeCategory === cat.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Sort experiences"
            className="px-3 py-2 rounded-full text-xs font-medium bg-[var(--secondary)] border border-[var(--border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="recent">Recent first</option>
            <option value="featured">Featured first</option>
            <option value="alpha">A-Z</option>
            <option value="category">By category</option>
          </select>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            aria-pressed={showFavoritesOnly}
            className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
              showFavoritesOnly
                ? "bg-amber-500/20 border-amber-500/50 text-amber-600"
                : "bg-[var(--secondary)] border-[var(--border)] text-[var(--muted-foreground)]"
            }`}
          >
            ⭐{" "}
            {Object.keys(favorites).length > 0 ? `(${Object.keys(favorites).length})` : "Favorites"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted-foreground)]">
          <p className="text-4xl mb-4">🔍</p>
          <p>
            No experiences found for &quot;{search}&quot;{showFavoritesOnly ? " in favorites" : ""}{" "}
            in {activeCategory}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("all");
              setShowFavoritesOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-[var(--secondary)] rounded-full text-sm hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((experience, idx) => {
            const isRecentlyPlayed = !!played[experience.id];
            const isFav = !!favorites[experience.id];
            const isFocused = idx === focusedIdx;
            return (
              <article key={experience.id} data-idx={idx} className="group relative">
                <Link
                  href={`/${experience.id}`}
                  aria-label={`Open ${experience.title} — ${experience.description}`}
                  className={`block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${isFocused ? "ring-2 ring-[var(--ring)]" : ""}`}
                >
                  <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg will-change-transform">
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950">
                      <Image
                        src={getAssetUrl(experience.thumbnail)}
                        alt={`${experience.title} thumbnail`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        priority={idx < 2}
                        loading={idx < 2 ? undefined : "lazy"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                      />
                      {isRecentlyPlayed && (
                        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                          <span>🕒</span> Played
                        </div>
                      )}
                      {isFav && (
                        <div className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px] px-2 py-1 rounded-full">
                          ⭐
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <GameIcon
                            src={experience.icon}
                            alt={`${experience.title} icon`}
                            className="h-10 w-10 flex-shrink-0 rounded-lg border border-[var(--border)] bg-[var(--secondary)] object-cover"
                          />
                          <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors truncate">
                            {experience.title}
                          </h3>
                        </div>
                        <span className="flex-shrink-0 text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-1 rounded-full">
                          {experience.category}
                        </span>
                      </div>
                      <p className="text-[var(--muted-foreground)] mb-4 text-sm line-clamp-2">
                        {experience.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {experience.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite(experience.id);
                  }}
                  aria-label={
                    isFav
                      ? `Remove ${experience.title} from favorites`
                      : `Add ${experience.title} to favorites`
                  }
                  aria-pressed={isFav}
                  className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm border backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] ${
                    isFav
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-black/50 border-white/20 text-white/70 hover:text-white hover:bg-black/70"
                  }`}
                >
                  {isFav ? "★" : "☆"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <footer className="mt-24 text-center text-[var(--muted-foreground)]">
        <p>
          Inspired by{" "}
          <a
            href="https://neal.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] rounded"
          >
            neal.fun
          </a>{" "}
          by Neal Agarwal
        </p>
        <p className="text-sm mt-2">
          Open source on GitHub — {filtered.length} experiences • Press R for surprise
        </p>
      </footer>
    </div>
  );
}
