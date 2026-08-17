"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { Hash, Layers, GitBranch, Network, Search, Component, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "arrays", name: "Arrays", icon: Hash, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: "1d-dp", name: "Dynamic Programming", icon: Layers, color: "text-violet-400", bg: "bg-violet-500/20" },
  { id: "greedy", name: "Greedy", icon: GitBranch, color: "text-amber-400", bg: "bg-amber-500/20" },
  { id: "graphs", name: "Graphs", icon: Network, color: "text-fuchsia-400", bg: "bg-fuchsia-500/20" },
  { id: "hashing", name: "Hashing", icon: Search, color: "text-green-400", bg: "bg-green-500/20" },
  { id: "binary-search", name: "Binary Search", icon: Component, color: "text-cyan-400", bg: "bg-cyan-500/20" }
];

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("prepintel_skill_profile");
    if (stored) {
      try { setProfile(JSON.parse(stored)); } catch (e) {}
    } else {
      // Default to Medium
      const defaultProfile: Record<string, string> = {};
      TOPICS.forEach(t => defaultProfile[t.id] = "Medium");
      setProfile(defaultProfile);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("prepintel_skill_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const setLevel = (topicId: string, level: string) => {
    setProfile(prev => ({ ...prev, [topicId]: level }));
    setSaved(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Personal Analytics & Skill Gap</h1>
        <p className="text-white/60 text-sm mt-1">
          Set your self-assessed skill levels below. We use this to mathematically adjust your PrepIntel question recommendations, prioritizing areas where you have the highest expected return on time invested.
        </p>
      </div>

      <GlassPanel className="p-6">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
          <div className="p-3 rounded-xl bg-primary/20 text-primary">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Skill Profile Onboarding</h2>
            <p className="text-sm text-white/50">Rate your proficiency in key algorithmic topics.</p>
          </div>
        </div>

        <div className="space-y-6">
          {TOPICS.map((t) => {
            const currentLevel = profile[t.id] || "Medium";
            return (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", t.bg, t.color)}>
                    <t.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-white">{t.name}</span>
                </div>
                
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                  {["Weak", "Medium", "Strong"].map(level => (
                    <button
                      key={level}
                      onClick={() => setLevel(t.id, level)}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                        currentLevel === level
                          ? (level === "Weak" ? "bg-status-error text-white" : level === "Medium" ? "bg-amber-500 text-white" : "bg-status-success text-white")
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          {saved && <span className="text-sm text-status-success font-medium animate-in fade-in">Profile saved successfully!</span>}
          <GradientButton onClick={handleSave}>
            Save Skill Profile
          </GradientButton>
        </div>
      </GlassPanel>
    </div>
  );
}
