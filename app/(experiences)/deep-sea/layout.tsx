import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Deep Sea — Neal.fun V2",
  description: "Scroll down through the ocean and discover creatures at each depth",
  openGraph: {
    title: "The Deep Sea — Neal.fun V2",
    description: "Scroll down through the ocean and discover creatures at each depth",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Deep Sea — Neal.fun V2",
    description: "Scroll down through the ocean and discover creatures at each depth",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
