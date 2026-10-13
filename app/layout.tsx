import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL("https://blui.online"), title: { default: "BluiSkill — Plan. Build. Secure.", template: "%s | BluiSkill" }, description: "Plan products and review code security in BluiSkill." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt"><body className={inter.variable}>{children}</body></html>; }
