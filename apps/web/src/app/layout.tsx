import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "PARALLEL — Live 100 lives. Choose the best one.",
  description: "Multiple versions of you, running in parallel. Each morning, they report back.",
  openGraph: {
    title: "PARALLEL",
    description: "Live 100 lives. Choose the best one.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${geistMono.variable}`}>
      <body className="bg-parallel-bg text-parallel-text font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
