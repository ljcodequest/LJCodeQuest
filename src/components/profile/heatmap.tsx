"use client";

import { useEffect, useState } from "react";
import { Loader2, Flame } from "lucide-react";

interface HeatmapData {
   date: string; // YYYY-MM-DD
   count: number;
}

export function ContributionHeatmap({ username }: { username: string }) {
   const [data, setData] = useState<HeatmapData[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
     const fetchActivity = async () => {
        try {
           const res = await fetch(`/api/users/${username}/activity`);
           const json = await res.json();
           if (json.success) {
              setData(json.data);
           }
        } catch (e) {
           console.error("Failed to fetch activity logs", e);
        } finally {
           setIsLoading(false);
        }
     };
     fetchActivity();
   }, [username]);

   // Generate last 365 days
   const today = new Date();
   const days = [];
   const activityMap = new Map(data.map(d => [d.date, d.count]));
   
   // Create exactly 364 days ago to today (52 weeks * 7 days = 364 days layout)
   for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
         date: dateStr,
         count: activityMap.get(dateStr) || 0
      });
   }

   const getColor = (count: number) => {
      if (count === 0) return "bg-muted"; // Empty day
      if (count < 3) return "bg-green-300 dark:bg-green-900"; // Light intensity
      if (count < 6) return "bg-green-400 dark:bg-green-700"; // Medium intensity
      if (count < 10) return "bg-green-500 dark:bg-green-500"; // High intensity
      return "bg-green-600 dark:bg-green-400"; // Max intensity
   };

   if (isLoading) {
      return (
         <div className="w-full h-48 flex items-center justify-center bg-card border border-border rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
         </div>
      );
   }

   // Group by weeks (cols)
   const weeks = [];
   for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
   }

   const totalContributions = data.reduce((acc, current) => acc + current.count, 0);

   return (
      <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
         <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
               <Flame className="w-5 h-5 text-orange-500" /> Activity Heatmap
            </h3>
            <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
               {totalContributions} Contributions in the last year
            </span>
         </div>
         
         <div className="overflow-x-auto pb-4 custom-scrollbar">
            <div className="inline-flex gap-1">
               {weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1 hidden sm:flex">
                     {week.map((day, dayIdx) => (
                        <div 
                           key={day.date}
                           title={`${day.count} contributions on ${day.date}`}
                           className={`w-[11px] h-[11px] sm:w-[14px] sm:h-[14px] rounded-[2px] cursor-pointer hover:ring-2 hover:ring-foreground transition-all ${getColor(day.count)}`}
                        ></div>
                     ))}
                  </div>
               ))}
               
               {/* Mobile view compresses weeks into a simpler grid to avoid overflow madness */}
               <div className="flex sm:hidden flex-wrap gap-1 max-h-[150px] overflow-hidden">
                  {days.slice(days.length - 84).map(day => (
                     <div 
                        key={`m-${day.date}`}
                        className={`w-3 h-3 rounded-[2px] ${getColor(day.count)}`}
                     ></div>
                  ))}
               </div>
            </div>
         </div>
         
         <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground mr-2 font-mono">
            <span>Less</span>
            <div className="w-3 h-3 rounded-[2px] bg-muted"></div>
            <div className="w-3 h-3 rounded-[2px] bg-green-300 dark:bg-green-900"></div>
            <div className="w-3 h-3 rounded-[2px] bg-green-500 dark:bg-green-500"></div>
            <div className="w-3 h-3 rounded-[2px] bg-green-600 dark:bg-green-400"></div>
            <span>More</span>
         </div>
      </div>
   );
}
