import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orbit Orchard — Neal.fun V2",
  description:
    "Launch seeds through fruit rings around a toy star. Fixed-step physics, honest trajectories.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
