import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Tiny Ecosystem — Neal.fun V2",
  description: "Keep a fictional ecosystem balanced for twelve turns.",
  openGraph: {
    title: "Tiny Ecosystem",
    description: "Keep a fictional ecosystem balanced for twelve turns.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
