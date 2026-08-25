"use client";

import { Logo } from "@/components/core/Logo";
import { GradientButton } from "@/components/core/GradientButton";
import { GlassPanel } from "@/components/core/GlassPanel";
import { PublicFooter } from "@/components/core/PublicFooter";
import { Building2, BrainCircuit, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Logo size="lg" />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/dashboard">
            <GradientButton>Go to Dashboard</GradientButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center max-w-7xl mx-auto w-full px-6 py-12 gap-12 lg:gap-24">
        
        {/* Left Column (Copy) */}
        <div className="flex-1 flex flex-col items-start gap-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest text-primary uppercase">
            Placement Intelligence Platform
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
            Know What Companies Ask.<br />
            <span className="text-gradient">Prepare Smarter.</span>
          </h1>
          
          <p className="text-lg text-white/60 max-w-xl leading-relaxed">
            A placement-intelligence platform that turns noisy interview reports into uncertainty-aware, personalized question recommendations. Stop guessing, start cracking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
            {[
              { icon: Building2, title: "Company-Wise Insights", desc: "Data driven by real OA & interview reports." },
              { icon: BrainCircuit, title: "AI-Powered Extraction", desc: "Turns unstructured text into structured topics." },
              { icon: Target, title: "Smart Recommendations", desc: "Bayesian scoring engine finds the exact patterns." },
              { icon: TrendingUp, title: "Track. Improve. Crack.", desc: "Personalized roadmaps based on your skill gaps." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white mb-1">{feature.title}</h2>
                  <p className="text-xs text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-6 w-full">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <GradientButton withArrow className="w-full sm:w-auto py-4 text-base px-8">
                Start Preparing Smarter
              </GradientButton>
            </Link>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-white/10 flex items-center justify-center overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-background bg-white/5 backdrop-blur-md flex items-center justify-center text-xs font-bold text-white">
                5k+
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Visuals) */}
        <div className="flex-1 w-full relative h-[600px] flex items-center justify-center perspective-[1000px]">
          {/* Dashboard floating card */}
          <motion.div 
            initial={{ rotateY: -15, rotateX: 10, y: 0 }}
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute z-20 w-full max-w-lg"
          >
            <GlassPanel className="p-6 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-6">
                <div className="h-4 w-32 bg-white/10 rounded-full" />
                <div className="h-6 w-16 bg-status-success/20 rounded-full" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-white/20 rounded-full" />
                        <div className="h-2 w-16 bg-white/10 rounded-full" />
                      </div>
                    </div>
                    <div className="h-5 w-12 bg-primary/20 rounded-md" />
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* 3D Eye / Graphics decoration */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="absolute z-10 w-[400px] h-[400px] border border-white/5 rounded-full border-dashed"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="absolute z-10 w-[500px] h-[500px] border border-white/5 rounded-full border-dashed"
          />

          {/* Floating Orbiting Pills */}
          <motion.div
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
            className="absolute z-30 top-1/4 right-0 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xl"
          >
            Real Data
          </motion.div>
          <motion.div
            animate={{ y: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
            className="absolute z-30 bottom-1/4 left-0 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xl"
          >
            Smart Analysis
          </motion.div>
          <motion.div
            animate={{ y: [-8, 8, -8] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute z-30 -bottom-10 right-20 px-4 py-2 rounded-full bg-gradient-primary border border-white/20 text-xs font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.5)]"
          >
            Crack Placements
          </motion.div>
        </div>

        {/* Trust bar */}
        <div className="border-t border-white/5 mt-auto py-10 bg-black/20 w-full self-end">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-white/50 tracking-widest uppercase mb-8">
              Real OA & Interview Intelligence Covering Top Companies
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {["Google", "Microsoft", "Amazon", "Adobe", "Flipkart", "PayPal"].map(company => (
                <span key={company} className="text-2xl font-bold font-serif tracking-tighter text-white">
                  {company}
                </span>
              ))}
            </div>
            <p className="text-center text-[10px] text-white/30 mt-6 max-w-2xl mx-auto">
              Company names and logos are trademarks of their respective owners. PrepIntel is an independent interview-intelligence platform and is not affiliated with, endorsed by, or sponsored by these companies.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
