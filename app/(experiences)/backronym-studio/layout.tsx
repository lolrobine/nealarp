import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backronym Studio — Neal.fun V2",
  description:
    "Write phrases that spell hidden words through their first letters, scored by a visible rubric.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
