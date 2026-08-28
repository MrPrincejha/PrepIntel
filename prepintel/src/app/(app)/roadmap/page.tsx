"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { CustomSelect } from "@/components/core/CustomSelect";
import { TagPill } from "@/components/core/TagPill";
import { DifficultyBadge } from "@/components/core/DifficultyBadge";
import { cn } from "@/lib/utils";
import { Map, Clock, ArrowRight, ExternalLink, CheckCircle } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

import { TOPIC_STYLES, TOPICS } from "@/lib/topics";

export default function RoadmapPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company");
  const role = searchParams.get("role");
  const cycle = searchParams.get("cycle");

  const [hours, setHours] = useState(15);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any[]>([]);

  const generatePlan = async () => {
    if (!company) return;
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
  }, [company, role, cycle]);

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Map className="w-8 h-8 text-primary opacity-80" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">No Company Selected</h2>
        <p className="text-muted-foreground mb-8 text-sm">
          Please select a company from the top bar to build your personalized AI roadmap.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Preparation Roadmap</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{company} · {role} · {cycle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-card border border-border rounded-xl p-2">
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Time Budget:</span>
          </div>
          <div className="bg-black/20 border border-border rounded-lg pr-1">
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
          <GradientButton onClick={generatePlan} disabled={loading} className="py-2 px-5 text-sm">
            {loading ? "Optimizing..." : "Regenerate Plan"}
          </GradientButton>
        </div>
      </div>

      <div className="relative pl-8 md:pl-12 pt-4">
        {/* Timeline Edge Line */}
        <div className="absolute left-[15px] md:left-[23px] top-4 bottom-4 w-px bg-border z-0" />

        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Optimizing your plan...</div>
        ) : (
          plan.map((week, idx) => {
            const isCompleted = week.progress === 100;
            // The active node is the first one that is NOT completed
            const isActive = idx === plan.findIndex(w => w.progress < 100);

            return (
              <div key={idx} className="relative mb-8 z-10 group">
                {/* Timeline Node Point */}
                <div className={cn(
                  "absolute -left-[32px] md:-left-[40px] top-6 w-4 h-4 rounded-full border-2 bg-background z-20 transition-all",
                  isActive ? "border-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-125" : 
                  isCompleted ? "border-status-success bg-status-success/20" : 
                  "border-border group-hover:border-primary/50"
                )} />

                <GlassPanel className={cn(
                  "p-0 overflow-hidden transition-all duration-300",
                  isActive ? "ring-1 ring-primary/30 shadow-[0_0_25px_rgba(var(--primary),0.1)]" : "border-border shadow-sm hover:border-white/10"
                )}>
                  <div className={cn(
                    "flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-b border-border",
                    isActive ? "bg-gradient-to-r from-primary/10 to-transparent" : "bg-black/20"
                  )}>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className={cn("text-xl font-bold", isActive ? "text-foreground" : "text-foreground/80")}>
                          {week.week}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-black/40 text-primary border border-primary/20 shadow-sm">
                          {week.days}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-xs font-medium text-status-success bg-status-success/10 px-2 py-0.5 rounded border border-status-success/20">
                            <CheckCircle className="w-3 h-3" /> Done
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mt-2">
                        Focus: <span className="text-foreground/80">{week.topics.map((t: string) => TOPIC_STYLES[t]?.name || t).join(", ")}</span>
                      </p>
                    </div>
                    <div className="text-right bg-black/40 px-4 py-2 rounded-lg border border-border min-w-[100px]">
                      <span className="text-2xl font-bold text-foreground block leading-none mb-1">{week.progress}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Completion</span>
                    </div>
                  </div>
      
                  <div className="divide-y divide-border p-2 bg-card/50">
                    {week.questions.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-white/[0.04] transition-all group/item">
                        <div className="flex items-center gap-3 min-w-0">
                          <input type="checkbox" className="shrink-0 w-4 h-4 rounded border-border bg-black/40 accent-primary cursor-pointer" />
                          <Link 
                            href={`/questions/${q.id || 'mock'}`}
                            className="text-sm font-medium text-foreground/90 group-hover/item:text-primary flex items-center gap-1.5 truncate"
                          >
                            {q.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3 mt-3 sm:mt-0 pl-7 sm:pl-0 shrink-0">
                          <DifficultyBadge level={q.difficulty} />
                          <div className="flex gap-1.5 hidden lg:flex">
                            {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassPanel>
              </div>
            );
          })
        )}
        {plan.length === 0 && !loading && (
          <div className="p-12 text-center text-muted-foreground">Could not generate a plan. Please try increasing your time budget.</div>
        )}
      </div>
    </div>
  );
}
