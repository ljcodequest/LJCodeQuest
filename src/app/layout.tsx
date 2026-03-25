import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Navbar />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
