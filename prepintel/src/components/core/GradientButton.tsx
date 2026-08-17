import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  withArrow?: boolean;
}

export function GradientButton({ children, className, withArrow, ...props }: GradientButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] bg-gradient-to-r from-cyan-400 to-violet-500",
        className
      )}
      {...props}
    >
      {children}
      {withArrow && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}
