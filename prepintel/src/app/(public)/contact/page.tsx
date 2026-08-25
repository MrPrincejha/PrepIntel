import { PublicFooter } from "@/components/core/PublicFooter";
import { Logo } from "@/components/core/Logo";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Log in</Link>
      </nav>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <h1 className="text-4xl font-bold mb-8 text-white">Contact Us</h1>
        <div className="prose prose-invert prose-white max-w-none text-white/70 space-y-6">
          <p>
            Have a question, feedback, or need support? We'd love to hear from you.
          </p>
          <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-2">Email Support</h2>
            <p className="mb-4">You can reach our support team directly at:</p>
            <a href="mailto:support@prepintel.com" className="text-primary hover:underline font-medium">
              support@prepintel.com
            </a>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
