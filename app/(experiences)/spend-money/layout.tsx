import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spend Money — Neal.fun V2",
  description: "Spend a trillion dollars buying everything from yachts to social media platforms",
  openGraph: {
    title: "Spend Money — Neal.fun V2",
    description: "Spend a trillion dollars buying everything from yachts to social media platforms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spend Money — Neal.fun V2",
    description: "Spend a trillion dollars buying everything from yachts to social media platforms",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
