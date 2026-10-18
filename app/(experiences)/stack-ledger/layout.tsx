import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stack Ledger — Neal.fun V2",
  description: "Drop swinging numbered blocks to build a tower that follows the house rule.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
