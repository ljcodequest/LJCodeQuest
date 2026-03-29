"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
   Trophy, Loader2, MapPin, Calendar, Link as LinkIcon, 
   Flame, Medal, Award, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContributionHeatmap } from "@/components/profile/heatmap";

export default function UserProfilePage({ 
   params 
}: { 
   params: Promise<{ username: string }> 
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${username}`);
        const json = await res.json();
        
        if (json.success) {
          setProfile(json.data);
        } else {
          setError(json.error);
        }
      } catch (err: any) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
         <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-muted-foreground opacity-50" />
         </div>
         <h1 className="text-2xl font-bold">{error || "Profile Not Found"}</h1>
         <p className="text-muted-foreground">This user either doesn't exist or has set their profile to private.</p>
         <Link href="/leaderboard">
            <Button className="mt-4">Back to Leaderboard</Button>
         </Link>
      </div>
    );
  }

  const { user, completedCourses, certificates } = profile;

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Profile Header */}
      <div className="bg-[#0f172a] border-b border-border pt-20 pb-12 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-0 opacity-50"></div>
         
         <div className="container mx-auto px-4 lg:px-8 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative">
               {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
               ) : (
                  <span className="text-5xl font-black text-slate-500">{user.displayName.charAt(0)}</span>
               )}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-3 pb-2">
               <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white">{user.displayName}</h1>
                  <Badge variant="outline" className="border-primary/50 text-white bg-primary/20 backdrop-blur w-fit mx-auto md:mx-0 font-mono text-sm py-1">
                     Lv {user.level} Developer
                  </Badge>
               </div>
               
               <p className="text-slate-400 font-mono">@{user.username}</p>
               
               {user.bio && (
                  <p className="text-slate-300 max-w-2xl mt-2">{user.bio}</p>
               )}
               
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 mt-4">
                  <div className="flex items-center gap-1.5">
                     <Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  {user.social?.github && (
                     <a href={user.social.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <LinkIcon className="w-4 h-4" /> GitHub
                     </a>
                  )}
                  {user.social?.linkedin && (
                     <a href={user.social.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <LinkIcon className="w-4 h-4" /> LinkedIn
                     </a>
                  )}
                  {user.social?.website && (
                     <a href={user.social.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                        <LinkIcon className="w-4 h-4" /> Website
                     </a>
                  )}
               </div>
            </div>
            
            <div className="bg-background/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex items-center gap-8 shadow-xl">
               <div className="text-center">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total XP</p>
                  <p className="text-3xl font-black text-white">{user.xp.toLocaleString()}</p>
               </div>
               {user.streak?.current > 0 && (
                  <div className="text-center pl-8 border-l border-white/10">
                     <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Streak</p>
                     <p className="text-3xl font-black text-orange-500 flex items-center justify-center gap-2">
                        <Flame className="w-6 h-6 fill-orange-500" /> {user.streak.current}
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Left Col: Badges & Stats */}
         <div className="space-y-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-primary" /> Earned Badges
               </h3>
               
               {user.badges?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                     {user.badges.map((badge: any) => (
                        <div key={badge.id} className="bg-muted p-3 rounded-lg flex items-center gap-3 w-full border border-border/50">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Award className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="font-bold text-sm">{badge.name}</p>
                              <p className="text-xs text-muted-foreground">{badge.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <p className="text-sm text-muted-foreground opacity-70 italic">No badges earned yet.</p>
               )}
            </div>

            <ContributionHeatmap username={user.username} />
         </div>

         {/* Right Col: Completed Courses & Certificates */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5 text-green-500" /> Completed Courses
                  </h3>
               </div>
               
               <div className="p-6">
                  {completedCourses?.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {completedCourses.map((course: any) => {
                           // Find if a certificate exists for this course
                           const cert = certificates?.find((c: any) => c.courseId === course.courseId);
                           
                           return (
                              <div key={course.courseId} className="border border-border rounded-lg overflow-hidden group">
                                 <div className="h-32 bg-muted relative">
                                    {course.thumbnail ? (
                                       <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    ) : (
                                       <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-purple-500/20" />
                                    )}
                                 </div>
                                 <div className="p-4 bg-card">
                                    <h4 className="font-bold mb-1 truncate">{course.title}</h4>
                                    <p className="text-xs text-muted-foreground mb-4">Completed: {new Date(course.completedAt).toLocaleDateString()}</p>
                                    
                                    {cert ? (
                                       <Link href={`/verify/${cert.certificateId}`}>
                                          <Button variant="outline" size="sm" className="w-full gap-2 border-green-500/30 text-green-600 dark:text-green-500 hover:bg-green-500/10 hover:text-green-600">
                                             <Award className="w-4 h-4" /> View Certificate
                                          </Button>
                                       </Link>
                                    ) : (
                                       <Link href={`/courses/${course.slug}`}>
                                          <Button variant="secondary" size="sm" className="w-full">
                                             View Course
                                          </Button>
                                       </Link>
                                    )}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  ) : (
                     <div className="text-center py-12 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>This user hasn't completed any courses yet.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
         
      </div>
    </div>
  );
}
