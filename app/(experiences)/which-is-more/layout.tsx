import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Which Is More? — Neal.fun V2",
  description: "Compare speeds and sizes in fictional measurement puzzles.",
  openGraph: {
    title: "Which Is More?",
    description: "Compare speeds and sizes in fictional measurement puzzles.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
