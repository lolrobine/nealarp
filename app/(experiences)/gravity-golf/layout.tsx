import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Gravity Golf — Neal.fun V2",
  description: "Bend your shots around planets in three solo courses.",
  openGraph: {
    title: "Gravity Golf",
    description: "Bend your shots around planets in three solo courses.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
