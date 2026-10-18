import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Block Talk — Neal.fun V2",
  description: "Describe a block pattern on the A1–D4 grid — or beat your own memory at it.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
