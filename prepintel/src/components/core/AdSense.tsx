"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function AdSense() {
  const pathname = usePathname();

  // Pages where ads should NOT be displayed (e.g. auth walls, simple forms)
  const noAdsRoutes = ["/login", "/signup", "/forgot-password"];

  if (noAdsRoutes.includes(pathname)) {
    return null;
  }

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4649925705969255"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
