"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Code2,
  Menu,
  X,
  Trophy,
  BookOpen,
  Zap,
  User,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/explore", label: "Explore", icon: BookOpen },
  { href: "/challenges", label: "Challenges", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
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
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
              id="btn-sign-in"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
            <Button
              size="sm"
              className="gap-2 gradient-bg text-white border-0 hover:opacity-90 transition-opacity"
              id="btn-get-started"
            >
              <User className="h-4 w-4" />
              Get Started
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label="Toggle menu"
                      id="mobile-menu-toggle"
                    />
                  }
                >
                  {isOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Logo */}
                  <div className="flex items-center gap-2.5 p-6 border-b border-border">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-bg">
                      <Code2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-lg font-bold">
                      <span className="gradient-text">LJ</span> CodeQuest
                    </span>
                  </div>

                  {/* Mobile Links */}
                  <div className="flex flex-col gap-1 p-4">
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
                  </div>

                  {/* Mobile Actions */}
                  <div className="mt-auto p-4 flex flex-col gap-2 border-t border-border">
                    <Button
                      variant="outline"
                      className="w-full gap-2 justify-center"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                    <Button className="w-full gap-2 justify-center gradient-bg text-white border-0">
                      <User className="h-4 w-4" />
                      Get Started
                    </Button>
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
