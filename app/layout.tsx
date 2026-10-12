import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL("https://blui.online"), title: { default: "Blui — Planeia. Constrói. Protege.", template: "%s | Blui" }, description: "Transforma ideias em roadmaps e identifica riscos no teu código com IA." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt"><body className={inter.variable}>{children}</body></html>; }
