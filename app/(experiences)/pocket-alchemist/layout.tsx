import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pocket Alchemist — Neal.fun V2",
  description: "Mix hidden traits to discover concepts. No recipes — only geometry.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
