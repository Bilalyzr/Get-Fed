import type { Metadata, Viewport } from "next";
import { Inter, Bodoni_Moda } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Display face: Bodoni Moda stands in for Melloida (the chosen font).
// Dropping public/fonts/MelloidaDemo.ttf in takes priority via @font-face.
const displayFont = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Get Fed",
    template: "%s · Get Fed",
  },
  description:
    "Real-time surplus food coordination — connect time-sensitive surplus with verified recipients before the pickup window expires.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf5dd",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased min-h-dvh flex flex-col bg-page text-zen-text" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
