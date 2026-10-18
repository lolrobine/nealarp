import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Square Studio — Neal.fun V2",
  description: "Build true word squares that read the same across and down, one word at a time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
