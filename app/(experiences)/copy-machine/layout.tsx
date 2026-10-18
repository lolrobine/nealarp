import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copy Machine — Neal.fun V2",
  description: "Copy a doodle, then copy your copy five times and watch your hand drift.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
