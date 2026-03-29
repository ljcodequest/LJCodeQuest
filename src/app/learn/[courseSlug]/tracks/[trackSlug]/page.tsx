"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ArrowRight, Play, Lock, CheckCircle2, Bookmark, BookOpen, Loader2, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";

// React Markdown Imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export default function TrackTheoryPage({ params }: { params: Promise<{ courseSlug: string, trackSlug: string }> }) {
  const { courseSlug, trackSlug } = use(params);
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`/api/learn/${courseSlug}/tracks/${trackSlug}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
           if (json.error === "Unauthorized") {
              router.push("/login");
           } else if (json.error === "Locked") {
              setErrorMsg(json.message);
           } else {
              router.push("/dashboard");
           }
        }
      } catch (error) {
        console.error("Failed to load track", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, [courseSlug, trackSlug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
     return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
           <div className="bg-card border border-border p-8 rounded-xl max-w-md text-center">
              <div className="w-16 h-16 bg-muted border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                 <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Track Locked</h1>
              <p className="text-muted-foreground mb-6">{errorMsg}</p>
              <Link href="/dashboard">
                 <Button>Return to Dashboard</Button>
              </Link>
           </div>
        </div>
     );
  }

  if (!data) return null;

  const { track, course, isCompleted, nextTrackSlug, percentComplete } = data;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
         <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
               <Link href="/dashboard">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-border hidden sm:flex">
                     <ArrowLeft className="w-4 h-4" />
                  </Button>
               </Link>
               <div className="max-w-[150px] sm:max-w-xs md:max-w-sm lg:max-w-xl truncate">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{course.title}</span>
                  <div className="flex items-center gap-2">
                     <h1 className="font-bold truncate">{track.title}</h1>
                     {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-6">
               <div className="hidden md:flex items-center gap-2">
                  <div className="font-mono text-xs font-bold text-muted-foreground">{Math.round(percentComplete)}% Complete</div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                     <div className="h-full bg-primary" style={{ width: `${percentComplete}%` }}></div>
                  </div>
               </div>
               
               <Link href={`/learn/${courseSlug}/tracks/${trackSlug}/quiz`}>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-bold border-none shadow-md shadow-primary/20">
                     <Play className="w-4 h-4" /> {isCompleted ? "Review Assessment" : (data.completedQuestionsCount > 0 ? "Continue Assessment" : "Start Assessment")}
                  </Button>
               </Link>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 flex flex-col md:flex-row gap-10">
         
         <div className="flex-[3] max-w-4xl mx-auto">
            <div className="mb-10 pb-10 border-b border-border">
               <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-4">
                  <BookOpen className="w-4 h-4" /> Theory Lesson
               </div>
               <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                  {track.title}
               </h2>
               <p className="text-lg md:text-xl text-muted-foreground">{track.description}</p>
            </div>

            {/* Markdown Theory Content Render */}
            <article className="prose prose-neutral dark:prose-invert max-w-none 
               prose-headings:font-bold prose-headings:tracking-tight
               prose-a:text-primary prose-a:no-underline hover:prose-a:underline
               prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
               prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-border
               prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm"
            >
               <ReactMarkdown 
                 remarkPlugins={[remarkGfm]} 
                 rehypePlugins={[rehypeRaw]}
               >
                 {track.theory || "No theory content provided for this track."}
               </ReactMarkdown>
            </article>

            <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="font-bold flex items-center gap-2 text-lg">
                     {isCompleted ? "You've mastered this track!" : "Ready for the challenge?"}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                     {isCompleted ? "You can review the assessment or proceed to the next track." : "Pass the assessment questions one-by-one to unlock the next track."}
                  </p>
               </div>
               <Link href={`/learn/${courseSlug}/tracks/${trackSlug}/quiz`}>
                  <Button size="lg" className="gap-2 w-full sm:w-auto shadow-md">
                     {isCompleted ? "Review Assessment" : (data.completedQuestionsCount > 0 ? "Continue Assessment" : "Take Assessment")} <ArrowRight className="w-4 h-4" />
                  </Button>
               </Link>
            </div>
         </div>

         {/* Track Info Sidebar */}
         <div className="flex-1 w-full md:max-w-xs space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
               <h3 className="font-bold border-b border-border pb-2 mb-4">Track Objectives</h3>
               
               <ul className="space-y-3 mb-6">
                  <li className="flex gap-3 text-sm">
                     <div className="bg-primary/10 p-1.5 rounded-md h-fit">
                        <Bookmark className="w-3.5 h-3.5 text-primary" />
                     </div>
                     <div>
                        <p className="font-medium">Passing Criteria</p>
                        <p className="text-muted-foreground mt-0.5">Score {track.passingScore}% or higher</p>
                     </div>
                  </li>
                  <li className="flex gap-3 text-sm">
                     <div className="bg-yellow-500/10 p-1.5 rounded-md h-fit">
                        <Award className="w-3.5 h-3.5 text-yellow-500" />
                     </div>
                     <div>
                        <p className="font-medium">XP Reward</p>
                        <p className="text-muted-foreground mt-0.5">{track.xpReward} XP upon completion</p>
                     </div>
                  </li>
               </ul>

               {isCompleted ? (
                   <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                     <div className="flex items-center justify-center gap-2 text-green-500 font-bold mb-1">
                        <CheckCircle2 className="w-4 h-4" /> Passed
                     </div>
                     <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">You have mastered this topic.</p>
                   </div>
               ) : (
                   <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                     <div className="flex items-center justify-center gap-2 font-bold mb-1 text-primary text-sm">
                        <Play className="w-3.5 h-3.5" /> Assessment Active
                     </div>
                     <p className="text-xs text-primary/80 font-medium leading-snug">
                        {data.completedQuestionsCount > 0 
                           ? `You have completed ${data.completedQuestionsCount} questions so far.`
                           : `Read the theory before attempting the questions.`}
                     </p>
                   </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
