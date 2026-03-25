import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Trophy,
  Award,
  Zap,
  Terminal,
  Brain,
  Users,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Star,
  Shield,
  Flame,
  Target,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/* ========== HERO SECTION ========== */
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-brand-cyan/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-brand-purple/10 blur-3xl animate-float delay-300" />
      <div className="absolute top-40 right-20 w-48 h-48 rounded-full bg-brand-blue/10 blur-3xl animate-float delay-500" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="animate-fade-in-down mb-8">
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-sm font-medium border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Now in Public Beta — Start Learning for Free
          </Badge>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
          <span className="text-foreground">Level Up Your</span>
          <br />
          <span className="gradient-text">Coding Skills</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-in-up delay-200 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
          Master programming through hands-on challenges, earn verified
          certificates, and compete on global leaderboards. Your journey from
          beginner to expert starts here.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/explore">
            <Button
              size="lg"
              className="h-13 px-8 text-base gradient-bg text-white border-0 hover:opacity-90 transition-all glow-blue gap-2 group"
              id="hero-get-started"
            >
              Start Coding Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base gap-2 group"
              id="hero-explore"
            >
              <BookOpen className="h-4 w-4" />
              Explore Tracks
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="animate-fade-in-up delay-600 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "500+", label: "Challenges", icon: Target },
            { value: "50+", label: "Learning Tracks", icon: BookOpen },
            { value: "10K+", label: "Active Users", icon: Users },
            { value: "25K+", label: "Certificates Issued", icon: Award },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center mb-2">
                <stat.icon className="h-5 w-5 text-brand-cyan mr-2" />
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== FEATURES SECTION ========== */
const features = [
  {
    icon: Terminal,
    title: "Live Code Execution",
    description:
      "Write, compile, and run code in 15+ languages directly in your browser with our integrated code editor powered by Monaco.",
    color: "text-brand-cyan",
    bgColor: "bg-brand-cyan/10",
    borderColor: "border-brand-cyan/20",
  },
  {
    icon: Brain,
    title: "AI-Powered Hints",
    description:
      "Stuck on a challenge? Our AI analyzes your code and provides intelligent hints without giving away the answer.",
    color: "text-brand-purple",
    bgColor: "bg-brand-purple/10",
    borderColor: "border-brand-purple/20",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description:
      "Earn blockchain-verifiable certificates upon completing tracks. Share them with employers via a unique verification link.",
    color: "text-brand-green",
    bgColor: "bg-brand-green/10",
    borderColor: "border-brand-green/20",
  },
  {
    icon: Trophy,
    title: "Global Leaderboard",
    description:
      "Compete with developers worldwide. Climb the ranks based on speed, accuracy, and consistency.",
    color: "text-brand-amber",
    bgColor: "bg-brand-amber/10",
    borderColor: "border-brand-amber/20",
  },
  {
    icon: Shield,
    title: "Mastery Progression",
    description:
      "Unlock advanced modules only after mastering the fundamentals. Our strict progression ensures deep understanding.",
    color: "text-brand-blue",
    bgColor: "bg-brand-blue/10",
    borderColor: "border-brand-blue/20",
  },
  {
    icon: Flame,
    title: "Gamification & Streaks",
    description:
      "Earn XP, collect badges, and maintain daily streaks. Stay motivated with our engaging gamification system.",
    color: "text-brand-pink",
    bgColor: "bg-brand-pink/10",
    borderColor: "border-brand-pink/20",
  },
];

function FeaturesSection() {
  return (
    <section className="py-24 relative" id="features">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 px-3 py-1 text-xs font-medium"
          >
            <Zap className="h-3 w-3 mr-1" />
            Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Excel</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            From interactive coding challenges to verified certificates, we
            provide a complete learning ecosystem.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative p-6 rounded-2xl border ${feature.borderColor} bg-card card-hover cursor-default`}
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4 transition-transform group-hover:scale-110`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover gradient */}
              <div
                className={`absolute inset-0 rounded-2xl ${feature.bgColor} opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== TRACKS SECTION ========== */
const tracks = [
  {
    name: "Java",
    level: "Beginner → Advanced",
    modules: 12,
    challenges: 85,
    color: "from-orange-500 to-red-600",
    icon: "☕",
  },
  {
    name: "Python",
    level: "Beginner → Advanced",
    modules: 10,
    challenges: 72,
    color: "from-blue-500 to-cyan-500",
    icon: "🐍",
  },
  {
    name: "JavaScript",
    level: "Beginner → Advanced",
    modules: 14,
    challenges: 96,
    color: "from-yellow-400 to-yellow-600",
    icon: "⚡",
  },
  {
    name: "C++",
    level: "Beginner → Advanced",
    modules: 11,
    challenges: 78,
    color: "from-blue-600 to-indigo-700",
    icon: "⚙️",
  },
  {
    name: "React",
    level: "Intermediate → Advanced",
    modules: 8,
    challenges: 45,
    color: "from-cyan-400 to-blue-500",
    icon: "⚛️",
  },
  {
    name: "Data Structures",
    level: "Beginner → Advanced",
    modules: 15,
    challenges: 120,
    color: "from-green-500 to-emerald-600",
    icon: "🏗️",
  },
];

function TracksSection() {
  return (
    <section className="py-24 relative gradient-bg-subtle" id="tracks">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 px-3 py-1 text-xs font-medium"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Learning Tracks
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Choose Your <span className="gradient-text">Learning Path</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Structured learning tracks with strict mastery progression. Complete
            each level before unlocking the next.
          </p>
        </div>

        {/* Track Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div
              key={track.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card card-hover"
            >
              {/* Gradient Header */}
              <div
                className={`h-2 bg-gradient-to-r ${track.color}`}
              />

              <div className="p-6">
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{track.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {track.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {track.level}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {track.modules} Modules
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {track.challenges} Challenges
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 gap-2 group-hover:bg-accent transition-colors"
                >
                  Start Track
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-10">
          <Link href="/explore">
            <Button variant="outline" size="lg" className="gap-2 group">
              View All Tracks
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ========== HOW IT WORKS ========== */
const steps = [
  {
    step: "01",
    title: "Choose a Track",
    description:
      "Browse our curated learning tracks and pick the one that matches your goals. From Python basics to advanced algorithms.",
    icon: Target,
  },
  {
    step: "02",
    title: "Solve Challenges",
    description:
      "Complete coding challenges of increasing difficulty. Write real code, pass test cases, and learn by doing.",
    icon: Code2,
  },
  {
    step: "03",
    title: "Earn Certificates",
    description:
      "Score the required passing grade on final assessments to earn a verified, downloadable certificate with a unique ID.",
    icon: Award,
  },
  {
    step: "04",
    title: "Showcase & Compete",
    description:
      "Share your public profile and certificates with employers. Climb the leaderboard and prove your expertise.",
    icon: Star,
  },
];

function HowItWorksSection() {
  return (
    <section className="py-24 relative" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 px-3 py-1 text-xs font-medium"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Your Path to{" "}
            <span className="gradient-text">Mastery</span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            A simple four-step journey from choosing your track to showcasing
            your verified skills.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}

              <div className="relative text-center lg:text-left">
                {/* Step Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-bg text-white text-xl font-bold mb-4">
                  {step.step}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========== CTA SECTION ========== */
function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 gradient-bg opacity-90" />
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-6">
          Ready to Start Your{" "}
          <span className="text-cyan-300">Coding Journey?</span>
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
          Join thousands of developers who are leveling up their skills with LJ
          CodeQuest. It&apos;s free to get started.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/explore">
            <Button
              size="lg"
              className="h-13 px-8 text-base bg-white text-gray-900 hover:bg-white/90 gap-2 group"
              id="cta-get-started"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base border-white/30 text-white hover:bg-white/10 gap-2"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ========== MAIN PAGE ========== */
export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TracksSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
