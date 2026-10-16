import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "One Second Off — Neal.fun V2",
  description: "Stop the hidden timer and test your sense of time in a solo challenge.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
