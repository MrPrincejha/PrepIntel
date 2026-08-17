"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  icon?: React.ReactNode;
  className?: string;
}

export function CustomSelect({ value, onChange, options, icon, className }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-transparent text-sm text-white focus:outline-none py-1.5 px-3 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-white/40">{icon}</span>}
          <span>{selectedLabel}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-white/50 shrink-0" />
      </button>
      
      {open && (
        <div className="absolute left-0 top-full mt-1 w-max min-w-full bg-[#0B0D14] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  value === opt.value ? "bg-primary/20 text-primary" : "text-white hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
