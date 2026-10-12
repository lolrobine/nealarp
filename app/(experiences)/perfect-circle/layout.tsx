import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfect Circle — Neal.fun V2",
  description: "Try to draw a perfect circle and get scored on your accuracy",
  openGraph: {
    title: "Perfect Circle — Neal.fun V2",
    description: "Try to draw a perfect circle and get scored on your accuracy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perfect Circle — Neal.fun V2",
    description: "Try to draw a perfect circle and get scored on your accuracy",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
