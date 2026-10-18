import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gate Crash — Neal.fun V2",
  description: "Memorise the rule, then crash the one gate it describes before doubt sets in.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
