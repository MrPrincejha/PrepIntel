import { cn } from "@/lib/utils";

interface TagPillProps {
  label: string;
  className?: string;
}

export function TagPill({ label, className }: TagPillProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/90 border border-white/5", className)}>
      {label}
    </span>
  );
}
