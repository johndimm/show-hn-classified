import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: "Show HN Classified - Browse Innovation by Category",
  description: "A curated and classified directory of apps submitted to Hacker News. Discover the best tools, games, and visualizations from the HN community.",
  openGraph: {
    title: "Show HN Classified",
    description: "Browse the best of Hacker News Show HN submissions, automatically classified into meaningful categories.",
    images: [
      {
        url: "/screenshot.png",
        width: 1200,
        height: 630,
        alt: "Show HN Classified Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Show HN Classified",
    description: "Browse the best of Hacker News Show HN submissions, automatically classified into meaningful categories.",
    images: ["/screenshot.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
