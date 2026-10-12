import type { Metadata } from "next";
import "./globals.css";
import { PasswordGate } from "@/lib/components/PasswordGate";
import { ThemeProvider } from "@/lib/components/ThemeProvider";
import { PWARegister } from "@/lib/components/PWARegister";

export const metadata: Metadata = {
  title: "Nealarp - Interactive Web Experiences",
  description:
    "A collection of quirky, interactive web experiences. Play games, explore visualizations, and have fun!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "Nealarp - Interactive Web Experiences",
    description: "Play games, explore visualizations, and have fun!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nealarp",
    description: "Interactive web experiences",
  },
};

function ThemeScript() {
  // Inline script to apply theme before hydration, respects browser settings
  // Reads zustand persist storage (theme-storage) and falls back to prefers-color-scheme
  const code = `
(function() {
  try {
    var stored = localStorage.getItem('theme-storage');
    var theme = 'system';
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        theme = (parsed && parsed.state && parsed.state.theme) || 'system';
      } catch {}
    }
    var resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  } catch {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
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
              name: "Nealarp",
              description: "Interactive web experiences",
              url: process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
            }),
          }}
        />
      </body>
    </html>
  );
}
