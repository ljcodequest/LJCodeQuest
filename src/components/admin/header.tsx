import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IUser } from "@/models/User";

interface AdminHeaderProps {
  user: IUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-4">
          <div className="md:hidden font-bold">Admin Panel</div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-medium leading-none">{user.displayName || user.username}</span>
              <span className="text-xs text-muted-foreground capitalize mt-1">{user.role}</span>
            </div>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl || ""} alt="Avatar" />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user.displayName?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
