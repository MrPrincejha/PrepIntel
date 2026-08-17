"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { TagPill } from "@/components/core/TagPill";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ExternalLink, Star, CheckCircle, Circle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8000/api";

const TOPIC_STYLES: Record<string, any> = {
  "arrays": { name: "Arrays" },
  "1d-dp": { name: "1D DP" },
  "greedy": { name: "Greedy" },
  "graphs": { name: "Graphs" },
  "hashing": { name: "Hashing" },
  "binary-search": { name: "Binary Search" }
};

export default function BookmarksPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "amazon";
  const role = searchParams.get("role") || "sde-1";
  const cycle = searchParams.get("cycle") || "2025";
  const supabase = createClient();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          const bRes = await supabase.from('bookmarks').select('question_id').eq('user_id', user.id);
          if (bRes.data) setBookmarks(new Set(bRes.data.map(b => b.question_id)));
          
          const pRes = await supabase.from('user_progress').select('question_id, status').eq('user_id', user.id);
          if (pRes.data) {
            const pMap: Record<string, string> = {};
            pRes.data.forEach(p => pMap[p.question_id] = p.status);
            setProgress(pMap);
          }
        }
      } catch (err) {
        console.error("Error fetching", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [company, role, cycle, user, supabase]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => bookmarks.has(q.id));
  }, [questions, bookmarks]);

  const toggleBookmark = async (qId: string) => {
    if (!user) return alert("Please sign in.");
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(qId)) {
      newBookmarks.delete(qId);
      setBookmarks(newBookmarks);
      await supabase.from('bookmarks').delete().match({ user_id: user.id, question_id: qId });
    }
  };

  const setQuestionProgress = async (qId: string, status: string) => {
    if (!user) return alert("Please sign in.");
    setProgress(prev => ({ ...prev, [qId]: status }));
    const existing = progress[qId];
    if (existing) {
      await supabase.from('user_progress').update({ status }).match({ user_id: user.id, question_id: qId });
    } else {
      await supabase.from('user_progress').insert({ user_id: user.id, question_id: qId, status });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Star className="w-12 h-12 text-amber-400 mx-auto opacity-50" />
          <h2 className="text-xl font-bold text-white">Sign in to view Bookmarks</h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto">Your saved questions will appear here once you create an account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Your Bookmarks</h1>
        <p className="text-white/60 text-sm mt-1">Saved for later review</p>
      </div>

      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50">Loading bookmarks...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-white/50 flex flex-col items-center gap-3">
            <Star className="w-8 h-8 opacity-20" />
            <span>No bookmarked questions for this selection.</span>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              const pStatus = progress[q.id] || "not_started";
              
              return (
                <div key={q.id} className="flex flex-col transition-colors hover:bg-white/[0.02]">
                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleBookmark(q.id)} className="p-1 text-amber-400 hover:text-amber-500 transition-colors">
                        <Star className="w-5 h-5 fill-amber-400" />
                      </button>
                      <button 
                        onClick={() => setQuestionProgress(q.id, pStatus === 'solved' ? 'not_started' : 'solved')}
                        className="p-1 text-white/40 hover:text-status-success transition-colors"
                      >
                        {pStatus === 'solved' ? <CheckCircle className="w-5 h-5 text-status-success" /> : 
                         pStatus === 'attempted' ? <PlayCircle className="w-5 h-5 text-amber-400" /> :
                         <Circle className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <a href={q.url} target="_blank" rel="noreferrer" className="text-base font-medium text-white hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                          {q.title}
                          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-xs font-medium",
                          q.difficulty === "Easy" ? "text-status-success" : 
                          q.difficulty === "Medium" ? "text-amber-400" : "text-status-error"
                        )}>{q.difficulty}</span>
                        <div className="flex gap-1.5">
                          {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="flex items-center gap-4 group"
                    >
                      <div className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-mono font-bold flex flex-col items-center min-w-[60px]",
                        q.final_recommendation_score >= 90 ? "bg-primary/20 text-primary border border-primary/30" : 
                        q.final_recommendation_score >= 70 ? "bg-white/10 text-white/90 border border-white/20" : "bg-white/5 text-white/50 border border-white/10"
                      )}>
                        {q.final_recommendation_score}
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-white/30 group-hover:text-white/60 transition-transform", isExpanded && "rotate-180")} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 md:px-16 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="bg-[#05060A] border border-white/10 rounded-xl p-4">
                        <p className="text-sm text-white/60">Explanation features are detailed in the main Questions Explorer.</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
