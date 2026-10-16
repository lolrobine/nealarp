import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "The Form Game — Neal.fun V2",
  description: "Complete ten absurd bureaucratic approvals in a solo puzzle.",
  openGraph: {
    title: "The Form Game",
    description: "Complete ten absurd bureaucratic approvals in a solo puzzle.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
