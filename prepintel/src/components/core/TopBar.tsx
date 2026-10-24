"use client";

import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_COMPANIES = [
  { id: "accenture", name: "Accenture" },
  { id: "adobe", name: "Adobe" },
  { id: "airbnb", name: "Airbnb" },
  { id: "amazon", name: "Amazon" },
  { id: "apple", name: "Apple" },
  { id: "atlassian", name: "Atlassian" },
  { id: "bloomberg", name: "Bloomberg" },
  { id: "bytedance", name: "ByteDance" },
  { id: "cisco", name: "Cisco" },
  { id: "cognizant", name: "Cognizant" },
  { id: "flipkart", name: "Flipkart" },
  { id: "goldman-sachs", name: "Goldman Sachs" },
  { id: "google", name: "Google" },
  { id: "infosys", name: "Infosys" },
  { id: "intuit", name: "Intuit" },
  { id: "jpmorgan", name: "JPMorgan" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "meta", name: "Meta" },
  { id: "microsoft", name: "Microsoft" },
  { id: "netflix", name: "Netflix" },
  { id: "oracle", name: "Oracle" },
  { id: "paypal", name: "PayPal" },
  { id: "salesforce", name: "Salesforce" },
  { id: "samsung", name: "Samsung" },
  { id: "swiggy", name: "Swiggy" },
  { id: "tcs", name: "TCS" },
  { id: "twitter", name: "Twitter" },
  { id: "uber", name: "Uber" },
  { id: "walmart", name: "Walmart" },
  { id: "wipro", name: "Wipro" },
  { id: "zomato", name: "Zomato" }
];

export function TopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // State for dropdown options
  const [companies, setCompanies] = useState(DEFAULT_COMPANIES);
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
        // Query public.companies table (has all 73 companies)
        const { data: compRows } = await supabase
          .from('companies')
          .select('slug, name')
          .order('name');
          
        if (compRows && compRows.length > 0) {
          setCompanies(compRows.map(c => ({ id: c.slug, name: c.name })));
        } else {
          // Fallback to raw_reports
          const { data: reports } = await supabase.from('raw_reports').select('company, role');
          if (reports && reports.length > 0) {
            const excluded = ['unknown', 'requirements ', 'code of conduct ', 'question-bank', 'tech general'];
            const uniqueCompanies = Array.from(new Set(reports.map(r => r.company?.trim() || '')))
              .filter(c => c && !excluded.includes(c.toLowerCase()));
            if (uniqueCompanies.length > 0) {
              uniqueCompanies.sort((a, b) => a.localeCompare(b));
              setCompanies(uniqueCompanies.map(c => ({
                id: c.toLowerCase().replace(/[\s-]+/g, '-'),
                name: c
              })));
            }
          }
        }

        // Query roles
        const { data: reports } = await supabase.from('raw_reports').select('role').limit(200);
        if (reports && reports.length > 0) {
          const uniqueRoles = Array.from(new Set(reports.map(r => r.role?.toLowerCase() || ''))).filter(Boolean);
          if (uniqueRoles.length > 0) {
            setRoles(uniqueRoles.map(r => ({ id: r, name: r.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('-') })));
          }
        }
      } catch (err) {
        console.warn("Using fallback data for selectors", err);
      }
    }
    fetchData();
  }, []);

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

  const companyName = companies.find(c => c.id.toLowerCase() === selectedCompany.toLowerCase() || c.name.toLowerCase() === selectedCompany.toLowerCase())?.name 
    || (selectedCompany ? selectedCompany.charAt(0).toUpperCase() + selectedCompany.slice(1) : "Company");
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
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
        setFilter("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = filter
    ? options.filter(o => o.name.toLowerCase().includes(filter.toLowerCase()) || o.id.toLowerCase().includes(filter.toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => { setOpen(!open); setFilter(""); }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors text-sm"
      >
        <span className="text-primary/70 font-medium">{label}:</span>
        <span className="font-semibold text-primary">{value}</span>
        <ChevronDown className="w-4 h-4 text-primary/70" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-[#0B0D14] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {options.length > 6 && (
            <div className="p-2 border-b border-white/10">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.03]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.id.toLowerCase() === value.toLowerCase() || opt.name.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={opt.id}
                    onClick={() => { onSelect(opt.id); setOpen(false); setFilter(""); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between",
                      isSelected
                        ? "text-primary bg-primary/10 font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span>{opt.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-xs text-white/40 text-center">No match found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
