"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/core/GlassPanel";
import { CustomSelect } from "@/components/core/CustomSelect";
import { createClient } from "@/lib/supabase/client";
import { Target, Filter, ArrowRight, CheckCircle, Flame, Trophy, PlayCircle, ExternalLink, Code2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TOPIC_STYLES } from "@/lib/topics";
import { useCachedApi } from "@/lib/useCachedApi";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "";
  const role = searchParams.get("role") || "";
  const cycle = searchParams.get("cycle") || "";
  
  const [topicFilter, setTopicFilter] = useState("All");
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [lcHandle, setLcHandle] = useState("");
  const [cfHandle, setCfHandle] = useState("");
  const [unifiedStats, setUnifiedStats] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const stored = localStorage.getItem(`prepintel_progress_${session.user.id}`);
        if (stored) {
          try { setProgress(JSON.parse(stored)); } catch (e) {}
        }
        
        const lc = localStorage.getItem(`prepintel_lc_${session.user.id}`) || "";
        const cf = localStorage.getItem(`prepintel_cf_${session.user.id}`) || "";
        setLcHandle(lc);
        setCfHandle(cf);
      }
    });
  }, []);

  const { data: questionsData, loading: qLoading } = useCachedApi<any[]>(
    user ? `${API_BASE}/questions?company=${company}&role=${role}&cycle=${cycle}&limit=50` : null
  );

  const { data: statsData } = useCachedApi<any>(
    user && (lcHandle || cfHandle) ? `${API_BASE}/progress/unified?lc_handle=${lcHandle}&cf_handle=${cfHandle}` : null
  );

  useEffect(() => {
    if (questionsData) setQuestions(questionsData);
    if (statsData) setUnifiedStats(statsData);
  }, [questionsData, statsData]);

  // wait a bit for user to load if undefined
  if (user === null) return null;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-primary mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-foreground">Sign in to track Progress</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Your study progress will appear here once you create an account.</p>
        </div>
      </div>
    );
  }

  // Derived Stats
  const totalRelevant = questions.length || 1;
  const localSolvedCount = Object.values(progress).filter(v => v === 'solved').length;
  const overallPct = Math.round((localSolvedCount / totalRelevant) * 100) || 0;
  
  const solvedCount = unifiedStats ? unifiedStats.leetcode.solved + unifiedStats.codeforces.solved : localSolvedCount;
  
  const streak = unifiedStats?.combined_streak || 0;
  const maxStreak = unifiedStats?.max_streak || 0;
  
  const overallAcc = unifiedStats?.overall_accuracy || 0;
  const lcAcc = unifiedStats?.leetcode?.accuracy || 0;
  const cfAcc = unifiedStats?.codeforces?.accuracy || 0;

  // Heatmap Data (last 60 days)
  const heatmapData = unifiedStats?.heatmap || Array.from({ length: 60 }, (_, i) => {
    const d = new Date(Date.now() - (59 - i) * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split('T')[0],
      count: 0
    };
  });

  const solvesThisWeek = heatmapData.slice(-7).reduce((sum: number, day: any) => sum + (day.count || 0), 0);

  // Recent Activity
  const recentActivity = unifiedStats?.recent_activity?.length > 0 
    ? unifiedStats.recent_activity.map((a: any, i: number) => {
        const diff = Math.floor((Date.now() - a.timestamp * 1000) / 1000);
        let timeStr = "";
        if (diff < 3600) timeStr = `${Math.floor(diff/60)} mins ago`;
        else if (diff < 86400) timeStr = `${Math.floor(diff/3600)} hours ago`;
        else timeStr = `${Math.floor(diff/86400)} days ago`;

        return {
          id: i,
          title: `[${a.platform}] ${a.title}`,
          type: a.status === "Accepted" ? "solve" : "attempt",
          xp: a.status === "Accepted" ? "+25" : "+10",
          time: timeStr
        };
      })
    : [
        { id: 1, title: "No recent global activity", type: "onboard", xp: "", time: "Connect accounts to see activity" }
      ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Hi {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Ready to conquer your next OA/interview.</p>
        </div>
        <button 
          onClick={() => setShowConnectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium text-foreground w-fit"
        >
          <Code2 className="w-4 h-4 text-muted-foreground" />
          Connect Accounts
        </button>
      </div>

      {/* Four-Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Local Progress */}
        <GlassPanel className="p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mb-4">
            <Trophy className="w-4 h-4 text-primary" /> {company ? 'Company Progress' : 'Platform Progress'}
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-foreground">{overallPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-black/20 rounded-full mt-4 overflow-hidden border border-border">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${overallPct}%` }} />
          </div>
        </GlassPanel>

        {/* Questions Solved */}
        <GlassPanel className="p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mb-4">
            <CheckCircle className="w-4 h-4 text-status-success" /> {unifiedStats ? 'Global Solves' : 'Questions Solved'}
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-foreground">{solvedCount}</span>
            {!unifiedStats && <span className="text-sm text-muted-foreground mb-1.5">/ {totalRelevant}</span>}
          </div>
          {unifiedStats ? (
            <p className={cn("text-xs font-medium mt-4 w-fit px-2 py-0.5 rounded border", 
              solvesThisWeek > 0 
                ? "text-status-success bg-status-success/10 border-status-success/20" 
                : "text-muted-foreground bg-white/5 border-white/10"
            )}>
              {solvesThisWeek > 0 ? `+${solvesThisWeek} this week` : "No activity this week"}
            </p>
          ) : (
            <p className="text-xs text-status-success font-medium mt-4 bg-status-success/10 w-fit px-2 py-0.5 rounded border border-status-success/20">
              Track progress locally
            </p>
          )}
        </GlassPanel>

        {/* Accuracy */}
        <GlassPanel className="p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mb-4">
            <Target className="w-4 h-4 text-secondary" /> Accuracy
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-foreground">{overallAcc}%</span>
            <span className="text-sm text-muted-foreground mb-1.5">Avg</span>
          </div>
          <div className="flex flex-col gap-1.5 mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>LC: {lcAcc}%</span>
              <span>CF: {cfAcc}%</span>
            </div>
            <div className="flex gap-1 h-1.5 w-full">
              <div className="h-full bg-orange-400 rounded-l-full transition-all" style={{ width: `${lcAcc}%` }} />
              <div className="h-full bg-blue-500 rounded-r-full transition-all" style={{ width: `${cfAcc}%` }} />
            </div>
          </div>
        </GlassPanel>

        {/* Study Streak */}
        <GlassPanel className="p-6 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm mb-4">
            <Flame className="w-4 h-4 text-amber-500" /> Study Streak
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-foreground">{streak}</span>
            <span className="text-sm text-muted-foreground mb-1.5">days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Personal best: {maxStreak} days
          </p>
        </GlassPanel>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Heatmap & Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          <GlassPanel className="p-6">
            <h3 className="font-semibold text-lg text-foreground mb-6">Performance Heatmap</h3>
            
            {/* Heatmap Grid */}
            <div className="flex flex-wrap gap-2 mb-6">
              {heatmapData.map((d, i) => (
                <div 
                  key={i} 
                  title={`${d.count} actions on ${d.date}`}
                  className={cn(
                    "w-6 h-6 rounded-md border border-border/50 transition-colors",
                    d.count === 0 ? "bg-black/20" :
                    d.count === 1 ? "bg-primary/20 border-primary/30" :
                    d.count <= 3 ? "bg-primary/50 border-primary/60" :
                    "bg-primary border-primary"
                  )}
                />
              ))}
            </div>

            {/* Explicit Legend */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-black/20 border border-border/50" />
                <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/50 border border-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-primary border border-primary" />
              </div>
              <span>More</span>
            </div>
          </GlassPanel>

        </div>

        {/* Right Column: Recent Activity */}
        <div className="lg:col-span-1">
          <GlassPanel className="p-6 h-full flex flex-col">
            <h3 className="font-semibold text-lg text-foreground mb-6">Recent Activity</h3>
            
            <div className="flex-1 space-y-5">
              {recentActivity.map(act => (
                <div key={act.id} className="flex items-start gap-4">
                  <div className="shrink-0 p-2 rounded-lg bg-black/40 border border-border">
                    {act.type === 'solve' ? <CheckCircle className="w-4 h-4 text-status-success" /> :
                     act.type === 'attempt' ? <Code2 className="w-4 h-4 text-amber-500" /> :
                     <Target className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
                  </div>
                  {/* Fixed width right column for XP */}
                  <div className="shrink-0 w-16 text-right">
                    <span className="text-xs font-bold text-secondary">{act.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassPanel className="w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-foreground mb-4">Connect Accounts</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">LeetCode Handle</label>
                <input 
                  type="text" 
                  value={lcHandle}
                  onChange={e => setLcHandle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. neetcode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Codeforces Handle</label>
                <input 
                  type="text" 
                  value={cfHandle}
                  onChange={e => setCfHandle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. tourist"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-muted-foreground hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    localStorage.setItem(`prepintel_lc_${user.id}`, lcHandle);
                    localStorage.setItem(`prepintel_cf_${user.id}`, cfHandle);
                    setShowConnectModal(false);
                    // trigger re-fetch by updating state slightly if needed, but dependencies will catch it
                  }}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                >
                  Save & Sync
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
