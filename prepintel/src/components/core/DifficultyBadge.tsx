import { cn } from "@/lib/utils";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Unknown";

export const DifficultyBadge = ({ level, className }: { level: string; className?: string }) => {
  let styles = "text-white/50 bg-white/5 border-white/10";
  const normalizedLevel = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();

  switch (normalizedLevel) {
    case "Easy":
      styles = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      break;
    case "Medium":
      styles = "text-amber-400 bg-amber-500/10 border-amber-500/20";
      break;
    case "Hard":
      styles = "text-rose-400 bg-rose-500/10 border-rose-500/20";
      break;
  }

  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", styles, className)}>
      {normalizedLevel}
    </span>
  );
};
