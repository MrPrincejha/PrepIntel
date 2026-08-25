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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-2">Email Support</h2>
              <p className="mb-4 text-sm">Reach out directly via email:</p>
              <a href="mailto:princejha200490@gmail.com" className="text-primary hover:underline font-medium break-all">
                princejha200490@gmail.com
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-2">Connect with the Creator</h2>
              <p className="mb-4 text-sm">Follow my work or send a message:</p>
              <div className="flex flex-col gap-2">
                <a href="https://www.linkedin.com/in/prince-jha-781263282" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  LinkedIn Profile
                </a>
                <a href="http://prince-portfolio-jet.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Developer Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
