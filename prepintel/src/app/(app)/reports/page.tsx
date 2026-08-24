"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { CustomSelect } from "@/components/core/CustomSelect";
import { createClient } from "@/lib/supabase/client";
import { cleanReportText } from "@/lib/utils";
import { ReportTextFormatter } from "@/components/core/ReportTextFormatter";
import { Plus, X, FileText, Link as LinkIcon, CheckCircle, Image as ImageIcon } from "lucide-react";

// The FastAPI engine URL
const API_BASE = "http://localhost:8000/api";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const company = searchParams.get("company") || "amazon";
  const role = searchParams.get("role") || "sde-1";
  
  const [reports, setReports] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [submitCompany, setSubmitCompany] = useState("");
  const [submitRole, setSubmitRole] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [round, setRound] = useState("OA");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchReports() {
      setReports([]);
      const { data, error } = await supabase
        .from("raw_reports")
        .select("*")
        .ilike("company", `%${company}%`)
        .ilike("role", `%${role}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching reports:", error);
        return;
      }

      if (data) {
        const cleanedReports = data.map((d: any) => {
          const raw = d.raw_text || "";
          let cleanText = raw;
          try {
            cleanText = cleanReportText(raw);
          } catch (e) {
            console.error("Cleaning error:", e);
          }
          return {
            id: d.id,
            date: new Date(d.created_at).toLocaleDateString(),
            round: d.round || "OA",
            text: cleanText
          };
        }).filter(r => r.text && r.text.length > 5); // Must have some actual content left

        setReports(cleanedReports);
      }
    }

    fetchReports();
  }, [company, role]);

  // Sync form inputs with current URL search params when opening the form
  useEffect(() => {
    if (showForm) {
      setSubmitCompany(company);
      setSubmitRole(role);
    }
  }, [showForm, company, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (files.length > 0) {
        // Post images to Python backend OCR
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f));
        formData.append("company", submitCompany);
        formData.append("role", submitRole);
        formData.append("round", round);
        
        const res = await fetch(`${API_BASE}/ingest/screenshot`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("OCR extraction failed");
      } else {
        // Pass text submission to Python backend for LLM refinement
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${API_BASE}/ingest/text`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            company: submitCompany,
            role: submitRole,
            round: round,
            text: text,
            url: url || undefined,
            user_id: session?.user?.id || undefined
          })
        });
        if (!res.ok) throw new Error("Text refinement failed");
      }
      
      setSuccess(true);
      setText("");
      setUrl("");
      setFiles([]);
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (err) {
      console.error("Submit failed", err);
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Community Reports</h1>
          <p className="text-white/60 text-sm mt-1 capitalize">Recent intelligence for {company} · {role}</p>
        </div>
        
        <GradientButton onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Submit a Report
        </GradientButton>
      </div>

      {showForm && (
        <GlassPanel className="p-6 border-primary/30 relative">
          <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          
              {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 text-status-success" />
              <h3 className="text-lg font-semibold text-white">Report Submitted!</h3>
              <p className="text-white/60 text-sm text-center">Your report has been sent to the pending queue for admin review.<br/>Once approved, it will be ingested into the math engine.</p>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!submitCompany || !submitRole) {
                alert("Please fill in Company and Role.");
                return;
              }
              if (files.length === 0 && !text) {
                alert("Please provide either text or screenshots.");
                return;
              }
              handleSubmit(e);
            }} className="space-y-4" noValidate>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                Submit Interview Experience
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Company</label>
                  <input 
                    type="text" 
                    value={submitCompany} 
                    onChange={e => setSubmitCompany(e.target.value)} 
                    required 
                    placeholder="e.g. Google, Stripe" 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 capitalize" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Role</label>
                  <input 
                    type="text" 
                    value={submitRole} 
                    onChange={e => setSubmitRole(e.target.value)} 
                    required 
                    placeholder="e.g. SDE-1, Data Scientist" 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 capitalize" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Round</label>
                <div className="bg-black/40 border border-white/10 rounded-lg">
                  <CustomSelect 
                    value={round} 
                    onChange={setRound}
                    options={[
                      { value: "OA", label: "Online Assessment (OA)" },
                      { value: "Phone", label: "Phone Screen" },
                      { value: "Onsite", label: "Onsite Loop" },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Raw Report Content</label>
                <textarea 
                  required={files.length === 0}
                  rows={5}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={files.length > 0 ? "Optional context..." : "Paste the questions asked, topics covered, or general experience..."}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Upload Screenshots (Optional)</label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-white/30 absolute left-3 top-2.5" />
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files) {
                        setFiles(Array.from(e.target.files));
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white/70 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  />
                </div>
                {files.length > 0 && (
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {files.length} screenshot(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">Original Source URL (Optional)</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-white/30 absolute left-3 top-2.5" />
                  <input 
                    type="url" 
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://leetcode.com/discuss/..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <GradientButton type="submit" disabled={submitting || (files.length === 0 && !text)}>
                  {submitting ? "Submitting..." : "Submit to Queue"}
                </GradientButton>
              </div>
            </form>
          )}
        </GlassPanel>
      )}

      <div className="space-y-4">
        {reports.map(r => (
          <GlassPanel key={r.id} className="p-5 flex flex-col gap-2 relative group hover:bg-white/[0.03] transition-colors">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80">{r.round}</span>
              <span className="text-xs text-white/40">{r.date}</span>
            </div>
            <div className="mt-2 border border-white/5 rounded-lg p-4 bg-black/20">
              <ReportTextFormatter text={r.text} />
            </div>
          </GlassPanel>
        ))}
        {reports.length === 0 && (
          <div className="p-12 text-center text-white/50">No reports found. Be the first to submit!</div>
        )}
      </div>
    </div>
  );
}
