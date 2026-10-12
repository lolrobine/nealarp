import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Asteroid Launcher — Neal.fun V2",
  description: "Launch asteroids at Earth and see the devastating impact",
  openGraph: {
    title: "Asteroid Launcher — Neal.fun V2",
    description: "Launch asteroids at Earth and see the devastating impact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Asteroid Launcher — Neal.fun V2",
    description: "Launch asteroids at Earth and see the devastating impact",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
