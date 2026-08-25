import { PublicFooter } from "@/components/core/PublicFooter";
import { Logo } from "@/components/core/Logo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Log in</Link>
      </nav>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <h1 className="text-4xl font-bold mb-8 text-white">Privacy Policy</h1>
        <div className="prose prose-invert prose-white max-w-none text-white/70 space-y-6">
          <p>Last updated: August 25, 2026</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>When you visit PrepIntel, we collect basic usage data, account information (if you register), and cookies necessary to provide our service and display relevant advertisements.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Google AdSense and Cookies</h2>
          <p>We use Google AdSense to display ads. Google and its partners use cookies to serve ads based on your prior visits to our website or other websites on the internet.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Third party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to this site and/or other sites on the Internet.</li>
            <li>You may opt out of personalized advertising by visiting <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ads Settings</a>.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. How We Use Your Data</h2>
          <p>We use the data we collect strictly to provide, maintain, and improve our platform, and to communicate with you regarding your account or updates.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at support@prepintel.com.</p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
