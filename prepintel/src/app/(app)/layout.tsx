import { NavSidebar } from "@/components/core/NavSidebar";
import { TopBar } from "@/components/core/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <NavSidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
