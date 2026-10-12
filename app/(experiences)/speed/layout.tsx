import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Speed — Neal.fun V2",
  description: "Compare the speed of everything from snails to light",
  openGraph: {
    title: "Speed — Neal.fun V2",
    description: "Compare the speed of everything from snails to light",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speed — Neal.fun V2",
    description: "Compare the speed of everything from snails to light",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
