import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

export function GlassPanel({ className, children, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-2xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
