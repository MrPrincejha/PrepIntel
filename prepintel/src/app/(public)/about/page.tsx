import { PublicFooter } from "@/components/core/PublicFooter";
import { Logo } from "@/components/core/Logo";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-white/5">
        <Link href="/"><Logo size="sm" /></Link>
        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Log in</Link>
      </nav>
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-20">
        <h1 className="text-4xl font-bold mb-8 text-white">About PrepIntel</h1>
        <div className="prose prose-invert prose-white max-w-none text-white/70 space-y-6">
          <p>
            PrepIntel is a placement-intelligence platform designed to help aspiring software engineers crack their dream interviews.
          </p>
          <p>
            The tech interview landscape is noisy. Candidates spend countless hours scrolling through raw interview reports, trying to manually identify patterns. PrepIntel automates this process using advanced AI and Bayesian scoring to extract the exact topics, difficulty distributions, and question patterns asked by top companies.
          </p>
          <p>
            Our mission is to democratize interview preparation by turning unstructured data into actionable, personalized intelligence. Stop guessing what they will ask. Start preparing smarter.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
