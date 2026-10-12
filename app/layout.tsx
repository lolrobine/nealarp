import type { Metadata } from "next";
import "./globals.css";
import { PasswordGate } from "@/lib/components/PasswordGate";
import { ThemeProvider } from "@/lib/components/ThemeProvider";
import { PWARegister } from "@/lib/components/PWARegister";

export const metadata: Metadata = {
  title: "Neal.fun V2 - Interactive Web Experiences",
  description:
    "A collection of quirky, interactive web experiences. Play games, explore visualizations, and have fun!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "Neal.fun V2 - Interactive Web Experiences",
    description: "Play games, explore visualizations, and have fun!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neal.fun V2",
    description: "Interactive web experiences",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <PasswordGate>{children}</PasswordGate>
          <PWARegister />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Neal.fun V2",
              description: "Interactive web experiences",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
            }),
          }}
        />
      </body>
    </html>
  );
}
