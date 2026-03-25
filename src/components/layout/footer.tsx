import Link from "next/link";
import { Code2, Globe, ExternalLink, Heart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Explore Tracks", href: "/explore" },
    { label: "Challenges", href: "/challenges" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Certificates", href: "/certificates" },
  ],
  Resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Support", href: "/support" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-bg">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="gradient-text">LJ</span> CodeQuest
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Master your coding skills through hands-on challenges, earn
              verified certificates, and showcase your expertise to the world.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="https://github.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Globe className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Twitter"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
              <Link
                href="https://linkedin.com"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LJ CodeQuest. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-500 fill-red-500" />{" "}
            by Lahiru Harshana Jayasinghe
          </p>
        </div>
      </div>
    </footer>
  );
}
