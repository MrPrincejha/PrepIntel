import { PublicNavbar } from "@/components/core/PublicNavbar";
import { PublicFooter } from "@/components/core/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
