import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface LogoProps {
  size?: "sm" | "lg";
  className?: string;
}

export function Logo({ size = "sm", className }: LogoProps) {
  const isLg = size === "lg";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center", isLg ? "w-10 h-10" : "w-8 h-8")}>
        <Eye className={cn("absolute text-cyan-400", isLg ? "w-8 h-8" : "w-6 h-6")} />
        <div className={cn("absolute rounded-full bg-violet-500", isLg ? "w-3 h-3" : "w-2 h-2")} />
      </div>
      <span className={cn("font-bold tracking-tight", isLg ? "text-3xl" : "text-xl")}>
        <span className="text-white">Prep</span>
        <span className="text-gradient">Intel</span>
      </span>
    </div>
  );
}
