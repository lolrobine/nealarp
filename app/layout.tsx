import type { Metadata } from "next";
import "./globals.css";
import { PasswordGate } from "@/lib/components/PasswordGate";
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
        <ThemeProvider>
          {/* Site-wide password screen: keeps every route (and the 404 page)
              hidden until the visitor enters the password. See
              lib/auth/sitePassword.ts to change the password. */}
          <PasswordGate>{children}</PasswordGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
