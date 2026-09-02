import { NavSidebar } from "@/components/core/NavSidebar";
import { TopBar } from "@/components/core/TopBar";
import { AuthGuard } from "@/components/core/AuthGuard";

// Force all pages in the (app) group to be rendered dynamically at request time.
// This is required because they all use useSearchParams() which cannot be statically pre-rendered.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        <NavSidebar />
        <div className="flex-1 flex flex-col min-h-screen w-full min-w-0">
          <TopBar />
          <main className="flex-1 px-4 md:px-8 pt-8 pb-20 md:pb-8 w-full">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
