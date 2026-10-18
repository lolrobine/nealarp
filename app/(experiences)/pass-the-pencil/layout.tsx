import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pass the Pencil — Neal.fun V2",
  description: "A drawing-telephone game with memory rounds and original prompts.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
