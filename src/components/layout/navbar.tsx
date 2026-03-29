"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  Menu,
  X,
  Trophy,
  BookOpen,
  Zap,
  User,
  LogIn,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { href: "/courses", label: "Explore", icon: BookOpen },
  { href: "/challenges", label: "Challenges", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group"
            id="navbar-logo"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg gradient-bg group-hover:animate-pulse-glow transition-all">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="gradient-text">LJ</span>{" "}
              <span className="text-foreground">CodeQuest</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                id={`nav-${link.label.toLowerCase()}`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-10 w-10 border border-border/50 rounded-full flex items-center justify-center bg-transparent cursor-pointer">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User Avatar"} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || "Student"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard")}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="gap-2 gradient-bg text-white border-0 hover:opacity-90 transition-opacity"
                    >
                      <User className="h-4 w-4" />
                      Get Started
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground text-foreground">
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full bg-background/95 backdrop-blur-lg">
                  <div className="flex items-center gap-2.5 p-6 border-b border-border/50">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-bg">
                      <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold">
                      <span className="gradient-text">LJ</span> CodeQuest
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 p-4 flex-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                      >
                        <link.icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    ))}
                    
                    {user && (
                       <Link
                         href="/dashboard"
                         onClick={() => setIsOpen(false)}
                         className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                       >
                         <LayoutDashboard className="h-5 w-5" />
                         Dashboard
                       </Link>
                    )}
                  </div>

                  <div className="mt-auto p-4 flex flex-col gap-3 border-t border-border/50">
                    {!loading && (
                      user ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 px-2">
                             <Avatar className="h-10 w-10 border border-border">
                              <AvatarImage src={user.photoURL || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {user.displayName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-medium truncate">{user.displayName}</span>
                              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                            </div>
                          </div>
                          <Button 
                            variant="destructive" 
                            className="w-full gap-2 justify-center"
                            onClick={() => {
                              logout();
                              setIsOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Log Out
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Link href="/login" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full gap-2 justify-center border-border/50">
                              <LogIn className="h-4 w-4" />
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/register" onClick={() => setIsOpen(false)}>
                            <Button className="w-full gap-2 justify-center gradient-bg text-white border-0 hover:opacity-90">
                              <User className="h-4 w-4" />
                              Get Started
                            </Button>
                          </Link>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
