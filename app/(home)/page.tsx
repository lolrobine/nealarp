"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import experiences from "@/content/experiences.json";
import { GameIcon } from "@/lib/components/GameIcon";
import { getAssetUrl } from "@/lib/utils/assets";

type Experience = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  thumbnail: string;
  featured: boolean;
  status: string;
  tags: string[];
};

export default function Home() {
  const featuredExperiences = (experiences as Experience[]).filter(
    (exp) => exp.featured && exp.status === "live"
  );
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-300 via-cyan-400 to-sky-500 bg-clip-text text-transparent">
          Games and Stuff
        </h1>
        <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
          Interactive web experiences that make you think, laugh, and wonder
        </p>
      </div>

      {/* Experience Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredExperiences.map((experience) => (
          <div key={experience.id}>
            <Link href={`/${experience.id}`}>
              <motion.div
                className="group relative bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)] transition-all duration-300"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Game artwork */}
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-950 via-sky-950 to-emerald-950">
                  <Image
                    src={getAssetUrl(experience.thumbnail)}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <GameIcon
                        src={experience.icon}
                        className="h-10 w-10 flex-shrink-0 rounded-lg border border-[var(--border)] bg-[var(--secondary)] object-cover"
                      />
                      <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors">
                        {experience.title}
                      </h3>
                    </div>
                    <span className="flex-shrink-0 text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-1 rounded-full">
                      {experience.category}
                    </span>
                  </div>
                  <p className="text-[var(--muted-foreground)] mb-4">
                    {experience.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {experience.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-24 text-center text-[var(--muted-foreground)]">
        <p>
          Inspired by{" "}
          <a
            href="https://neal.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline"
          >
            neal.fun
          </a>
          {" "}by Neal Agarwal
        </p>
        <p className="text-sm mt-2">
          Open source on GitHub
        </p>
      </footer>
    </div>
  );
}
