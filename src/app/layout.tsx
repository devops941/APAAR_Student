import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "APAAR Student Academic Platform",
    template: "%s | APAAR Platform",
  },
  description:
    "APAAR ID-Based Student Data Management & Verification Platform for AICTE-Approved Institutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-canvas text-ink-light">
        {children}
      </body>
    </html>
  );
}
