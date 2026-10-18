import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Twin Tilt — Neal.fun V2",
  description: "Rotate one room to slide two marbles into their own goals with the same gravity.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
