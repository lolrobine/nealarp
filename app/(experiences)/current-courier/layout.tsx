import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Current Courier — Neal.fun V2",
  description: "Draw one unbroken delivery route through every stop — shorter pays better.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
