"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Filter,
  Flame,
  Search,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Challenge = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  language: string;
  xpReward: number;
  timeLimitMinutes: number;
  tags: string[];
  completionsCount: number;
  progress?: {
    status: "in-progress" | "completed";
    attempts: number;
    bestScore: number;
    completedAt?: string;
  } | null;
};

const difficultyStyles = {
  easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function ChallengesClient() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (difficulty !== "all") params.set("difficulty", difficulty);

        const res = await fetch(`/api/challenges${params.toString() ? `?${params}` : ""}`);
        const data = await res.json();
        if (data.success) {
          setChallenges(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch challenges", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [searchTerm, difficulty]);

  const completedCount = useMemo(
    () => challenges.filter((challenge) => challenge.progress?.status === "completed").length,
    [challenges]
  );
  const startedCount = useMemo(
    () => challenges.filter((challenge) => challenge.progress).length,
    [challenges]
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="border-b border-border bg-card/40">
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-5">
              <Code2 className="h-3.5 w-3.5" />
              Practice Arena
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Coding Challenges
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Solve focused programming drills, pass real test cases, and build momentum between courses.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-8 max-w-3xl">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available</p>
              <p className="text-2xl font-black mt-1">{challenges.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Started</p>
              <p className="text-2xl font-black mt-1">{startedCount}</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="text-2xl font-black mt-1">{completedCount}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-card p-4 rounded-lg border border-border">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search challenges..."
              className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              className="w-full md:w-auto bg-background border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-72 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <Code2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold">No challenges found</h3>
            <p className="text-muted-foreground mt-2">
              Try a different search, or check back after new challenges are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const isDone = challenge.progress?.status === "completed";
              const score = challenge.progress?.bestScore || 0;
              const isStarted = Boolean(challenge.progress);

              return (
                <Link key={challenge._id} href={`/challenges/${challenge.slug}`}>
                  <article className="h-full rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div className="space-y-2">
                        <Badge variant="outline" className={difficultyStyles[challenge.difficulty]}>
                          {challenge.difficulty}
                        </Badge>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                          {challenge.category} / {challenge.language}
                        </p>
                      </div>
                      {isDone ? (
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="rounded-full bg-primary/10 p-2 text-primary">
                          <Flame className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {challenge.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 min-h-10">
                      {challenge.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-5">
                      {challenge.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      {isStarted ? (
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold mb-2">
                            <span>{isDone ? "Completed" : "Best score"}</span>
                            <span className={isDone ? "text-emerald-500" : "text-muted-foreground"}>
                              {isDone ? "Done" : `${score}%`}
                            </span>
                          </div>
                          <Progress
                            value={isDone ? 100 : score}
                            className={isDone ? "[&_[data-slot=progress-indicator]]:bg-emerald-600" : ""}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Trophy className="h-4 w-4 text-primary" />
                          {challenge.xpReward} XP / {challenge.timeLimitMinutes} min
                        </div>
                      )}

                      <Button variant="ghost" className="p-0 h-auto font-semibold text-primary group-hover:translate-x-1 transition-transform">
                        {isStarted ? "Continue Challenge" : "Start Challenge"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
