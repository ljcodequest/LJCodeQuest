"use client";

import { useCallback, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trophy, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MCQComponent from "@/components/assessment/mcq-question";
import DescriptiveComponent from "@/components/assessment/descriptive-question";
import CodingComponent from "@/components/assessment/coding-question";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type QuestionOption = {
  id: string;
  text: string;
};

type CurrentQuestion = {
  _id: string;
  trackId?: string;
  type: "mcq" | "multi-select" | "descriptive" | "coding";
  title: string;
  description: string;
  options?: QuestionOption[];
  starterCode?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
};

type ActiveAttempt = {
  expiresAt: string;
  timeRemainingMs?: number;
};

type SubmissionProgressUpdate = {
  trackCompleted?: boolean;
  certificateAwarded?: { certificateId: string; issuedAt: string };
};

export default function QuizRouterPage({ 
   params 
}: { 
   params: Promise<{ courseSlug: string, trackSlug: string }> 
}) {
  const { courseSlug, trackSlug } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionStats, setQuestionStats] = useState({ number: 1, total: 1 });
  const [trackId, setTrackId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [attempt, setAttempt] = useState<ActiveAttempt | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [awardedCertificate, setAwardedCertificate] = useState<{ certificateId: string; issuedAt: string } | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      // Assuming courseId might be needed, but we can pass courseSlug to API or fetch from track
      // Wait, we need courseId and trackId for submissions. The /current API should return them or 
      // we get them from the components.
      const res = await fetch(`/api/learn/${courseSlug}/tracks/${trackSlug}/questions/current`);
      const json = await res.json();
      
      if (json.success) {
         if (json.data.allCompleted) {
            setIsFinished(true);
         } else if (json.data.question) {
            setCurrentQuestion(json.data.question);
            setQuestionStats({ number: json.data.questionNumber, total: json.data.totalQuestions });
            setTrackId(json.data.trackId || json.data.question.trackId);
            setCourseId(json.data.courseId || "");
            setAttempt(json.data.attempt);
            setTimeRemainingMs(json.data.attempt?.timeRemainingMs || 0);
         } else {
            setIsFinished(true);
         }
      } else {
         if (json.error === "LOCKED") {
            alert("This track is locked or you are not authorized.");
            router.push(`/learn/${courseSlug}`);
         } else {
            router.push("/dashboard");
         }
      }
    } catch (error) {
      console.error("Failed to load question", error);
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, router, trackSlug]);

  useEffect(() => {
    void fetchNextQuestion();
  }, [fetchNextQuestion]);

  useEffect(() => {
    if (!attempt?.expiresAt) return;

    const interval = window.setInterval(() => {
      const remaining = Math.max(0, new Date(attempt.expiresAt).getTime() - Date.now());
      setTimeRemainingMs(remaining);

      if (remaining === 0) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [attempt?.expiresAt]);

  const handleNextQuestion = (xpEarned: number, submissionData?: unknown) => {
     const progressUpdate = (submissionData as { progressUpdate?: SubmissionProgressUpdate } | undefined)?.progressUpdate;
     setTotalXpEarned(prev => prev + xpEarned);
     if (progressUpdate?.certificateAwarded) {
        setAwardedCertificate(progressUpdate.certificateAwarded);
        setIsFinished(true);
        return;
     }
     
     if (progressUpdate?.trackCompleted) {
        setIsFinished(true);
     } else {
        fetchNextQuestion();
     }
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentQuestion && !isFinished) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
            <Trophy className="w-16 h-16 text-muted-foreground" />
            <h1 className="text-2xl font-bold">No questions available</h1>
            <p className="text-muted-foreground">This track does not have an assessment yet.</p>
            <Button onClick={() => router.push(`/learn/${courseSlug}/tracks/${trackSlug}`)}>
               Go Back
            </Button>
         </div>
      );
  }

  if (isFinished) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Dialog open={!!awardedCertificate} onOpenChange={(open) => !open && setAwardedCertificate(null)}>
               <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                     <DialogTitle className="text-2xl font-bold">Certificate Unlocked</DialogTitle>
                     <DialogDescription>
                        Congratulations! Your course certificate is ready and has been saved to your dashboard.
                     </DialogDescription>
                  </DialogHeader>
                  <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
                     <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400">Certificate ID</p>
                     <p className="mt-1 font-mono text-lg font-bold">{awardedCertificate?.certificateId}</p>
                  </div>
                  <DialogFooter>
                     <Link href={`/courses/${courseSlug}/certificate`} className="w-full sm:w-auto">
                        <Button className="w-full">Download Certificate</Button>
                     </Link>
                  </DialogFooter>
               </DialogContent>
            </Dialog>
            <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl text-center space-y-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-purple-500"></div>
               
               <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <Trophy className="w-10 h-10 text-green-500 pb-1" />
               </div>
               
               <div>
                  <h1 className="text-3xl font-bold mb-2">Assessment Complete!</h1>
                  <p className="text-muted-foreground">You have finished all questions in this track.</p>
               </div>
               
               <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-1">Total XP Earned</p>
                  <p className="text-4xl font-black text-foreground">+{totalXpEarned}</p>
               </div>
               
               <div className="flex gap-4 pt-4">
                  <Link href={`/learn/${courseSlug}/tracks/${trackSlug}`} className="flex-1">
                     <Button variant="outline" className="w-full">Review Theory</Button>
                  </Link>
                  <Link href={`/learn/${courseSlug}`} className="flex-1">
                     <Button className="w-full gap-2">Course Home <ArrowRight className="w-4 h-4" /></Button>
                  </Link>
               </div>
               {awardedCertificate && (
                  <Link href={`/courses/${courseSlug}/certificate`}>
                     <Button className="w-full">Download Certificate</Button>
                  </Link>
               )}
            </div>
         </div>
      );
  }

  const question = currentQuestion;
  if (!question) return null;

  const progressPercent = ((questionStats.number - 1) / questionStats.total) * 100;
  const minutes = Math.floor(timeRemainingMs / 60000);
  const seconds = Math.floor((timeRemainingMs % 60000) / 1000);
  const timerLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation & Progress */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
         <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-6">
            <Link href={`/learn/${courseSlug}/tracks/${trackSlug}`}>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border shrink-0">
                  <ArrowLeft className="w-4 h-4" />
               </Button>
            </Link>

            <div className="flex-1 flex items-center gap-4 max-w-2xl mx-auto">
               <span className="text-xs font-bold text-muted-foreground whitespace-nowrap hidden sm:block">
                  Question {questionStats.number} of {questionStats.total}
               </span>
               <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <span className="text-xs font-bold text-primary whitespace-nowrap hidden sm:block">
                  {Math.round(progressPercent)}%
               </span>
            </div>

            <div className="w-8 shrink-0"></div>
            <div className={`hidden sm:flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-bold ${
               timeRemainingMs <= 60000 ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-border bg-background"
            }`}>
               <Clock className="h-4 w-4" />
               {timerLabel}
            </div>
         </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 md:py-12">
         {question.type === "mcq" || question.type === "multi-select" ? (
            <MCQComponent 
               key={question._id}
               questionId={question._id}
               trackId={trackId}
               courseId={courseId}
               title={question.title}
               description={question.description}
               type={question.type}
               options={question.options || []}
               onSuccess={handleNextQuestion}
               timeRemainingMs={timeRemainingMs}
            />
         ) : question.type === "descriptive" ? (
            <DescriptiveComponent
               key={question._id}
               questionId={question._id}
               trackId={trackId}
               courseId={courseId}
               title={question.title}
               description={question.description}
               starterCode={question.starterCode}
               options={question.options || []}
               onSuccess={handleNextQuestion}
               timeRemainingMs={timeRemainingMs}
            />
         ) : question.type === "coding" ? (
            <CodingComponent
               key={question._id}
               questionId={question._id}
               trackId={trackId}
               courseId={courseId}
               title={question.title}
               description={question.description}
               language={question.language || "javascript"}
               testCases={question.testCases || []}
               onSuccess={handleNextQuestion}
               timeRemainingMs={timeRemainingMs}
            />
         ) : (
            <div>Unknown Question Type</div>
         )}
      </div>
    </div>
  );
}
