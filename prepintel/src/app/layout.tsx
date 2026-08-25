import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL('https://prepintel-nine.vercel.app'),
  title: {
    template: '%s | PrepIntel',
    default: 'PrepIntel | Know What Companies Ask. Prepare Smarter.',
  },
  description: 'The premier placement-intelligence platform. Discover exact interview questions, difficulty distributions, and personalized prep plans for top tech companies.',
  openGraph: {
    title: 'PrepIntel | Know What Companies Ask. Prepare Smarter.',
    description: 'Discover exact interview questions and difficulty distributions for top tech companies.',
    url: 'https://prepintel-nine.vercel.app',
    siteName: 'PrepIntel',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrepIntel | Know What Companies Ask. Prepare Smarter.',
    description: 'The premier placement-intelligence platform.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4649925705969255"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
