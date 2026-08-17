import { GlassPanel } from "./GlassPanel";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  trend: "up" | "down" | "stable";
  trendValue?: string;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({ title, value, trend, trendValue, icon, iconBgColor = "bg-primary/20", iconColor = "text-primary" }: StatCardProps) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  return (
    <GlassPanel className="p-5 flex flex-col gap-4 cursor-default">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl flex items-center justify-center", iconBgColor, iconColor)}>
          {icon}
        </div>
        <span className="text-sm font-medium text-white/70 uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white">{value}</span>
        {trend !== "stable" && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", isUp ? "text-status-success" : "text-status-danger")}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
        {trend === "stable" && (
          <div className="flex items-center gap-1 text-sm font-medium text-white/40">
            <Minus className="w-4 h-4" />
            Stable
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
