"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { TagPill } from "@/components/core/TagPill";
import { ListSkeleton } from "@/components/core/Skeletons";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ExternalLink, Star, CheckCircle, Circle, PlayCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DisplayAd } from "@/components/core/DisplayAd";
import Link from "next/link";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

import { TOPIC_STYLES, TOPICS } from "@/lib/topics";

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
  }, []);

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
          const storedBookmarks = localStorage.getItem(`prepintel_bookmarks_${user.id}`);
          if (storedBookmarks) {
            try { setBookmarks(new Set(JSON.parse(storedBookmarks))); } catch (e) {}
          }
          
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
  }, [company, role, cycle, user]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => bookmarks.has(q.id));
  }, [questions, bookmarks]);

  const toggleBookmark = async (qId: string) => {
    if (!user) return alert("Please sign in.");
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(qId)) {
      newBookmarks.delete(qId);
      setBookmarks(newBookmarks);
      localStorage.setItem(`prepintel_bookmarks_${user.id}`, JSON.stringify(Array.from(newBookmarks)));
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

      {loading ? (
        <ListSkeleton />
      ) : (
        <GlassPanel className="p-0 overflow-hidden">
          {/* Header Row for columns */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-black/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="pl-24">Question & Tags</div>
            <div className="pr-4">Match Score</div>
          </div>
          {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Star className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-5">No bookmarked questions for this selection.</p>
            <Link 
              href={`/questions?company=${company}&role=${role}&cycle=${cycle}`}
              className="px-5 py-2.5 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Explore Questions to Bookmark <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredQuestions.map((q) => {
              const pStatus = progress[q.id] || "not_started";
              
              return (
                <div key={q.id} className="flex flex-col transition-colors hover:bg-white/[0.02]">
                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleBookmark(q.id)} className="p-1 text-muted-foreground hover:text-amber-400 transition-colors">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </button>
                      <button 
                        onClick={() => setQuestionProgress(q.id, pStatus === 'solved' ? 'not_started' : 'solved')}
                        className="p-1 text-muted-foreground hover:text-status-success transition-colors"
                      >
                        {pStatus === 'solved' ? <CheckCircle className="w-5 h-5 text-status-success" /> : 
                         pStatus === 'attempted' ? <PlayCircle className="w-5 h-5 text-amber-400" /> :
                         <Circle className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Core Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/questions/${q.id}`}
                          className="text-base font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate text-left"
                        >
                          {q.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-xs font-medium border border-border px-2 py-0.5 rounded-md",
                          q.difficulty === "Easy" ? "text-status-success bg-status-success/10" : 
                          q.difficulty === "Medium" ? "text-status-warning bg-status-warning/10" : "text-status-danger bg-status-danger/10"
                        )}>{q.difficulty}</span>
                        {q.company && (
                          <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded-md font-medium uppercase tracking-wider bg-black/20">
                            {q.company}
                          </span>
                        )}
                        <div className="flex gap-1.5 ml-1">
                          {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                        </div>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div className="flex items-center gap-4 group pr-4">
                      <div className="group relative">
                        <div className={cn(
                          "px-3 py-1 rounded-md text-sm font-mono font-medium cursor-help",
                          q.final_recommendation_score >= 90 ? "bg-primary/20 text-primary" : 
                          q.final_recommendation_score >= 70 ? "bg-white/10 text-white/80" : "bg-white/5 text-muted-foreground"
                        )}>
                          {q.final_recommendation_score}
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded text-[10px] text-white/70 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                          Relevance Score: Frequency of this pattern in verified reports, weighted by recency.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
      )}

      {/* Manual Display Ad */}
      <DisplayAd />
    </div>
  );
}

