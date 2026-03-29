"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Medal, Crown, Loader2, Sparkles, TrendingUp, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardUser {
   _id: string;
   displayName: string;
   username: string;
   xp: number;
   level: number;
   avatarUrl?: string;
   badges: any[];
   streak: { current: number; longest: number };
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (error) {
        console.error("Failed to load leaderboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const top3 = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Hero Banner */}
      <div className="bg-[#0f172a] border-b border-border py-16 lg:py-24 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background z-0"></div>
         <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-white">
              Global Leaderboard
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Compete against other developers. Earn XP by completing tracks, solving coding challenges, and maintaining daily streaks.
            </p>
         </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
         
         {/* Top 3 Podium */}
         {top3.length > 0 && (
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 h-auto md:h-80 px-4">
               
               {/* Rank 2 (Silver) */}
               {top3[1] && (
                  <Link href={`/profile/${top3[1].username}`} className="w-full md:w-1/3 order-2 md:order-1 group">
                     <div className="bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded-t-2xl p-6 text-center shadow-lg relative h-full min-h-[180px] border border-slate-300 dark:border-slate-600 transition-transform group-hover:-translate-y-2">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                           <div className="w-20 h-20 rounded-full border-4 border-slate-300 dark:border-slate-600 bg-background flex flex-col items-center justify-center shadow-md relative overflow-hidden">
                             {top3[1].avatarUrl ? (
                                <img src={top3[1].avatarUrl} alt={top3[1].displayName} className="w-full h-full object-cover" />
                             ) : (
                                <span className="font-bold text-2xl">{top3[1].displayName.charAt(0)}</span>
                             )}
                           </div>
                           <div className="absolute -bottom-2 -right-2 bg-slate-300 dark:bg-slate-600 text-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-background">
                              2
                           </div>
                        </div>
                        <div className="mt-10">
                           <h3 className="font-bold text-lg truncate text-slate-800 dark:text-slate-100">{top3[1].displayName}</h3>
                           <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">@{top3[1].username}</p>
                           <div className="mt-4 flex flex-col gap-1 items-center">
                              <Badge variant="outline" className="bg-background/50 backdrop-blur border-slate-400 dark:border-slate-500 font-bold px-3">
                                 {top3[1].xp.toLocaleString()} XP
                              </Badge>
                              {top3[1].streak?.current > 0 && (
                                 <span className="text-xs font-semibold flex items-center gap-1 text-orange-500 mt-2">
                                    <Flame className="w-3.5 h-3.5" /> {top3[1].streak.current} Day Streak
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>
                  </Link>
               )}

               {/* Rank 1 (Gold) */}
               <Link href={`/profile/${top3[0].username}`} className="w-full md:w-1/3 order-1 md:order-2 group z-10">
                  <div className="bg-gradient-to-b from-yellow-200 to-yellow-500 dark:from-yellow-600 dark:to-yellow-900 rounded-t-2xl p-6 text-center shadow-2xl relative h-[250px] border-2 border-yellow-400 dark:border-yellow-500 transition-transform group-hover:-translate-y-2">
                     <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                        <Crown className="w-10 h-10 text-yellow-500 dark:text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 drop-shadow-md animate-bounce" />
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-400 dark:border-yellow-500 bg-background flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
                          {top3[0].avatarUrl ? (
                             <img src={top3[0].avatarUrl} alt={top3[0].displayName} className="w-full h-full object-cover" />
                          ) : (
                             <span className="font-bold text-3xl">{top3[0].displayName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 dark:bg-yellow-500 text-yellow-900 w-10 h-10 rounded-full flex items-center justify-center font-black shadow-md border-2 border-background">
                           1
                        </div>
                     </div>
                     <div className="mt-12">
                        <h3 className="font-extrabold text-xl truncate text-yellow-950 dark:text-yellow-100">{top3[0].displayName}</h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200/70 font-mono">@{top3[0].username}</p>
                        <div className="mt-5 flex flex-col gap-1 items-center">
                           <Badge className="bg-yellow-100 dark:bg-yellow-500 dark:text-yellow-950 text-yellow-900 hover:bg-yellow-200 border-yellow-300 font-bold px-4 py-1.5 text-sm">
                              {top3[0].xp.toLocaleString()} XP
                           </Badge>
                           {top3[0].streak?.current > 0 && (
                              <span className="text-xs font-bold flex items-center gap-1 text-orange-600 dark:text-orange-400 mt-2">
                                 <Flame className="w-4 h-4" /> {top3[0].streak.current} Day Streak
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               </Link>

               {/* Rank 3 (Bronze) */}
               {top3[2] && (
                  <Link href={`/profile/${top3[2].username}`} className="w-full md:w-1/3 order-3 md:order-3 group">
                     <div className="bg-gradient-to-b from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-900 rounded-t-2xl p-6 text-center shadow-md relative h-full min-h-[160px] border border-amber-300 dark:border-amber-600 transition-transform group-hover:-translate-y-2">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                           <div className="w-20 h-20 rounded-full border-4 border-amber-300 dark:border-amber-600 bg-background flex flex-col items-center justify-center shadow-md relative overflow-hidden">
                             {top3[2].avatarUrl ? (
                                <img src={top3[2].avatarUrl} alt={top3[2].displayName} className="w-full h-full object-cover" />
                             ) : (
                                <span className="font-bold text-2xl">{top3[2].displayName.charAt(0)}</span>
                             )}
                           </div>
                           <div className="absolute -bottom-2 -right-2 bg-amber-300 dark:bg-amber-600 text-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md border-2 border-background">
                              3
                           </div>
                        </div>
                        <div className="mt-10">
                           <h3 className="font-bold text-lg truncate text-amber-900 dark:text-amber-100">{top3[2].displayName}</h3>
                           <p className="text-sm text-amber-700 dark:text-amber-400 font-mono">@{top3[2].username}</p>
                           <div className="mt-4 flex flex-col gap-1 items-center">
                              <Badge variant="outline" className="bg-background/50 backdrop-blur border-amber-400 dark:border-amber-500 font-bold px-3">
                                 {top3[2].xp.toLocaleString()} XP
                              </Badge>
                              {top3[2].streak?.current > 0 && (
                                 <span className="text-xs font-semibold flex items-center gap-1 text-orange-500 mt-2">
                                    <Flame className="w-3.5 h-3.5" /> {top3[2].streak.current} Day Streak
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>
                  </Link>
               )}
            </div>
         )}

         {/* The Remaining List */}
         <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
               <div className="col-span-2 md:col-span-1 text-center">Rank</div>
               <div className="col-span-6 md:col-span-5">Developer</div>
               <div className="col-span-4 md:col-span-2 text-center">Level</div>
               <div className="col-span-12 md:col-span-4 text-right hidden md:block">Score</div>
            </div>

            <div className="divide-y divide-border">
               {remainingUsers.map((user, index) => {
                  const rank = index + 4;
                  return (
                     <Link key={user._id} href={`/profile/${user.username}`}>
                        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors group">
                           <div className="col-span-2 md:col-span-1 text-center font-mono font-bold text-muted-foreground group-hover:text-foreground">
                              #{rank}
                           </div>
                           <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                 {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                                 ) : (
                                    user.displayName.charAt(0)
                                 )}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-bold truncate group-hover:text-primary transition-colors">{user.displayName}</p>
                                 <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                              </div>
                           </div>
                           <div className="col-span-4 md:col-span-2 text-center">
                              <Badge variant="secondary" className="font-mono">Lv {user.level}</Badge>
                           </div>
                           <div className="col-span-12 md:col-span-4 flex items-center justify-end gap-4 md:mt-0 mt-2 text-right">
                              {user.streak?.current >= 3 && (
                                 <div className="flex items-center gap-1 text-orange-500 font-bold text-sm hidden sm:flex">
                                    <Flame className="w-4 h-4" /> {user.streak.current}
                                 </div>
                              )}
                              <div className="flex items-center gap-1.5 font-bold">
                                 <TrendingUp className="w-4 h-4 text-primary opacity-70" /> {user.xp.toLocaleString()} XP
                              </div>
                           </div>
                        </div>
                     </Link>
                  );
               })}
               
               {remainingUsers.length === 0 && top3.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                     <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                     <p>Leaderboard is empty. Check back later!</p>
                  </div>
               )}
            </div>
         </div>

      </div>
    </div>
  );
}
