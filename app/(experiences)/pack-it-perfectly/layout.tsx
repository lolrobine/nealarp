import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Pack It Perfectly — Neal.fun V2",
  description: "Fit every piece into three grid-based suitcase puzzles.",
  openGraph: {
    title: "Pack It Perfectly",
    description: "Fit every piece into three grid-based suitcase puzzles.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
