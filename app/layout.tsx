import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// TODO: update to a real custom domain once you buy one — this is the
// Vercel-provided URL, and it's used to resolve absolute URLs for
// social-share previews (Open Graph/Twitter images).
const siteUrl = "https://tailred.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tailred — Turn a side hustle into a running business",
    template: "%s — Tailred",
  },
  description:
    "Free tools to start and run a side hustle: a business plan, a budget calculator, inventory and profit tracking, invoicing, and getting paid — all in one place, built for resellers, personal trainers, and service businesses just starting out.",
  keywords: [
    "side hustle app",
    "reselling business app",
    "invoicing app for small business",
    "free invoicing app",
    "business plan generator",
    "budget calculator for small business",
    "inventory tracker for resellers",
    "personal trainer invoicing",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tailred",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Tailred",
    title: "Tailred — Turn a side hustle into a running business",
    description:
      "Plan it, price it, track it, get paid — free tools for resellers, trainers, and service businesses just starting out.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Tailred" }],
  },
  twitter: {
    card: "summary",
    title: "Tailred — Turn a side hustle into a running business",
    description:
      "Plan it, price it, track it, get paid — free tools for resellers, trainers, and service businesses just starting out.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2F4858",
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
