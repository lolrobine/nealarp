import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lava Links — Neal.fun V2",
  description: "Hop across crumbling hex tiles before your path burns away behind you.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
