import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clue School — Neal.fun V2",
  description:
    "Learn how cryptic clues work with original clues and plain-language wordplay lessons.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
