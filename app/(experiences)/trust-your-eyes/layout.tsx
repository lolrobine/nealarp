import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Trust Your Eyes — Neal.fun V2",
  description: "Estimate midpoints, centers and angles in six visual singleplayer challenges.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
