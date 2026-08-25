"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { TagPill } from "@/components/core/TagPill";
import { CustomSelect } from "@/components/core/CustomSelect";
import { DifficultyBadge } from "@/components/core/DifficultyBadge";
import { ListSkeleton } from "@/components/core/Skeletons";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ExternalLink, Star, CheckCircle, Circle, PlayCircle, Filter, Sparkles, Info } from "lucide-react";
import { cn, cleanReportText } from "@/lib/utils";
import { ReportTextFormatter } from "@/components/core/ReportTextFormatter";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

import { TOPIC_STYLES, TOPICS } from "@/lib/topics";

export default function QuestionsPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "amazon";
  const role = searchParams.get("role") || "sde-1";
  const cycle = searchParams.get("cycle") || "2025";
  const supabase = createClient();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filters
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [personalize, setPersonalize] = useState(false);
  const [skillProfile, setSkillProfile] = useState<Record<string, string>>({});

  // User state
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, string>>({});
  
  // Expanded row state
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const storedSkills = localStorage.getItem("prepintel_skill_profile");
    if (storedSkills) {
      try { setSkillProfile(JSON.parse(storedSkills)); } catch (e) {}
    }
  }, [supabase]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setQuestions([]);
      try {
        const res = await fetch(`${API_BASE}/questions?company=${company}&role=${role}&cycle=${cycle}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
        }
        
        if (user) {
          // Fetch bookmarks
          const bRes = await supabase.from('bookmarks').select('question_id').eq('user_id', user.id);
          if (bRes.data) setBookmarks(new Set(bRes.data.map(b => b.question_id)));
          
          // Fetch progress
          const pRes = await supabase.from('user_progress').select('question_id, status').eq('user_id', user.id);
          if (pRes.data) {
            const pMap: Record<string, string> = {};
            pRes.data.forEach(p => pMap[p.question_id] = p.status);
            setProgress(pMap);
          }
        }
      } catch (err) {
        console.error("Error fetching questions", err);
      }
      setLoading(false);
    }
    fetchData();
  }, [company, role, cycle, user, supabase]);

  const filteredQuestions = useMemo(() => {
    let result = questions.filter(q => {
      if (difficultyFilter !== "All" && q.difficulty !== difficultyFilter) return false;
      if (topicFilter !== "All" && !q.tags.includes(topicFilter)) return false;
      if (onlyBookmarked && !bookmarks.has(q.id)) return false;
      return true;
    });

    if (personalize) {
      result = result.map(q => {
        // Compute max multiplier across tags
        let maxMultiplier = 1.0;
        let gapReason = "";
        q.tags.forEach((tag: string) => {
          const level = skillProfile[tag] || "Medium";
          const mult = level === "Weak" ? 1.5 : level === "Strong" ? 0.6 : 1.0;
          if (mult > maxMultiplier) {
            maxMultiplier = mult;
            gapReason = tag;
          } else if (mult < maxMultiplier && maxMultiplier === 1.0) {
            maxMultiplier = mult; // if everything is strong
          }
        });
        
        return {
          ...q,
          _personalizedScore: q.final_recommendation_score * maxMultiplier,
          _gapReason: maxMultiplier > 1.0 ? gapReason : null
        };
      }).sort((a, b) => b._personalizedScore - a._personalizedScore);
    } else {
      result = [...result].sort((a, b) => b.final_recommendation_score - a.final_recommendation_score);
    }

    return result;
  }, [questions, difficultyFilter, topicFilter, onlyBookmarked, bookmarks, personalize, skillProfile]);

  const toggleBookmark = async (qId: string) => {
    if (!user) return alert("Please sign in to bookmark questions.");
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(qId)) {
      newBookmarks.delete(qId);
      setBookmarks(newBookmarks);
      await supabase.from('bookmarks').delete().match({ user_id: user.id, question_id: qId });
    } else {
      newBookmarks.add(qId);
      setBookmarks(newBookmarks);
      await supabase.from('bookmarks').insert({ user_id: user.id, question_id: qId });
    }
  };

  const setQuestionProgress = async (qId: string, status: string) => {
    if (!user) return alert("Please sign in to track progress.");
    setProgress(prev => ({ ...prev, [qId]: status }));
    
    const existing = progress[qId];
    if (existing) {
      await supabase.from('user_progress').update({ status }).match({ user_id: user.id, question_id: qId });
    } else {
      await supabase.from('user_progress').insert({ user_id: user.id, question_id: qId, status });
    }
  };

  const getExplanation = (q: any) => {
    const breakdown = [
      `Topic Match (${q.topic_score}%): High historical frequency of ${q.tags.map((t: string) => TOPIC_STYLES[t]?.name || t).join(', ')} in recent ${company} interviews.`,
      `Pattern Match (${q.pattern_score}%): Overlap with specific sub-patterns flagged in OA reports.`,
      `Recency (${q.recency_score}%): Questions of this type have appeared frequently in the last 3 months.`,
      `Difficulty Fit (${q.difficulty_fit}%): Aligns with standard ${q.difficulty} bar for ${role}.`,
      `Direct Evidence (${q.direct_evidence_score}%): This exact question or a close variant was directly reported.`
    ];
    if (personalize && q._gapReason) {
      breakdown.unshift(`Skill Gap Boost: Prioritized +50% due to self-reported Weak proficiency in ${TOPIC_STYLES[q._gapReason]?.name || q._gapReason}.`);
    }
    return breakdown;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Questions Explorer</h1>
            <div className="group relative">
              <Info className="w-4 h-4 text-white/30 hover:text-white/70 cursor-help transition-colors" />
              <div className="absolute top-full left-0 mt-2 w-72 p-4 bg-black/95 border border-white/10 rounded-xl text-xs text-white/70 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal">
                <strong className="block text-white mb-1">Bayesian Scoring Engine</strong>
                Questions are ranked by a relevance score (0-100) that models their probability of appearing in your upcoming interview. It weighs historical frequency, recent trend velocity, and direct extraction from verified community OA reports.
              </div>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-1 capitalize">{company} · {role} · {cycle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="group relative">
            <button 
              onClick={() => setPersonalize(!personalize)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                personalize ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              )}
            >
              <Sparkles className={cn("w-4 h-4 transition-transform duration-500", personalize ? "scale-110" : "grayscale opacity-50")} />
              Personalize for me
              <div className={cn("w-7 h-4 rounded-full ml-1 relative transition-colors duration-300", personalize ? "bg-primary" : "bg-white/20")}>
                <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm", personalize ? "left-[14px]" : "left-0.5")} />
              </div>
            </button>
            <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-black/90 border border-white/10 rounded-lg text-xs text-white/70 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Reorders questions using your Skill Profile (from Analytics). Prioritizes topics where you have the highest expected return on time.
            </div>
          </div>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pr-1">
            <CustomSelect 
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              icon={<Filter className="w-4 h-4" />}
              options={[
                { value: "All", label: "All Difficulties" },
                { value: "Easy", label: "Easy" },
                { value: "Medium", label: "Medium" },
                { value: "Hard", label: "Hard" },
              ]}
            />
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pr-1">
            <CustomSelect 
              value={topicFilter}
              onChange={setTopicFilter}
              options={[
                { value: "All", label: "All Topics" },
                ...Object.entries(TOPIC_STYLES).map(([k, v]) => ({ value: k, label: v.name }))
              ]}
            />
          </div>

          <button 
            onClick={() => setOnlyBookmarked(!onlyBookmarked)}
            className={cn(
              "px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center gap-2",
              onlyBookmarked ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
            )}
          >
            <Star className={cn("w-4 h-4", onlyBookmarked && "fill-primary")} /> Bookmarked
          </button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : (
        <GlassPanel className="p-0 overflow-hidden">
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-white/50">No questions found matching criteria.</div>
          ) : (
            <div className="divide-y divide-white/10">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedId === q.id;
              const isBookmarked = bookmarks.has(q.id);
              const pStatus = progress[q.id] || "not_started";
              
              return (
                <div key={q.id} className="flex flex-col transition-colors hover:bg-white/[0.02]">
                  <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleBookmark(q.id)} className="p-1 text-white/40 hover:text-amber-400 transition-colors">
                        <Star className={cn("w-5 h-5", isBookmarked && "fill-amber-400 text-amber-400")} />
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

                    {/* Core Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : q.id)}
                          className="text-base font-medium text-white hover:text-primary transition-colors flex items-center gap-1.5 truncate text-left"
                        >
                          {q.title}
                        </button>
                        {personalize && q._gapReason && (
                          <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary ml-2 border border-primary/30">
                            Priority boost: {TOPIC_STYLES[q._gapReason]?.name || q._gapReason} gap
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <DifficultyBadge level={q.difficulty} />
                        <div className="flex gap-1.5">
                          {q.tags.map((t: string) => <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />)}
                        </div>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="flex items-center gap-4 group"
                    >
                      <div className="group relative">
                        <div className={cn(
                          "px-2 py-0.5 rounded-md text-xs font-mono font-medium cursor-help",
                          q.final_recommendation_score >= 90 ? "bg-primary/20 text-primary" : 
                          q.final_recommendation_score >= 70 ? "bg-white/10 text-white/80" : "bg-white/5 text-white/40"
                        )}>
                          {q.final_recommendation_score}
                        </div>
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded text-[10px] text-white/70 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-normal">
                          Relevance Score: Frequency of this pattern in verified {company} reports, weighted by recency.
                        </div>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-white/30 group-hover:text-white/60 transition-transform", isExpanded && "rotate-180")} />
                    </button>
                  </div>

                  {/* Expandable Explainability Drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 md:px-16 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="bg-[#05060A] border border-white/10 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Why was this question recommended?
                        </h4>
                        <ul className="space-y-2 text-sm text-white/70 mb-6">
                          {getExplanation(q).map((line, idx) => {
                            const [boldPart, rest] = line.split("): ");
                            return (
                              <li key={idx} className="flex gap-2">
                                <span className="text-white/30">•</span>
                                <span>
                                  <span className="font-medium text-white/90">{boldPart}): </span>
                                  {rest}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        
                        {q.raw_text && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Full Problem Description
                            </h4>
                            <div className="bg-white/5 rounded-lg p-4 max-h-[400px] overflow-y-auto mt-2 border border-white/5">
                              <ReportTextFormatter text={cleanReportText(q.raw_text)} />
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-6 flex gap-2">
                          <button 
                            onClick={() => setQuestionProgress(q.id, 'attempted')}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-md font-medium transition-colors border",
                              pStatus === 'attempted' ? "bg-amber-400/20 text-amber-400 border-amber-400/30" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                            )}
                          >
                            Mark as Attempting
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
      )}
    </div>
  );
}
