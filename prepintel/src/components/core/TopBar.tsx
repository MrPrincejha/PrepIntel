"use client";

import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // State for dropdown options
  const [companies, setCompanies] = useState([{ id: "amazon", name: "Amazon" }, { id: "google", name: "Google" }, { id: "microsoft", name: "Microsoft" }]);
  const [roles, setRoles] = useState([{ id: "sde-intern", name: "SDE Intern" }, { id: "sde-1", name: "SDE-1" }]);
  const [cycles, setCycles] = useState([{ id: "2024", label: "2024" }, { id: "2025", label: "2025" }, { id: "2026", label: "2026" }]);

  // Selected state
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get("company") || "");
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "");
  const [selectedCycle, setSelectedCycle] = useState(searchParams.get("cycle") || "");

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: reports, error } = await supabase.from('raw_reports').select('company, role');
        
        if (reports && reports.length > 0) {
          const uniqueCompanies = Array.from(new Set(reports.map(r => r.company?.toLowerCase() || ''))).filter(c => c && c !== 'unknown');
          const uniqueRoles = Array.from(new Set(reports.map(r => r.role?.toLowerCase() || ''))).filter(Boolean);
          
          if (uniqueCompanies.length > 0) {
            setCompanies(uniqueCompanies.map(c => ({ id: c, name: c.charAt(0).toUpperCase() + c.slice(1) })));
          }
          if (uniqueRoles.length > 0) {
            setRoles(uniqueRoles.map(r => ({ id: r, name: r.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('-') })));
          }
        }
      } catch (err) {
        console.warn("Using fallback mock data for selectors", err);
      }
    }
    fetchData();
  }, [supabase]);

  // Sync to URL and localStorage
  const updateUrl = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
    localStorage.setItem(`prepintel_${key}`, value);
  }, [searchParams, router]);

  // Initial load from localStorage if URL params are missing
  useEffect(() => {
    const urlCompany = searchParams.get("company");
    const urlRole = searchParams.get("role");
    const urlCycle = searchParams.get("cycle");

    if (!urlCompany && typeof window !== "undefined") {
      const saved = localStorage.getItem("prepintel_company");
      if (saved) { setSelectedCompany(saved); updateUrl("company", saved); }
    }
    if (!urlRole && typeof window !== "undefined") {
      const saved = localStorage.getItem("prepintel_role");
      if (saved) { setSelectedRole(saved); updateUrl("role", saved); }
    }
    if (!urlCycle && typeof window !== "undefined") {
      const saved = localStorage.getItem("prepintel_cycle");
      if (saved) { setSelectedCycle(saved); updateUrl("cycle", saved); }
    }
  }, [searchParams, updateUrl]);

  const handleCompanyChange = (val: string) => { setSelectedCompany(val); updateUrl("company", val); };
  const handleRoleChange = (val: string) => { setSelectedRole(val); updateUrl("role", val); };
  const handleCycleChange = (val: string) => { setSelectedCycle(val); updateUrl("cycle", val); };

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useCallback(() => {
    if (!searchQuery) return [];
    
    function lcsScore(q: string, t: string): number {
      const ql = q.toLowerCase();
      const tl = t.toLowerCase();
      const dp = Array.from({ length: ql.length + 1 }, () => Array(tl.length + 1).fill(0));
      for (let i = 1; i <= ql.length; i++) {
        for (let j = 1; j <= tl.length; j++) {
          if (ql[i - 1] === tl[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
          else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return dp[ql.length][tl.length] * 100 - tl.length; // Tie-breaker for shorter strings
    }
    
    return companies
      .map(c => ({ ...c, score: lcsScore(searchQuery, c.name) }))
      .filter(c => c.score > -100) // basic threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [searchQuery, companies]);

  const companyName = companies.find(c => c.id === selectedCompany)?.name || "Company";
  const roleName = roles.find(r => r.id === selectedRole)?.name || "Role";
  const cycleLabel = cycles.find(c => c.id === selectedCycle)?.label || "Year";

  return (
    <div className="h-16 border-b border-white/10 bg-background/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="relative w-64 opacity-50 focus-within:opacity-100 transition-opacity" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search companies..."
          className="w-full bg-black/40 border border-white/5 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/30"
        />
        {searchOpen && searchQuery && (
          <div className="absolute top-full left-0 mt-2 w-full bg-[#0B0D14] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
            {searchResults().length > 0 ? searchResults().map(c => (
              <button
                key={c.id}
                onClick={() => { handleCompanyChange(c.id); setSearchOpen(false); setSearchQuery(''); }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                {c.name}
              </button>
            )) : (
              <div className="px-4 py-2 text-sm text-white/50">No companies found</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Selector label="Company" value={companyName} options={companies} onSelect={handleCompanyChange} />
        <Selector label="Role" value={roleName} options={roles} onSelect={handleRoleChange} />
        <Selector label="Year" value={cycleLabel} options={cycles.map(c => ({ id: c.id, name: c.label }))} onSelect={handleCycleChange} />
      </div>
    </div>
  );
}

function Selector({ label, value, options, onSelect }: { label: string; value: string; options: { id: string; name: string }[]; onSelect: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-sm"
      >
        <span className="text-primary/70 font-medium">{label}:</span>
        <span className="font-semibold text-primary">{value}</span>
        <ChevronDown className="w-4 h-4 text-primary/70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0B0D14] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => { onSelect(opt.id); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
