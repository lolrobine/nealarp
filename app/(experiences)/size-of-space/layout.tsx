import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Size of Space — Neal.fun V2",
  description: "Explore the incredible scale of the universe from humans to galaxies",
  openGraph: {
    title: "Size of Space — Neal.fun V2",
    description: "Explore the incredible scale of the universe from humans to galaxies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Size of Space — Neal.fun V2",
    description: "Explore the incredible scale of the universe from humans to galaxies",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
