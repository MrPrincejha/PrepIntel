"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "@/components/core/GlassPanel";
import { createClient } from "@/lib/supabase/client";
import { Check, X, Edit2, ShieldAlert } from "lucide-react";

export default function AdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPending() {
      try {
        // Attempt to fetch from real supabase
        const { data } = await supabase.from('raw_reports').select('*').eq('status', 'pending');
        if (data && data.length > 0) {
          setReports(data);
        } else {
          // Fallback mock data
          setReports([
            { id: "mock-1", company: "amazon", role: "sde-1", round: "OA", text: "Asked standard graph questions.", status: "pending" },
            { id: "mock-2", company: "google", role: "swe-3", round: "Onsite", text: "Very deep dive into distributed systems and a hard DP problem.", status: "pending" }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    fetchPending();
  }, [supabase]);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setReports(prev => prev.filter(r => r.id !== id));
    
    // Attempt real update, gracefully fail if mock
    if (!id.startsWith("mock")) {
      await supabase.from('raw_reports').update({ status: action }).eq('id', id);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-status-error" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Review Queue</h1>
          <p className="text-white/60 text-sm mt-1">Approve or reject community-submitted interview reports before ingestion.</p>
        </div>
      </div>

      <GlassPanel className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/50">Loading queue...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-white/50">No pending reports in the queue.</div>
        ) : (
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 border-b border-white/10 text-white/60 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Context</th>
                <th className="px-6 py-4 font-medium">Raw Text</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-white capitalize">{r.company}</span>
                      <span className="text-white/50 capitalize">{r.role} · {r.round}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <p className="truncate">{r.text || r.raw_text}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAction(r.id, 'approved')}
                        className="p-1.5 rounded bg-status-success/20 text-status-success hover:bg-status-success/30 transition-colors"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction(r.id, 'rejected')}
                        className="p-1.5 rounded bg-status-error/20 text-status-error hover:bg-status-error/30 transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 rounded bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassPanel>
    </div>
  );
}
