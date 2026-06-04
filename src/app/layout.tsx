import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { SavedProvider } from "@/context/SavedContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CompTrack — Competition Tracker for Students",
  description:
    "Discover and track college competitions in quant, ML, math, finance, and CS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen">
        <SavedProvider>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            {children}
          </main>
        </SavedProvider>
      </body>
    </html>
  );
}
