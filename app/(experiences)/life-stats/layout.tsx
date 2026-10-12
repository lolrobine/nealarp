import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life Stats — Neal.fun V2",
  description: "Enter your birthday and discover mind-blowing statistics about your life",
  openGraph: {
    title: "Life Stats — Neal.fun V2",
    description: "Enter your birthday and discover mind-blowing statistics about your life",
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Stats — Neal.fun V2",
    description: "Enter your birthday and discover mind-blowing statistics about your life",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
