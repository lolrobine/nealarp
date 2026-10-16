import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "One Small Change — Neal.fun V2",
  description: "Change one parameter and compare a bouncing-ball experiment.",
  openGraph: {
    title: "One Small Change",
    description: "Change one parameter and compare a bouncing-ball experiment.",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
