import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My New Experience — Neal.fun V2",
  description: "A quirky, interactive web experience. Replace this description!",
  openGraph: {
    title: "My New Experience — Neal.fun V2",
    description: "A quirky, interactive web experience.",
  },
};

export default function TemplateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
