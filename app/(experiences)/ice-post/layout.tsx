import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ice Post — Neal.fun V2",
  description: "Slide across the ice to deliver the post while the postman walks his round.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
