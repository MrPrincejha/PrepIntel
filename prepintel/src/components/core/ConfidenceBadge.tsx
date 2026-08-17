import { cn } from "@/lib/utils";

export type ConfidenceLevel = "High" | "Medium" | "Low";

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  score: number; // 0-100
  className?: string;
}

export function ConfidenceBadge({ level, score, className }: ConfidenceBadgeProps) {
  const colors = {
    High: "bg-status-success",
    Medium: "bg-status-warning",
    Low: "bg-status-danger",
  };
  const textColors = {
    High: "text-status-success",
    Medium: "text-status-warning",
    Low: "text-status-danger",
  };

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium", className)}>
      <div className={cn("w-2 h-2 rounded-full", colors[level])} />
      <span className="text-white/80">{level}</span>
      <span className={cn("font-mono", textColors[level])}>{score}/100</span>
    </div>
  );
}
