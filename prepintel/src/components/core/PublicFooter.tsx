import Link from "next/link";
import { Logo } from "./Logo";

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-white/5 bg-black/40 py-12 relative z-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Logo size="sm" />
          <p className="text-xs text-white/50 max-w-xs text-center md:text-left">
            PrepIntel democratizes interview preparation by organizing real interview reports into actionable, personalized intelligence.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-white/60">
          <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 text-center text-xs text-white/30">
        &copy; {new Date().getFullYear()} PrepIntel. All rights reserved.
      </div>
    </footer>
  );
}
