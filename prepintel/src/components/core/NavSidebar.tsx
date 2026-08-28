"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, ListTodo, Map, FileText, Bookmark, BarChart3, Settings, User } from "lucide-react";
import { Logo } from "./Logo";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Questions", href: "/questions", icon: ListTodo },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { name: "Progress", href: "/progress", icon: BarChart3 },
  { name: "Analytics", href: "/analytics", icon: Target },
];

export function NavSidebar() {
  const pathname = usePathname();
  const searchParams = require('next/navigation').useSearchParams();
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Build the query string to append to links
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-background border-r border-border h-screen sticky top-0 p-4 shrink-0">
        <div className="mb-8 px-2 flex items-center h-12">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
            return (
              <Link
                key={item.name}
                href={`${item.href}${suffix}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 relative z-10 transition-transform duration-300",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                )} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-4 border-t border-border mt-auto flex flex-col gap-2">
          {user?.email?.toLowerCase() === "princejha200490@gmail.com" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all group"
            >
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              Admin Queue
            </Link>
          )}
          
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:bg-white/5 transition-colors cursor-pointer mt-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0"
                style={{ backgroundColor: user.user_metadata?.avatar_url ? 'transparent' : stringToColor(user.email || 'user') }}
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground truncate">{user.user_metadata?.full_name || user.email?.split('@')[0] || "User"}</span>
                <span className="text-xs text-muted-foreground">View Profile</span>
              </div>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-white/5 transition-all mt-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 px-2 py-2 flex items-center justify-around overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.name}
              href={`${item.href}${suffix}`}
              className={cn(
                "flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "opacity-70")} />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
