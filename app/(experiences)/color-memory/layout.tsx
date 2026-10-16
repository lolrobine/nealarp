import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Color Memory — Neal.fun V2",
  description: "Rebuild colors from memory in five solo rounds.",
  openGraph: {
    title: "Color Memory",
    description: "Rebuild colors from memory in five solo rounds.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
