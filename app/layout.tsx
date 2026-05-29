import type { Metadata } from "next";
import { ThemeScript } from "@/components/shared/ThemeScript";
import { AppBar } from "@/components/shared/AppBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuel — Weekly Endurance Fuelling",
  description:
    "Personalised weekly fuelling plans and grocery lists for endurance athletes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface-0 text-ink font-body antialiased">
        <AppBar />
        {children}
      </body>
    </html>
  );
}
