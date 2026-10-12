import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL("https://blui.online"), title: { default: "BluiSkill — Plan. Build. Secure.", template: "%s | BluiSkill" }, description: "Turn product ideas into technical roadmaps and review code for security risks with AI." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body className={inter.variable}>{children}</body></html>; }
