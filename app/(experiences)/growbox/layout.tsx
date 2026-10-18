import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Growbox — Neal.fun V2",
  description: "Place eight greenhouse upgrades in the right order and watch why each one grows.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
