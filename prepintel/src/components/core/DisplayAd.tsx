"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DisplayAd() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, [pathname]); // Re-fire when navigating in a SPA

  return (
    <div className="w-full overflow-hidden my-4 flex justify-center rounded-xl bg-black/10 border border-white/5 min-h-[100px]">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-4649925705969255"
        data-ad-slot="2558117204"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
