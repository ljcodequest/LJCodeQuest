"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, CheckCircle2, PlayCircle, BookOpen, ChevronRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Track {
  _id: string;
  title: string;
  slug: string;
  order: number;
  status: "locked" | "in-progress" | "completed";
  totalQuestions: number;
  completedQuestions: number;
}

interface Level {
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "locked" | "in-progress" | "completed";
  tracks: Track[];
}

export default function CourseLearnPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLearnData = async () => {
      try {
        const res = await fetch(`/api/learn/${courseSlug}/tracks`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to load tracks", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLearnData();
  }, [courseSlug, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { course, levels, percentComplete } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border py-8">
        <div className="container mx-auto px-4 md:px-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
               ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">{Math.round(percentComplete)}% Complete</span>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
               <div className="h-full bg-primary" style={{ width: `${percentComplete}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12 space-y-12">
        {levels.map((level: Level) => {
          if (level.tracks.length === 0) return null;
          
          return (
            <div key={level.difficulty} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <h2 className="text-2xl font-bold capitalize flex items-center gap-2">
                  {level.difficulty}
                </h2>
                {level.status === "completed" && <Badge className="bg-green-500 text-white">Completed</Badge>}
                {level.status === "locked" && <Badge variant="secondary" className="flex items-center gap-1"><LockKeyhole className="w-3 h-3"/> Locked</Badge>}
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {level.tracks.map((track) => (
                  <div 
                    key={track._id} 
                    className={`border rounded-xl p-6 relative transition-all ${
                      track.status === "locked" ? "bg-muted/30 border-border opacity-70" :
                      track.status === "completed" ? "bg-card border-green-500/50" :
                      "bg-card border-primary/50 shadow-sm shadow-primary/10"
                    }`}
                  >
                    {track.status === "locked" && (
                      <div className="absolute top-4 right-4">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    {track.status === "completed" && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                    )}

                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Track {track.order}
                        </span>
                        <h3 className="text-xl font-bold mt-1 line-clamp-1">{track.title}</h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" /> Theory
                        </span>
                        <span className="flex items-center gap-1">
                          <PlayCircle className="w-4 h-4" /> {track.totalQuestions} Questions
                        </span>
                      </div>

                      <div className="mt-auto">
                        {track.status === "locked" ? (
                          <Button disabled variant="outline" className="w-full">
                            Locked
                          </Button>
                        ) : (
                          <Link href={`/learn/${course.slug}/tracks/${track.slug}`}>
                            <Button variant={track.status === "completed" ? "outline" : "default"} className="w-full group">
                              {track.status === "completed" ? "Review Track" : "Continue"}
                              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      {/* Sub-progress bar within track */}
                      {track.status !== "locked" && track.totalQuestions > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                           <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                             <div 
                               className={`h-full ${track.status === "completed" ? "bg-green-500" : "bg-primary"}`} 
                               style={{ width: `${(track.completedQuestions / track.totalQuestions) * 100}%` }}
                             ></div>
                           </div>
                           <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">
                             {track.completedQuestions} / {track.totalQuestions}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
