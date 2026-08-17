"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { CustomSelect } from "@/components/core/CustomSelect";
import { TagPill } from "@/components/core/TagPill";
import { cn } from "@/lib/utils";
import { Map, Clock, ArrowRight, ExternalLink } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const TOPIC_STYLES: Record<string, any> = {
  "arrays": { name: "Arrays" },
  "1d-dp": { name: "1D DP" },
  "greedy": { name: "Greedy" },
  "graphs": { name: "Graphs" },
  "hashing": { name: "Hashing" },
  "binary-search": { name: "Binary Search" }
};

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
        {plan.map((week, idx) => (
          <GlassPanel key={idx} className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold text-white">{week.week}</h2>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/70">{week.days}</span>
                </div>
                <p className="text-sm text-white/50">Focus: {week.topics.map((t: string) => TOPIC_STYLES[t]?.name || t).join(", ")}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white block">{week.progress}%</span>
                <span className="text-xs text-white/40">Completion</span>
              </div>
            </div>

            <div className="space-y-3">
              {week.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-black/40 accent-primary cursor-pointer" />
                    <a href={q.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 group-hover:text-white flex items-center gap-1.5">
                      {q.title}
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-medium",
                      q.difficulty === "Easy" ? "text-status-success" : 
                      q.difficulty === "Medium" ? "text-amber-400" : "text-status-error"
                    )}>{q.difficulty}</span>
                    <div className="flex gap-1.5 hidden sm:flex">
                      {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        ))}
        {plan.length === 0 && !loading && (
          <div className="p-12 text-center text-white/50">Could not generate a plan. Please try increasing your time budget.</div>
        )}
      </div>
    </div>
  );
}
