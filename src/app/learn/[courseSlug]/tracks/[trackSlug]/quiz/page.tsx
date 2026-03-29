"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MCQComponent from "@/components/assessment/mcq-question";
import DescriptiveComponent from "@/components/assessment/descriptive-question";
import CodingComponent from "@/components/assessment/coding-question";

export default function QuizRouterPage({ 
   params 
}: { 
   params: Promise<{ courseSlug: string, trackSlug: string }> 
}) {
  const { courseSlug, trackSlug } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionStats, setQuestionStats] = useState({ number: 1, total: 1 });
  const [trackId, setTrackId] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const fetchNextQuestion = async () => {
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
            setTrackId(json.data.question.trackId); 
            // We need courseId. A hack: submission can take courseSlug instead of courseId, 
            // but our submission API expects courseId.
            // Let's modify the /current API to return courseId if we didn't. 
            // Wait, we can fetch courseId from Course API or let the submission API handle it. 
            // Actually, we already modified the API to expect courseId. 
            // We should ensure `courseId` is returned in the /current response or embedded in the question.
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
  };

  useEffect(() => {
    // Also fetch courseId to pass to submission components
    const init = async () => {
      try {
        const cRes = await fetch(`/api/courses/${courseSlug}`);
        const cJson = await cRes.json();
        if (cJson.success && cJson.data.course) {
           setCourseId(cJson.data.course._id);
        }
      } catch (e) {
        console.error(e);
      }
      await fetchNextQuestion();
    };
    init();
  }, [courseSlug, trackSlug, router]);

  const handleNextQuestion = (xpEarned: number, submissionData?: any) => {
     setTotalXpEarned(prev => prev + xpEarned);
     
     if (submissionData?.progressUpdate?.trackCompleted) {
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
            <p className="text-muted-foreground">This track doesn't have an assessment yet.</p>
            <Button onClick={() => router.push(`/learn/${courseSlug}/tracks/${trackSlug}`)}>
               Go Back
            </Button>
         </div>
      );
  }

  if (isFinished) {
      return (
         <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
            </div>
         </div>
      );
  }

  const progressPercent = ((questionStats.number - 1) / questionStats.total) * 100;

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
         </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 md:py-12">
         {currentQuestion.type === "mcq" || currentQuestion.type === "multi-select" ? (
            <MCQComponent 
               key={currentQuestion._id}
               questionId={currentQuestion._id}
               trackId={trackId}
               courseId={courseId}
               title={currentQuestion.title}
               description={currentQuestion.description}
               type={currentQuestion.type}
               options={currentQuestion.options}
               onSuccess={handleNextQuestion}
            />
         ) : currentQuestion.type === "descriptive" ? (
            <DescriptiveComponent
               key={currentQuestion._id}
               questionId={currentQuestion._id}
               trackId={trackId}
               courseId={courseId}
               title={currentQuestion.title}
               description={currentQuestion.description}
               starterCode={currentQuestion.starterCode}
               options={currentQuestion.options}
               onSuccess={handleNextQuestion}
            />
         ) : currentQuestion.type === "coding" ? (
            <CodingComponent
               key={currentQuestion._id}
               questionId={currentQuestion._id}
               trackId={trackId}
               courseId={courseId}
               title={currentQuestion.title}
               description={currentQuestion.description}
               language={currentQuestion.language || "javascript"}
               testCases={currentQuestion.testCases || []}
               onSuccess={handleNextQuestion}
            />
         ) : (
            <div>Unknown Question Type</div>
         )}
      </div>
    </div>
  );
}
