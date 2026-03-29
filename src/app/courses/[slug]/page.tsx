"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, Clock, Target, CheckCircle2, 
  ArrowRight, ShieldAlert, Award, PlayCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Track {
  _id: string;
  title: string;
  slug: string;
  description: string;
  xpReward: number;
  passingScore: number;
  order: number;
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  difficulty: string;
  tags: string[];
  thumbnail?: string;
  estimatedHours: number;
  language?: string;
  tracks: Track[];
}

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/courses/${slug}`);
        const data = await res.json();
        if (data.success) {
          setCourse(data.data.course);
          setIsEnrolled(data.data.isEnrolled);
          setProgress(data.data.progress);
        } else {
           // Handle 404
           router.push("/courses");
        }
      } catch (error) {
        console.error("Failed to fetch course", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourse();
  }, [slug, router]);

  const handleEnroll = async () => {
    if (!course) return;
    setIsEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${slug}/enroll`, {
        method: "POST"
      });
      const data = await res.json();
      
      if (res.ok) {
        // Enrolled successfully, go to dashboard
        router.push("/dashboard");
      } else {
        if (data.error === "Unauthorized") {
           // Not logged in
           router.push(`/login?redirect=/courses/${slug}`);
        } else {
           alert(data.error);
           setIsEnrolling(false);
        }
      }
    } catch (error) {
       console.error("Enrollment failed", error);
       setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Banner */}
      <div className="bg-muted border-b border-border py-16 lg:py-24 relative overflow-hidden">
        {course.thumbnail && (
          <div className="absolute inset-0 opacity-10">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-muted to-transparent"></div>
          </div>
        )}
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
             <div className="flex flex-wrap gap-2">
               {course.language && (
                 <Badge variant="outline" className="text-xs uppercase bg-background/50 backdrop-blur-sm">
                   {course.language}
                 </Badge>
               )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              {course.title}
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl">
              {course.shortDescription}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm font-medium">
               <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>{course.estimatedHours} Hours</span>
               </div>
               <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span>{course.tracks.length} Skill Tracks</span>
               </div>
            </div>
          </div>
          
          <div className="w-full lg:w-96 bg-card border border-border rounded-xl p-6 shadow-xl relative z-20">
             {course.thumbnail ? (
                <div className="w-full h-48 rounded-lg mb-6 overflow-hidden">
                   <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
             ) : (
                <div className="w-full h-48 bg-muted rounded-lg mb-6 flex items-center justify-center">
                   <BookOpen className="w-16 h-16 text-muted-foreground/30" />
                </div>
             )}
             
             {isEnrolled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-500 font-medium justify-center pb-2">
                    <CheckCircle2 className="w-5 h-5" /> Enrolled
                  </div>
                  <Button className="w-full" size="lg" onClick={() => router.push(`/learn/${slug}`)}>
                    Continue Learning
                  </Button>
                </div>
             ) : (
               <div className="space-y-4">
                 <div className="text-center pb-2">
                   <p className="text-2xl font-bold">Free</p>
                   <p className="text-sm text-muted-foreground">Full Lifetime Access</p>
                 </div>
                 <Button className="w-full" size="lg" disabled={isEnrolling} onClick={handleEnroll}>
                   {isEnrolling ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Enroll Now"}
                 </Button>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
         {/* Main Content */}
         <div className="lg:col-span-2 space-y-12">
             <section className="space-y-4">
                <h2 className="text-3xl font-bold">About this Course</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground font-mono whitespace-pre-wrap">
                  {course.description || "No detailed description available."}
                </div>
             </section>

             <section className="space-y-6">
                <h2 className="text-3xl font-bold">Curriculum</h2>
                <div className="space-y-4">
                   {course.tracks.map((track, i) => (
                      <div key={track._id} className="bg-card border border-border rounded-lg p-5 flex gap-4 hover:border-primary/50 transition-colors">
                         <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-full h-12 w-12 shrink-0 font-bold text-lg">
                            {i + 1}
                         </div>
                         <div className="flex-1">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              {track.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {track.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-muted-foreground">
                               <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-yellow-500" /> {track.xpReward} XP</span>
                               <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Pass: {track.passingScore}%</span>
                            </div>
                         </div>
                      </div>
                   ))}
                   {course.tracks.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
                        This course doesn't have any tracks yet. Check back soon!
                      </div>
                   )}
                </div>
             </section>
         </div>

         {/* Sidebar */}
         <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
               <h3 className="text-xl font-bold">Course Tags</h3>
               <div className="flex flex-wrap gap-2">
                 {course.tags.map(tag => (
                   <span key={tag} className="text-xs font-medium px-2 py-1 bg-secondary text-secondary-foreground rounded-md">
                     {tag}
                   </span>
                 ))}
               </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
               <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                  <ShieldAlert className="w-5 h-5" /> Strict Progression
               </h3>
               <p className="text-sm text-muted-foreground">
                 LJ CodeQuest courses unlock progressively. You must successfully pass the assessment for Track 1 before you can access the content for Track 2.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
