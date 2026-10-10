"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import experiences from "@/content/experiences.json";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[var(--primary)] to-purple-500 bg-clip-text text-transparent">
          Games and Stuff
        </h1>
        <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
          Interactive web experiences that make you think, laugh, and wonder
        </p>
      </motion.div>

      {/* Experience Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredExperiences.map((experience, index) => (
          <motion.div
            key={experience.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/${experience.id}`}>
              <motion.div
                className="group relative bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-[var(--primary)] transition-all duration-300"
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Thumbnail Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center">
                  <div className="text-6xl opacity-20">🎮</div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold group-hover:text-[var(--primary)] transition-colors">
                      {experience.title}
                    </h3>
                    <span className="text-xs bg-[var(--secondary)] text-[var(--muted-foreground)] px-2 py-1 rounded-full">
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
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-24 text-center text-[var(--muted-foreground)]"
      >
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
      </motion.footer>
    </div>
  );
}
