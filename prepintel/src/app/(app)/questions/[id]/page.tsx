"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Code2, Send, ExternalLink } from "lucide-react";
import { GlassPanel } from "@/components/core/GlassPanel";
import { DifficultyBadge } from "@/components/core/DifficultyBadge";
import { TagPill } from "@/components/core/TagPill";
import { TOPIC_STYLES } from "@/lib/topics";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// We mock fetching the single question since the backend only supports listing
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [question, setQuestion] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Problem");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const storedBookmarks = localStorage.getItem(`prepintel_bookmarks_${session.user.id}`);
        if (storedBookmarks) {
          try {
            const b = new Set(JSON.parse(storedBookmarks));
            setIsBookmarked(b.has(id));
          } catch(e) {}
        }
      }
    });
  }, [id]);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const company = searchParams.get("company") || "";
        const role = searchParams.get("role") || "";
        const cycle = searchParams.get("cycle") || "";
        
        const params = new URLSearchParams();
        if (company) params.set("company", company);
        if (role) params.set("role", role);
        if (cycle) params.set("cycle", cycle);
        params.set("limit", "100");

        const res = await fetch(`${API_BASE}/questions?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAllQuestions(data);
          const q = data.find((x: any) => x.id === id);
          if (q) {
            setQuestion(q);
          } else if (data.length > 0) {
            console.warn(`Question ${id} not found! Falling back to first available question.`);
            setQuestion({ ...data[0], title: `[NOT FOUND ${id}] ` + data[0].title });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestion();
  }, [id, searchParams]);

  const currentIndex = allQuestions.findIndex(q => q.id === id);
  const prevId = currentIndex > 0 ? allQuestions[currentIndex - 1].id : null;
  const nextId = currentIndex >= 0 && currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1].id : null;

  const toggleBookmark = () => {
    if (!user) {
      alert("Please sign in to bookmark questions.");
      return;
    }
    const storedStr = localStorage.getItem(`prepintel_bookmarks_${user.id}`);
    let b = new Set<string>();
    if (storedStr) {
      try { b = new Set(JSON.parse(storedStr)); } catch(e) {}
    }
    if (b.has(id)) {
      b.delete(id);
      setIsBookmarked(false);
    } else {
      b.add(id);
      setIsBookmarked(true);
    }
    localStorage.setItem(`prepintel_bookmarks_${user.id}`, JSON.stringify(Array.from(b)));
  };

  const qData = question || {
    title: "Fake Palindrome",
    difficulty: "Hard",
    company: "Observe.ai",
    tags: ["string-matching", "dynamic-programming", "backtracking"],
    raw_text: `Given a string s, you can remove any number of characters from it.\n\nA string is called a fake palindrome if it can be rearranged to form a palindrome after the removal of some characters.\n\nFind the minimum number of characters you need to remove from s to make it a fake palindrome.\n\nExample 1:\nInput: s = "aebcbda"\nOutput: 2\nExplanation: Remove 'e' and 'd', then it can be rearranged to "abcba".\n\nExample 2:\nInput: s = "abc"\nOutput: 1`,
    url: "#"
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading question...</div>;
  }

  const tabs = ["Problem", "Editorial", "Solutions (24)", "Discuss"];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <Link 
          href={`/questions?${searchParams.toString()}`}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Questions
        </Link>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleBookmark}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
              isBookmarked ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            <Star className={cn("w-4 h-4", isBookmarked && "fill-primary")} /> 
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          
          <div className="flex bg-card border border-border rounded-lg overflow-hidden">
            <Link 
              href={prevId ? `/questions/${prevId}?${searchParams.toString()}` : "#"} 
              className={cn(
                "px-3 py-1.5 text-sm font-medium border-r border-border flex items-center gap-1 transition-colors",
                prevId ? "text-muted-foreground hover:bg-white/5 hover:text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
              )}
              onClick={e => !prevId && e.preventDefault()}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Link>
            <Link 
              href={nextId ? `/questions/${nextId}?${searchParams.toString()}` : "#"} 
              className={cn(
                "px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors",
                nextId ? "text-muted-foreground hover:bg-white/5 hover:text-foreground" : "text-muted-foreground/30 cursor-not-allowed"
              )}
              onClick={e => !nextId && e.preventDefault()}
            >
              Next <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">{qData.title}</h1>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge level={qData.difficulty} />
            {qData.tags?.map((t: string) => (
              <TagPill key={t} label={TOPIC_STYLES[t]?.name || t} />
            ))}
          </div>
          
          {qData.company && (
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-border">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{qData.company}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 border-b border-border mt-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab 
                ? "border-primary text-foreground" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-white/20"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-2 items-start">
        
        <div className="flex-1 flex flex-col gap-6 w-full">
          <GlassPanel className="p-6 flex flex-col gap-6 min-h-[400px]">
            {activeTab === "Problem" ? (
              <>
                <h3 className="font-semibold text-lg text-foreground mb-2">Problem Statement</h3>
                <div className="text-muted-foreground space-y-4 whitespace-pre-wrap leading-relaxed text-sm">
                  {qData.raw_text}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground italic">
                {activeTab} content coming soon...
              </div>
            )}
          </GlassPanel>

          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-white/5 transition-all">
              <Code2 className="w-4 h-4 text-muted-foreground" />
              Run Code
            </button>
            <button className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold hover:opacity-90 shadow-lg transition-all shadow-primary/20 hover:shadow-primary/40">
              <Send className="w-4 h-4" />
              Submit Solution
            </button>
          </div>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
          
          <GlassPanel className="p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-foreground mb-1">Quick Info</h3>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Asked By</span>
              <span className="font-medium text-foreground">{qData.company || "N/A"}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Asked In</span>
              <span className="font-medium text-foreground">On Campus</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Difficulty</span>
              <span className={cn("font-medium", 
                qData.difficulty === 'Easy' ? 'text-status-success' : 
                qData.difficulty === 'Medium' ? 'text-status-warning' : 'text-status-danger'
              )}>
                {qData.difficulty}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium text-status-success">32%</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Submissions</span>
              <span className="font-medium text-foreground">12.4K</span>
            </div>
            
            <div className="pt-3 border-t border-border mt-1">
              <a 
                href={qData.url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                View Source Report <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 flex flex-col gap-4">
            <h3 className="font-semibold text-foreground mb-1">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {qData.tags?.map((t: string) => (
                <div key={t} className="px-3 py-1.5 rounded-lg bg-black/20 border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {TOPIC_STYLES[t]?.name || t}
                </div>
              ))}
            </div>
          </GlassPanel>
          
        </div>
      </div>
    </div>
  );
}
