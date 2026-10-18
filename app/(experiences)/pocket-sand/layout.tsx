import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pocket Sand — Neal.fun V2",
  description:
    "A tiny falling-sand sandbox with six sculpt goals. Physics included, drama optional.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
