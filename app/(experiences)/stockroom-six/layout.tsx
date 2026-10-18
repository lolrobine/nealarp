import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stockroom Six — Neal.fun V2",
  description: "Twelve days of fictional demand forecasting for one tiny stockroom.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
