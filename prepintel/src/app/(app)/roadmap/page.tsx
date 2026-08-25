"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { CustomSelect } from "@/components/core/CustomSelect";
import { TagPill } from "@/components/core/TagPill";
import { DifficultyBadge } from "@/components/core/DifficultyBadge";
import { cn } from "@/lib/utils";
import { Map, Clock, ArrowRight, ExternalLink } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

import { TOPIC_STYLES, TOPICS } from "@/lib/topics";

export default function RoadmapPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "amazon";
  const role = searchParams.get("role") || "sde-1";
  const cycle = searchParams.get("cycle") || "2025";

  const [hours, setHours] = useState(15);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any[]>([]);

  const generatePlan = async () => {
    setLoading(true);
    setPlan([]);
    try {
      const storedSkills = localStorage.getItem("prepintel_skill_profile");
      const skill_profile = storedSkills ? JSON.parse(storedSkills) : null;
      
      const res = await fetch(`${API_BASE}/prep-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role, cycle, hours, skill_profile })
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data.plan);
      }
    } catch (err) {
      console.error("Error generating plan", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    generatePlan();
  }, [company, role, cycle]); // re-generate on selector change

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Preparation Roadmap</h1>
          <p className="text-white/60 text-sm mt-1 capitalize">{company} · {role} · {cycle}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-2">
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-white/40" />
            <span className="text-sm font-medium text-white/70">Time Budget:</span>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-lg pr-1">
            <CustomSelect 
              value={String(hours)}
              onChange={(val) => setHours(Number(val))}
              options={[
                { value: "10", label: "10 Hours (Intensive)" },
                { value: "15", label: "15 Hours (Standard)" },
                { value: "30", label: "30 Hours (Comprehensive)" },
                { value: "50", label: "50 Hours (Mastery)" },
              ]}
            />
          </div>
          <GradientButton onClick={generatePlan} disabled={loading} className="py-1.5 px-4 text-sm">
            {loading ? "Optimizing..." : "Regenerate Plan"}
          </GradientButton>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center text-white/50">Optimizing your plan...</div>
        ) : (
          plan.map((week, idx) => (
            <GlassPanel key={idx} className="p-0 overflow-hidden border border-white/20 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-primary/20 via-white/5 to-transparent border-b border-white/20">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-white drop-shadow-md">{week.week}</h2>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-black/40 text-primary border border-primary/30 shadow-sm">{week.days}</span>
                  </div>
                  <p className="text-sm font-medium text-white/70">Focus: {week.topics.map((t: string) => TOPIC_STYLES[t]?.name || t).join(", ")}</p>
                </div>
                <div className="text-right bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                  <span className="text-2xl font-bold text-white block leading-none mb-1">{week.progress}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Completion</span>
                </div>
              </div>
  
              <div className="divide-y divide-white/5 p-2">
                {week.questions.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-all group">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/40 accent-primary cursor-pointer" />
                      <a href={q.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 group-hover:text-white flex items-center gap-1.5">
                        {q.title}
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <DifficultyBadge level={q.difficulty} />
                    <div className="flex gap-1.5 hidden sm:flex">
                      {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        )))}
        {plan.length === 0 && !loading && (
          <div className="p-12 text-center text-white/50">Could not generate a plan. Please try increasing your time budget.</div>
        )}
      </div>
    </div>
  );
}
