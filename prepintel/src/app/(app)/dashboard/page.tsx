"use client";

import { StatCard } from "@/components/core/StatCard";
import { GlassPanel } from "@/components/core/GlassPanel";
import { ConfidenceBadge } from "@/components/core/ConfidenceBadge";
import { TagPill } from "@/components/core/TagPill";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Layers, Hash, GitBranch, ArrowRight, Network, Search, Component } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8000/api";

const TOPIC_STYLES: Record<string, any> = {
  "arrays": { icon: Hash, bg: "bg-blue-500/20", color: "text-blue-400", hex: "#60a5fa", name: "Arrays" },
  "1d-dp": { icon: Layers, bg: "bg-violet-500/20", color: "text-violet-400", hex: "#a78bfa", name: "Dynamic Programming" },
  "greedy": { icon: GitBranch, bg: "bg-amber-500/20", color: "text-amber-400", hex: "#fbbf24", name: "Greedy" },
  "graphs": { icon: Network, bg: "bg-fuchsia-500/20", color: "text-fuchsia-400", hex: "#e879f9", name: "Graphs" },
  "hashing": { icon: Search, bg: "bg-green-500/20", color: "text-green-400", hex: "#4ade80", name: "Hashing" },
  "binary-search": { icon: Component, bg: "bg-cyan-500/20", color: "text-cyan-400", hex: "#22d3ee", name: "Binary Search" },
  "trees": { icon: Network, bg: "bg-emerald-500/20", color: "text-emerald-400", hex: "#34d399", name: "Trees" },
  "strings": { icon: Hash, bg: "bg-indigo-500/20", color: "text-indigo-400", hex: "#818cf8", name: "Strings" },
  "simulation": { icon: Layers, bg: "bg-rose-500/20", color: "text-rose-400", hex: "#fb7185", name: "Simulation" },
  "game-theory": { icon: GitBranch, bg: "bg-purple-500/20", color: "text-purple-400", hex: "#c084fc", name: "Game Theory" },
  "segment-tree": { icon: Network, bg: "bg-sky-500/20", color: "text-sky-400", hex: "#38bdf8", name: "Segment Tree" },
  "dfs": { icon: Network, bg: "bg-pink-500/20", color: "text-pink-400", hex: "#f472b6", name: "DFS" },
  "bfs": { icon: Network, bg: "bg-teal-500/20", color: "text-teal-400", hex: "#2dd4bf", name: "BFS" },
  "dijkstra": { icon: Component, bg: "bg-orange-500/20", color: "text-orange-400", hex: "#fb923c", name: "Dijkstra" }
};

const DEFAULT_STYLE = (topic: string) => ({
  icon: Hash,
  bg: "bg-gray-500/20",
  color: "text-gray-400",
  hex: "#9ca3af",
  name: topic.charAt(0).toUpperCase() + topic.slice(1).replace("-", " ")
});

export default function DashboardOverview() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company");
  const role = searchParams.get("role");
  const cycle = searchParams.get("cycle");
  const round = searchParams.get("round") || "oa";

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [difficulty, setDifficulty] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [prepPlan, setPrepPlan] = useState<any[]>([]);

  const [personalize, setPersonalize] = useState(false);
  const [skillProfile, setSkillProfile] = useState<Record<string, string>>({});

  useEffect(() => {
    const storedSkills = localStorage.getItem("prepintel_skill_profile");
    if (storedSkills) {
      try { setSkillProfile(JSON.parse(storedSkills)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!company || !role || !cycle) return;

    async function fetchData() {
      setLoading(true);
      try {
        const storedSkills = localStorage.getItem("prepintel_skill_profile");
        const sp = storedSkills ? JSON.parse(storedSkills) : null;
        
        const [topicsRes, questionsRes, difficultyRes, trendRes, planRes] = await Promise.all([
          fetch(`${API_BASE}/topics?company=${company}&role=${role}&cycle=${cycle}`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/questions?company=${company}&role=${role}&cycle=${cycle}&limit=5`).then(r => r.ok ? r.json() : []),
          fetch(`${API_BASE}/difficulty?company=${company}&role=${role}&round=${round}&cycle=${cycle}`).then(r => r.ok ? r.json() : null),
          fetch(`${API_BASE}/trend?company=${company}&role=${role}&topic=all&months=12`).then(r => r.ok ? r.json() : { monthly_data: [] }),
          fetch(`${API_BASE}/prep-plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ company, role, cycle, hours: 15, skill_profile: sp })
          }).then(r => r.ok ? r.json() : { plan: [] })
        ]);

        setTopics(topicsRes || []);
        
        let qData = questionsRes || [];
        setQuestions(qData);
        setDifficulty(difficultyRes);
        setTrend(trendRes.monthly_data || []);
        setPrepPlan(planRes.plan || []);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [company, role, cycle, round]);

  const displayedQuestions = useMemo(() => {
    if (!personalize) return questions;
    
    return questions.map(q => {
      let maxMultiplier = 1.0;
      let gapReason = "";
      q.tags.forEach((tag: string) => {
        const level = skillProfile[tag] || "Medium";
        const mult = level === "Weak" ? 1.5 : level === "Strong" ? 0.6 : 1.0;
        if (mult > maxMultiplier) {
          maxMultiplier = mult;
          gapReason = tag;
        } else if (mult < maxMultiplier && maxMultiplier === 1.0) {
          maxMultiplier = mult;
        }
      });
      return {
        ...q,
        _personalizedScore: q.final_recommendation_score * maxMultiplier,
        _gapReason: maxMultiplier > 1.0 ? gapReason : null
      };
    }).sort((a, b) => b._personalizedScore - a._personalizedScore);
  }, [questions, personalize, skillProfile]);

  if (!company || !role || !cycle) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-white/50 text-sm">Please select a Company, Role, and Year.</p>
      </div>
    );
  }

  const hasData = topics.length > 0 || questions.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
          <p className="text-white/50 text-sm">Loading intelligence...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <GlassPanel className="p-12 text-center max-w-md">
          <Hash className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Not enough data yet</h2>
          <p className="text-sm text-white/50">We don't have enough verified reports for {company.toUpperCase()} - {role.toUpperCase()} in {cycle}. Try selecting a different combination.</p>
        </GlassPanel>
      </div>
    );
  }

  // Use a default confidence score or aggregate from topics if available
  const confidenceScore = 85; 
  
  const diffData = difficulty ? [
    { name: 'Easy', value: difficulty.easy_pct, color: '#22C55E' },
    { name: 'Medium', value: difficulty.medium_pct, color: '#F59E0B' },
    { name: 'Hard', value: difficulty.hard_pct, color: '#EF4444' },
  ] : [];

  const dominantDiff = diffData.length ? [...diffData].sort((a,b) => b.value - a.value)[0] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-white/60 text-sm mt-1 capitalize">{company} · {role} · {cycle}</p>
        </div>
        <ConfidenceBadge level={confidenceScore >= 80 ? "High" : confidenceScore >= 50 ? "Medium" : "Low"} score={confidenceScore} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topics.slice(0, 3).map((t, idx) => {
          const style = TOPIC_STYLES[t.topic] || DEFAULT_STYLE(t.topic);
          const IconComponent = style.icon;
          
          let trendLabel: "up" | "down" | "stable" = "stable";
          let trendValue = "";
          if (t.trend_score > 0) { trendLabel = "up"; trendValue = `+${(t.trend_score * 100).toFixed(0)}%`; }
          else if (t.trend_score < 0) { trendLabel = "down"; trendValue = `${(t.trend_score * 100).toFixed(0)}%`; }

          return (
            <StatCard
              key={idx}
              title={style.name}
              value={`${(t.weighted_probability * 100).toFixed(0)}%`}
              trend={trendLabel}
              trendValue={trendValue}
              icon={<IconComponent className="w-5 h-5" />}
              iconBgColor={style.bg}
              iconColor={style.color}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="p-6 lg:col-span-2 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-6">Topic Trend — Last 12 Months</h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0D14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                {/* Dynamically render lines based on top 3 topics */}
                {topics.slice(0, 3).map((t) => {
                   const style = TOPIC_STYLES[t.topic] || DEFAULT_STYLE(t.topic);
                   return <Line key={t.topic} type="monotone" dataKey={t.topic} name={style.name} stroke={style.hex} strokeWidth={2} dot={false} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 flex flex-col">
          <h2 className="text-base font-semibold text-white mb-6">Difficulty Distribution</h2>
          <div className="flex-1 min-h-[250px] relative flex flex-col items-center justify-center">
            {diffData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diffData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {diffData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0D14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-white">{dominantDiff?.value}%</span>
                    <span className="text-xs text-white/50">{dominantDiff?.name}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-white/70">
                  {diffData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/50 text-sm">No difficulty data.</p>
            )}
          </div>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassPanel className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Top Recommended Questions</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-primary/10 border border-primary/20 px-2 py-1 rounded text-xs text-primary font-medium hover:bg-primary/20 transition-colors">
                <input 
                  type="checkbox" 
                  checked={personalize} 
                  onChange={(e) => setPersonalize(e.target.checked)} 
                  className="accent-primary" 
                />
                Personalize
              </label>
              <Link href="/questions" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View Full List <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {displayedQuestions.map((q, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-3 mb-2 sm:mb-0 min-w-0">
                  <span className="text-white/30 font-mono text-sm w-4">{i + 1}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">{q.title}</span>
                    {personalize && q._gapReason && (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 flex-shrink-0">
                        Priority boost: {TOPIC_STYLES[q._gapReason]?.name || q._gapReason} gap
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-mono font-medium",
                    q.final_recommendation_score >= 90 ? "bg-primary/20 text-primary" : 
                    q.final_recommendation_score >= 70 ? "bg-white/10 text-white/80" : "bg-white/5 text-white/40"
                  )}>
                    {q.final_recommendation_score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">N-Day Preparation Plan</h2>
            <Link href="/roadmap" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              View Full Roadmap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-6">
            {[
              { week: "Week 1", days: "Days 1-7", topics: "Arrays, Hashing, Two Pointers", progress: 100 },
              { week: "Week 2", days: "Days 8-14", topics: "Sliding Window, Stack, 1D DP", progress: 45 },
            ].map((plan, i) => (
              <div key={i} className="space-y-2 opacity-50">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-white">{plan.week}</span>
                    <span className="text-white/50 ml-2">({plan.days}): {plan.topics}</span>
                  </div>
                  <span className="font-mono text-white/70">{plan.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", plan.progress === 100 ? "bg-status-success" : "bg-gradient-primary")} 
                    style={{ width: `${plan.progress}%` }} 
                  />
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-4 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-white/50 mb-2">Placeholder for Phase 8 Optimizer</p>
              <button disabled className="text-xs font-medium text-white/50 bg-white/5 px-4 py-1.5 rounded-full">
                Regenerate Plan
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
