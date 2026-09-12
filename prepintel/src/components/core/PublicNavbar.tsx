import Link from "next/link";
import { Logo } from "@/components/core/Logo";
import { GradientButton } from "@/components/core/GradientButton";

export function PublicNavbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
      <Logo size="lg" />
      <div className="flex items-center gap-6">
        <Link href="/questions" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
          Questions
        </Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
          Log in
        </Link>
        <Link href="/dashboard">
          <GradientButton>Go to Dashboard</GradientButton>
        </Link>
      </div>
    </nav>
  );
}
