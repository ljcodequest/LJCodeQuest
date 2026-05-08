"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Loader2,
  Play,
  Terminal,
  Trophy,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
};

type Challenge = {
  _id: string;
  title: string;
  summary: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  language: string;
  starterCode: string;
  testCases: TestCase[];
  xpReward: number;
  timeLimitMinutes: number;
  tags: string[];
};

type ProgressData = {
  status: "in-progress" | "completed";
  attempts: number;
  bestScore: number;
  lastSubmittedCode?: string;
  language?: string;
} | null;

type ExecutionResult = {
  name: string;
  passed: boolean;
  isHidden: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
};

type SubmissionData = {
  passed: boolean;
  score: number;
  xpEarned: number;
  execution: {
    results: ExecutionResult[];
  };
  progress: ProgressData;
};

const difficultyStyles = {
  easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

function getEditorLanguage(language: string) {
  if (language === "javascript") return "javascript";
  if (language === "python") return "python";
  if (language === "java") return "java";
  if (language === "c++") return "cpp";
  return "plaintext";
}

export default function ChallengeWorkspace({ slug }: { slug: string }) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ProgressData>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<SubmissionData | null>(null);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/challenges/${slug}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Challenge not found.");
        }

        setChallenge(data.data.challenge);
        setProgress(data.data.progress);
        setCode(data.data.progress?.lastSubmittedCode || data.data.challenge.starterCode || "");
      } catch (error) {
        console.error("Failed to fetch challenge", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenge();
  }, [slug]);

  const editorLanguage = useMemo(
    () => getEditorLanguage(challenge?.language || "javascript"),
    [challenge?.language]
  );

  const handleSubmit = async () => {
    if (!challenge || !code.trim()) return;

    setIsSubmitting(true);
    setSubmission(null);

    try {
      const res = await fetch(`/api/challenges/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: challenge.language,
          sourceCode: code,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Challenge submission failed.");
      }

      setSubmission(data.data);
      setProgress(data.data.progress);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Challenge submission failed.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Code2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Challenge not found</h1>
        <Link href="/challenges" className="mt-6">
          <Button variant="outline">Back to challenges</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = progress?.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/challenges">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold truncate">
              {challenge.category} / {challenge.language}
            </p>
            <h1 className="font-bold truncate">{challenge.title}</h1>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {challenge.timeLimitMinutes} min
            </span>
            <Badge variant="outline" className={difficultyStyles[challenge.difficulty]}>
              {challenge.difficulty}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className={difficultyStyles[challenge.difficulty]}>
                  {challenge.difficulty}
                </Badge>
                <Badge variant="outline">{challenge.xpReward} XP</Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold">{challenge.title}</h2>
              <p className="text-sm text-muted-foreground mt-2">{challenge.summary}</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Instructions
                </h3>
                <div className="whitespace-pre-wrap text-sm leading-7">{challenge.description}</div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Sample Tests
                </h3>
                <div className="space-y-3">
                  {challenge.testCases.slice(0, 3).map((testCase, index) => (
                    <div key={testCase.id || index} className="rounded-lg border border-border bg-background p-4 font-mono text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">Case {index + 1}</span>
                        {testCase.isHidden && <span className="text-muted-foreground">Hidden</span>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-muted-foreground mb-1">Input</p>
                          <pre className="overflow-x-auto whitespace-pre-wrap">{testCase.input}</pre>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Expected</p>
                          <pre className="overflow-x-auto whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-[#1e1e1e] overflow-hidden min-h-[720px] flex flex-col">
            <div className="p-3 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#d4d4d4] font-mono">
                <Terminal className="h-4 w-4" />
                main.{editorLanguage === "python" ? "py" : editorLanguage === "javascript" ? "js" : editorLanguage}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !code.trim()}
                className="gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run & Submit
              </Button>
            </div>

            <div className="flex-1 min-h-[420px]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={editorLanguage}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "var(--font-mono), monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                }}
              />
            </div>

            <div className="bg-background border-t border-border p-4 max-h-72 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Results
                </h3>
                {submission && (
                  <span className={submission.passed ? "text-emerald-500 text-sm font-bold" : "text-red-500 text-sm font-bold"}>
                    {submission.score}%
                  </span>
                )}
              </div>

              {!submission ? (
                <p className="text-sm text-muted-foreground">
                  Run your solution to execute the challenge test suite.
                </p>
              ) : (
                <div className="space-y-3">
                  {submission.passed && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="font-bold text-emerald-500 flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Challenge completed{submission.xpEarned ? ` / +${submission.xpEarned} XP` : ""}
                      </p>
                    </div>
                  )}

                  {submission.execution.results.map((result, index) => (
                    <div
                      key={`${result.name}-${index}`}
                      className={`rounded-lg border p-3 text-sm ${
                        result.passed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-red-500/30 bg-red-500/5"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{result.name}</span>
                        {result.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {!result.isHidden && (
                        <div className="grid gap-2 sm:grid-cols-3 mt-3 font-mono text-xs">
                          <div>
                            <p className="text-muted-foreground">Input</p>
                            <pre className="whitespace-pre-wrap">{result.input}</pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expected</p>
                            <pre className="whitespace-pre-wrap">{result.expectedOutput}</pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Actual</p>
                            <pre className="whitespace-pre-wrap">{result.actualOutput}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
