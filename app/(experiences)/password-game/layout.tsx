import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Password Game — Neal.fun V2",
  description: "Create a password that satisfies increasingly absurd rules",
  openGraph: {
    title: "The Password Game — Neal.fun V2",
    description: "Create a password that satisfies increasingly absurd rules",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Password Game — Neal.fun V2",
    description: "Create a password that satisfies increasingly absurd rules",
  },
};

export default function ExperienceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
