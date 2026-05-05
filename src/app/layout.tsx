import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AuthProvider } from "@/contexts/AuthContext";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LJ CodeQuest — Master Your Coding Skills",
  description:
    "An advanced e-learning platform to test your skills, solve coding challenges, earn verified certificates, and compete on global leaderboards. Built by Lahiru Harshana Jayasinghe.",
  keywords: [
    "coding challenges",
    "e-learning",
    "programming",
    "certificates",
    "HackerRank alternative",
    "coding assessment",
    "LJ CodeQuest",
  ],
  authors: [{ name: "Lahiru Harshana Jayasinghe" }],
  openGraph: {
    title: "LJ CodeQuest — Master Your Coding Skills",
    description:
      "An advanced e-learning platform with coding challenges, certificates, and leaderboards.",
    type: "website",
    siteName: "LJ CodeQuest",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased scroll-smooth`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              <SiteChrome>{children}</SiteChrome>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
