import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Neal.fun V2 - Interactive Web Experiences",
  description:
    "A collection of quirky, interactive web experiences. Play games, explore visualizations, and have fun!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
