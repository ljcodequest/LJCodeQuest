"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart, 
  BookOpen, 
  ListOrdered, 
  Users, 
  CheckSquare, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: BarChart },
  { name: "Courses", href: "/admin/courses", icon: BookOpen },
  { name: "Tracks", href: "/admin/tracks", icon: ListOrdered },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: CheckSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-primary">Admin</span> Panel
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Log Out
        </button>
      </div>
    </aside>
  );
}
