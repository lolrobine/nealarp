import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lane General — Neal.fun V2",
  description: "Draft three units and watch a deterministic auto-resolver settle the lane.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
