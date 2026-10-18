import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiny Town Tactics — Neal.fun V2",
  description:
    "A sixteen-tile placement puzzle where every neighbourhood counts. Inspired by ISLANDERS.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
