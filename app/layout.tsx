import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PWAProvider } from "@/components/pwa-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://blui.online"),
  title: { default: "BluiSkill — Plan. Build. Secure.", template: "%s | BluiSkill" },
  description: "Plan products and review code security in BluiSkill.",
  applicationName: "BluiSkill",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BluiSkill"
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }]
  },
  formatDetection: { telephone: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <PWAProvider />
        {children}
      </body>
    </html>
  );
}
