import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Light Loom — Neal.fun V2",
  description: "Split white light through prisms and mirrors to colour every target.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
