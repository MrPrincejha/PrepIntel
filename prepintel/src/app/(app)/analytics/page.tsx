"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { TOPIC_CATEGORIES } from "@/lib/topics";

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Open all by default
    const initialOpen: Record<string, boolean> = {};
    TOPIC_CATEGORIES.forEach(c => initialOpen[c.category] = true);
    setOpenCategories(initialOpen);

    const stored = localStorage.getItem("prepintel_skill_profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const migrated: Record<string, string> = { ...parsed };
        
        // Migration logic for old schema -> new schema
        // Only migrate if the old key is present and the new one is not
        if (parsed["arrays"] && !parsed["arrays"]) migrated["arrays"] = parsed["arrays"]; // same key
        if (parsed["1d-dp"] && !parsed["1d-dp"]) migrated["1d-dp"] = parsed["1d-dp"]; // same key
        if (parsed["greedy"] && !parsed["greedy"]) migrated["greedy"] = parsed["greedy"]; // same key
        if (parsed["graphs"] && !parsed["graphs"]) migrated["graphs"] = parsed["graphs"]; // same key
        if (parsed["hashing"] && !parsed["hashing"]) migrated["hashing"] = parsed["hashing"]; // same key
        if (parsed["binary-search"] && !parsed["binary-search"]) migrated["binary-search"] = parsed["binary-search"]; // same key

        setProfile(migrated);
      } catch (e) {}
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

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  let totalTopics = 0;
  let ratedTopics = 0;
  TOPIC_CATEGORIES.forEach(c => {
    c.topics.forEach(t => {
      totalTopics++;
      if (profile[t.id]) ratedTopics++;
    });
  });

  const allRated = totalTopics === ratedTopics;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Personal Analytics & Skill Gap</h1>
        <p className="text-white/60 text-sm mt-1">
          Set your self-assessed skill levels below. We use this to mathematically adjust your PrepIntel question recommendations, prioritizing areas where you have the highest expected return on time invested.
        </p>
      </div>

      <GlassPanel className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 text-primary">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Skill Profile Onboarding</h2>
              <p className="text-sm text-primary font-medium mt-1">Select your honest skill level for each topic.</p>
            </div>
          </div>
          <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/10 text-right shrink-0">
            <span className="text-xl font-bold text-white block leading-none mb-1">{ratedTopics} / {totalTopics}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Topics Rated</span>
          </div>
        </div>

        <div className="space-y-6">
          {TOPIC_CATEGORIES.map((category) => {
            const isOpen = openCategories[category.category];
            const catRated = category.topics.filter(t => profile[t.id]).length;
            const catTotal = category.topics.length;
            
            return (
              <div key={category.category} className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
                <button 
                  onClick={() => toggleCategory(category.category)}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{category.category}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      catRated === catTotal ? "bg-status-success/20 text-status-success" : "bg-amber-500/20 text-amber-500"
                    )}>
                      {catRated} / {catTotal} rated
                    </span>
                  </div>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                </button>
                
                {isOpen && (
                  <div className="p-4 space-y-3 bg-white/[0.01]">
                    {category.topics.map((t) => {
                      const currentLevel = profile[t.id];
                      // @ts-ignore
                      const Icon = Icons[t.icon] || Icons.Hash;
                      
                      return (
                        <div key={t.id} className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg border transition-colors",
                          !currentLevel ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-white/[0.02] border-white/10 hover:border-white/20"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-white/70">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-white/90 text-sm">{t.name}</span>
                          </div>
                          
                          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10 shrink-0">
                            {["Weak", "Medium", "Strong"].map(level => (
                              <button
                                key={level}
                                onClick={() => setLevel(t.id, level)}
                                className={cn(
                                  "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                                  currentLevel === level
                                    ? (level === "Weak" ? "bg-status-error text-white" : level === "Medium" ? "bg-amber-500 text-white" : "bg-status-success text-white")
                                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
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
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          {!allRated && (
            <span className="text-sm text-amber-400 font-medium">Please rate all topics to save your profile.</span>
          )}
          <GradientButton onClick={handleSave} disabled={!allRated} className="w-full sm:w-auto px-8">
            {saved ? "Saved Successfully!" : "Save Skill Profile"}
          </GradientButton>
        </div>
      </GlassPanel>
    </div>
  );
}
