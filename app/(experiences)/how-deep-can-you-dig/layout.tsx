import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "How Deep Can You Dig? — Neal.fun V2",
  description: "Explore eight discoveries in a simplified journey through Earth.",
  openGraph: {
    title: "How Deep Can You Dig?",
    description: "Explore eight discoveries in a simplified journey through Earth.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
