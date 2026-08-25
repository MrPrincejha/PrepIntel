import { GlassPanel } from "./GlassPanel";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-white/5 rounded mb-2"></div>
          <div className="h-4 w-32 bg-white/5 rounded"></div>
        </div>
        <div className="h-8 w-24 bg-white/5 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <GlassPanel key={i} className="p-5 flex flex-col justify-between h-32">
            <div className="flex justify-between items-start mb-2">
              <div className="h-4 w-24 bg-white/5 rounded"></div>
              <div className="w-8 h-8 rounded-lg bg-white/5"></div>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="h-10 w-20 bg-white/5 rounded"></div>
              <div className="h-4 w-12 bg-white/5 rounded"></div>
            </div>
          </GlassPanel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="p-6 lg:col-span-2 h-[400px]">
          <div className="h-5 w-48 bg-white/5 rounded mb-6"></div>
          <div className="w-full h-full bg-white/[0.02] rounded-lg"></div>
        </GlassPanel>

        <GlassPanel className="p-6 h-[400px] flex flex-col items-center justify-center">
          <div className="h-5 w-40 bg-white/5 rounded mb-6 self-start"></div>
          <div className="w-48 h-48 rounded-full bg-white/5"></div>
          <div className="flex gap-4 mt-8">
            <div className="h-3 w-12 bg-white/5 rounded"></div>
            <div className="h-3 w-12 bg-white/5 rounded"></div>
            <div className="h-3 w-12 bg-white/5 rounded"></div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-white/5 rounded mb-2"></div>
          <div className="h-4 w-32 bg-white/5 rounded"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-white/5 rounded-lg"></div>
          <div className="h-10 w-32 bg-white/5 rounded-lg"></div>
        </div>
      </div>

      <GlassPanel className="p-0 overflow-hidden">
        <div className="divide-y divide-white/5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="h-6 w-8 bg-white/5 rounded"></div>
              <div className="h-6 w-full max-w-md bg-white/5 rounded"></div>
              <div className="flex gap-2 ml-auto">
                <div className="h-6 w-16 bg-white/5 rounded-full"></div>
                <div className="h-6 w-16 bg-white/5 rounded-full"></div>
                <div className="h-6 w-10 bg-white/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
