"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, Award, BookOpen, PlayCircle, Trophy, TrendingUp, Sparkles, Loader2, FileBadge, Download, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  user: {
    displayName: string;
    xp: number;
    streak: { current: number; longest: number };
    currentLevel: number;
    xpIntoLevel: number;
    xpNeededForLevel: number;
    progressPercentage: number;
  };
  enrolledCourses: Array<{
    _id: string;
    percentComplete: number;
    course: {
      title: string;
      slug: string;
      thumbnail?: string;
      shortDescription?: string;
    } | null;
    currentTrack?: {
      title: string;
      slug: string;
    } | null;
  }>;
  continueLearning: {
    percentComplete: number;
    course: {
      title: string;
      slug: string;
      thumbnail?: string;
    } | null;
    currentTrack?: {
      title: string;
      slug: string;
    } | null;
  } | null;
  certificates: Array<{
    _id: string;
    certificateId: string;
    issuedAt: string;
    status: string;
    course: {
      title: string;
      slug: string;
      thumbnail?: string;
    } | null;
  }>;
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"quests" | "certificates">("quests");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
           if (json.error === "Unauthorized") window.location.href = "/login";
        }
      } catch (error) {
        console.error("Failed to load dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const { user, enrolledCourses, continueLearning, certificates } = data;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Welcome Banner */}
      <div className="bg-card border-b border-border py-8 lg:py-12">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg border-4 border-background">
                {user.displayName.charAt(0)}
             </div>
             <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, {user.displayName}!</h1>
                <p className="text-muted-foreground mt-1">Ready to continue your coding quest?</p>
             </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             {/* Stats Cards */}
             <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 min-w-[160px]">
                <div className="bg-orange-500/10 p-2.5 rounded-lg text-orange-500">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Day Streak</p>
                   <p className="text-xl font-bold">{user.streak?.current || 0}</p>
                </div>
             </div>
             <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 min-w-[160px]">
                <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total XP</p>
                   <p className="text-xl font-bold">{user.xp.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Main Column */}
         <div className="lg:col-span-2 space-y-10">
            <div className="inline-flex rounded-lg bg-muted p-1">
               <button
                  type="button"
                  onClick={() => setActiveTab("quests")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                     activeTab === "quests" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
               >
                  <BookOpen className="h-4 w-4" />
                  Learning
               </button>
               <button
                  type="button"
                  onClick={() => setActiveTab("certificates")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                     activeTab === "certificates" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
               >
                  <FileBadge className="h-4 w-4" />
                  My Certificates
               </button>
            </div>

            {activeTab === "quests" ? (
            <>
            
            {/* Level Progress */}
            <div className="bg-gradient-to-r from-card to-card/50 border border-border rounded-xl p-6 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 opacity-5">
                 <Trophy className="w-64 h-64" />
               </div>
               <div className="relative z-10">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                       <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Player Level
                       </h3>
                       <p className="text-3xl font-bold mt-1 text-primary">Level {user.currentLevel}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-semibold">{user.xpIntoLevel} / {user.xpNeededForLevel} XP</p>
                       <p className="text-xs text-muted-foreground">to Level {user.currentLevel + 1}</p>
                     </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${Math.max(2, user.progressPercentage)}%` }} // Show at least a tiny bit
                     >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Continue Learning */}
            {continueLearning && continueLearning.course && (
               <section className="space-y-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                     <PlayCircle className="w-6 h-6 text-primary" /> Continue Learning
                  </h2>
                  <div className="bg-card border border-primary/20 hover:border-primary/50 transition-colors rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
                     {continueLearning.course.thumbnail ? (
                        <img 
                          src={continueLearning.course.thumbnail} 
                          alt={continueLearning.course.title}
                          className="w-full sm:w-48 h-32 object-cover rounded-lg bg-muted border border-border" 
                        />
                     ) : (
                        <div className="w-full sm:w-48 h-32 bg-muted rounded-lg flex items-center justify-center border border-border">
                          <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                     )}
                     <div className="flex-1 space-y-3 w-full">
                        <h3 className="text-xl font-bold">{continueLearning.course.title}</h3>
                        {continueLearning.currentTrack ? (
                           <p className="text-sm font-medium text-muted-foreground">
                             Up next: <span className="text-foreground">{continueLearning.currentTrack.title}</span>
                           </p>
                        ) : (
                           <p className="text-sm font-medium text-muted-foreground">Course Completed! Review your material.</p>
                        )}
                        <div className="pt-2">
                           <div className="flex justify-between text-xs font-semibold mb-1">
                             <span>Course Progress</span>
                             <span>{Math.round(continueLearning.percentComplete)}%</span>
                           </div>
                           <div className="h-2 w-full bg-muted rounded-full">
                             <div className="h-full bg-primary rounded-full" style={{ width: `${continueLearning.percentComplete}%` }}></div>
                           </div>
                        </div>
                     </div>
                     <div className="w-full sm:w-auto">
                        <Link href={`/learn/${continueLearning.course.slug}/tracks/${continueLearning.currentTrack?.slug || ''}`}>
                          <Button size="lg" className="w-full">
                             Resume Track
                          </Button>
                        </Link>
                     </div>
                  </div>
               </section>
            )}

            {/* Enrolled Courses */}
            <section className="space-y-4 pt-4">
               <h2 className="text-2xl font-bold">Your Quests</h2>
               {enrolledCourses.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                     <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                     <h3 className="text-lg font-bold">No quests accepted yet</h3>
                     <p className="text-muted-foreground text-sm my-2 max-w-sm mx-auto">
                       Head over to the Course Catalog to start your first learning journey.
                     </p>
                     <Link href="/courses">
                        <Button variant="outline" className="mt-4">Explore Catalog</Button>
                     </Link>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {enrolledCourses.map(progress => {
                        const course = progress.course;
                        if (!course) return null;
                        
                        return (
                           <Link key={progress._id} href={`/learn/${course.slug}`}>
                              <div className="bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all rounded-xl p-5 flex flex-col h-full group">
                                 <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                                 <p className="text-xs text-muted-foreground mb-4 opacity-80 line-clamp-1">{course.shortDescription}</p>
                                 
                                 <div className="mt-auto">
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                      <span>Progress</span>
                                      <span>{Math.round(progress.percentComplete)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-foreground group-hover:bg-primary transition-colors" style={{ width: `${progress.percentComplete}%` }}></div>
                                    </div>
                                 </div>
                              </div>
                           </Link>
                        );
                     })}
                  </div>
               )}
            </section>
            </>
            ) : (
            <section className="space-y-4">
               <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                     <FileBadge className="w-6 h-6 text-primary" /> My Certificates
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Download or verify certificates you have earned.</p>
               </div>

               {certificates.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                     <FileBadge className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                     <h3 className="text-lg font-bold">No certificates yet</h3>
                     <p className="text-muted-foreground text-sm my-2 max-w-sm mx-auto">
                       Complete every requirement in a course to unlock your first certificate.
                     </p>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {certificates.map((certificate) => (
                        <div key={certificate._id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
                           <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                                 <ShieldCheck className="h-6 w-6" />
                              </div>
                              <div className="min-w-0">
                                 <h3 className="font-bold text-lg line-clamp-2">{certificate.course?.title || "Course Certificate"}</h3>
                                 <p className="text-xs font-mono text-muted-foreground mt-1">{certificate.certificateId}</p>
                                 <p className="text-xs text-muted-foreground mt-2">
                                    Issued {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                                       year: "numeric",
                                       month: "short",
                                       day: "numeric",
                                    })}
                                 </p>
                              </div>
                           </div>

                           <div className="mt-auto flex gap-3">
                              {certificate.course?.slug && (
                                 <Link href={`/courses/${certificate.course.slug}/certificate`} className="flex-1">
                                    <Button className="w-full gap-2">
                                       <Download className="h-4 w-4" />
                                       Download
                                    </Button>
                                 </Link>
                              )}
                              <Link href={`/verify/${certificate.certificateId}`} className="flex-1">
                                 <Button variant="outline" className="w-full">Verify</Button>
                              </Link>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </section>
            )}
         </div>

         {/* Right Sidebar */}
         <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
               <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <Award className="w-5 h-5 text-primary" /> Badges 
                 <span className="text-xs font-normal text-muted-foreground ml-auto px-2 py-0.5 bg-muted rounded-full">Coming Soon</span>
               </h3>
               <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center mx-auto mb-3">
                     <Award className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Keep completing challenges to unlock achievements!</p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
