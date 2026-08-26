"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { TagPill } from "@/components/core/TagPill";
import { CustomSelect } from "@/components/core/CustomSelect";
import { ListSkeleton } from "@/components/core/Skeletons";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Circle, PlayCircle, ExternalLink, Target, Filter, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

import { TOPIC_STYLES, TOPICS } from "@/lib/topics";

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "amazon";
  const role = searchParams.get("role") || "sde-1";
  const cycle = searchParams.get("cycle") || "2025";
  const supabase = createClient();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [topicFilter, setTopicFilter] = useState("All");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/questions?company=${company}&role=${role}&cycle=${cycle}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
        }
        
        if (user) {
          const storedProgress = localStorage.getItem(`prepintel_progress_${user.id}`);
          if (storedProgress) {
            try { setProgress(JSON.parse(storedProgress)); } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Error fetching", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [company, role, cycle, user, supabase]);

  const stats = useMemo(() => {
    let total = 0;
    let solved = 0;
    let attempted = 0;
    
    questions.forEach(q => {
      if (topicFilter !== "All" && !q.tags.includes(topicFilter)) return;
      total++;
      const s = progress[q.id];
      if (s === 'solved') solved++;
      else if (s === 'attempted') attempted++;
    });
    
    return {
      total,
      solved,
      attempted,
      not_started: total - solved - attempted,
      solved_pct: total === 0 ? 0 : Math.round((solved / total) * 100),
      attempted_pct: total === 0 ? 0 : Math.round((attempted / total) * 100)
    };
  }, [questions, progress, topicFilter]);

  const attemptedQuestions = useMemo(() => {
    return questions.filter(q => {
      if (topicFilter !== "All" && !q.tags.includes(topicFilter)) return false;
      return progress[q.id] === 'attempted' || progress[q.id] === 'solved';
    });
  }, [questions, progress, topicFilter]);

  const setQuestionProgress = async (qId: string, status: string) => {
    if (!user) return alert("Please sign in.");
    const newProgress = { ...progress, [qId]: status };
    setProgress(newProgress);
    localStorage.setItem(`prepintel_progress_${user.id}`, JSON.stringify(newProgress));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Target className="w-12 h-12 text-primary mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-white">Sign in to track Progress</h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto">Your study progress will appear here once you create an account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Progress</h1>
          <p className="text-white/60 text-sm mt-1 capitalize">{company} · {role} · {cycle}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pr-1">
          <CustomSelect 
            value={topicFilter}
            onChange={setTopicFilter}
            icon={<Filter className="w-4 h-4" />}
            options={[
              { value: "All", label: "All Topics" },
              ...Object.entries(TOPIC_STYLES).map(([k, v]) => ({ value: k, label: v.name }))
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassPanel className="p-6 md:col-span-1 flex flex-col justify-center items-center text-center">
          <div className="relative w-32 h-32 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-status-success"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${stats.solved_pct}, 100`}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{stats.solved_pct}%</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">Done</span>
            </div>
          </div>
        </GlassPanel>

        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          <GlassPanel className="p-5 flex flex-col justify-center">
            <h3 className="text-white/50 text-sm font-medium mb-1">Solved</h3>
            <div className="text-3xl font-bold text-status-success">{stats.solved}</div>
          </GlassPanel>
          <GlassPanel className="p-5 flex flex-col justify-center">
            <h3 className="text-white/50 text-sm font-medium mb-1">Attempting</h3>
            <div className="text-3xl font-bold text-amber-400">{stats.attempted}</div>
          </GlassPanel>
          <GlassPanel className="p-5 flex flex-col justify-center">
            <h3 className="text-white/50 text-sm font-medium mb-1">Not Started</h3>
            <div className="text-3xl font-bold text-white/30">{stats.not_started}</div>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-base font-semibold text-white">Active & Completed Questions</h2>
        </div>
        {loading ? (
          <div className="p-12"><ListSkeleton /></div>
        ) : attemptedQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Target className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-white/50 mb-5">No questions attempted yet for this selection.</p>
            <Link 
              href={`/questions?company=${company}&role=${role}&cycle=${cycle}`}
              className="px-5 py-2.5 rounded-lg bg-gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Browse Questions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {attemptedQuestions.map((q) => {
              const pStatus = progress[q.id];
              return (
                <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setQuestionProgress(q.id, pStatus === 'solved' ? 'attempted' : 'solved')}
                      className="p-1 text-white/40 hover:text-status-success transition-colors shrink-0"
                    >
                      {pStatus === 'solved' ? <CheckCircle className="w-5 h-5 text-status-success" /> : 
                       <PlayCircle className="w-5 h-5 text-amber-400" />}
                    </button>
                    <a href={q.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white/90 hover:text-white flex items-center gap-1.5 line-clamp-1">
                      {q.title}
                      <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3 sm:mt-0 pl-10 sm:pl-0">
                    <div className="flex gap-1.5">
                      {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
