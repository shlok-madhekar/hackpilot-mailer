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
  title: "HackPilot (Beta) | Organizer Tools",
  description:
    "The ultimate AI-powered cold email engine built exclusively for hackathon organizers. Generate, swipe, and send hyper-personalized sponsorship emails.",
  keywords: [
    "hackathon",
    "sponsors",
    "cold email",
    "AI email",
    "hackathon organizer",
    "automation",
  ],
  authors: [{ name: "HackPilot Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hackpilot.io",
    siteName: "HackPilot",
    title: "HackPilot (Beta) - Scale your Hackathon Sponsorships",
    description:
      "Generate hyper-personalized cold emails for your hackathon sponsors. Review drafts Tinder-style and send them seamlessly with zero spam flagging.",
    images: [
      {
        url: "https://hackpilot.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "HackPilot Beta - AI Cold Email Automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HackPilot (Beta) | AI Email Automation",
    description:
      "The ultimate AI-powered cold email engine built exclusively for hackathon organizers.",
    creator: "@hackpilot",
  },
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://hackpilot.io"),
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
