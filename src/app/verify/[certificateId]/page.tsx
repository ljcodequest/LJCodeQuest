"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, ShieldAlert, Award, Calendar, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerificationPage({ 
   params 
}: { 
   params: Promise<{ certificateId: string }> 
}) {
  const { certificateId } = use(params);
  const [certData, setCertData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${certificateId}`);
        const json = await res.json();
        
        if (json.success) {
          setCertData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err: any) {
        setError("Network error validating certificate.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVerification();
  }, [certificateId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12 md:py-24 px-4">
      <div className="max-w-2xl mx-auto">
         
         <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 mb-8 group cursor-pointer">
               <div className="w-10 h-10 bg-primary text-primary-foreground font-black flex items-center justify-center rounded-xl shadow-lg ring-2 ring-primary/20 group-hover:scale-105 transition-transform">
                  LJ
               </div>
               <span className="font-extrabold text-xl tracking-tight text-foreground">
                  LJ CodeQuest
               </span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Certificate Verification</h1>
            <p className="text-muted-foreground">Global Registry of Digital Competency</p>
         </div>

         {error || !certData ? (
             <div className="bg-card border-2 border-red-500/20 rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                   <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h2>
                <p className="text-muted-foreground mb-6 font-mono bg-muted p-2 rounded">ID: {certificateId}</p>
                <p className="mb-8">{error || "This certificate ID does not exist in our global registry."}</p>
                
                <Link href="/">
                   <Button variant="outline" className="w-full">Return Home</Button>
                </Link>
             </div>
         ) : (
             <div className="bg-card border border-border shadow-xl rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-400 to-emerald-600"></div>
                
                <div className="p-8 md:p-12 text-center border-b border-border relative">
                   <div className="absolute top-12 right-12 opacity-5 pointer-events-none">
                      <Award className="w-48 h-48" />
                   </div>
                   
                   <div className="w-24 h-24 bg-green-500/10 border-4 border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative z-10">
                      <ShieldCheck className="w-12 h-12 text-green-500" />
                   </div>
                   
                   <h2 className="text-3xl font-extrabold text-foreground mb-2 relative z-10">Valid Certificate</h2>
                   <p className="text-green-600 dark:text-green-500 font-bold tracking-wide relative z-10">Offically Issued by LJ CodeQuest</p>
                </div>

                <div className="p-8 md:p-12 space-y-8 bg-muted/10">
                   <div>
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Recipient</p>
                      <h3 className="text-2xl font-bold text-foreground">{certData.user.displayName}</h3>
                      <Link href={`/profile/${certData.user.username}`} className="text-primary hover:underline flex items-center gap-1 mt-1 font-mono text-sm">
                         <LinkIcon className="w-3 h-3" /> @{certData.user.username}
                      </Link>
                   </div>
                   
                   <div className="grid md:grid-cols-2 gap-8">
                      <div>
                         <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Course Completed</p>
                         <h4 className="text-lg font-bold text-foreground">{certData.course.title}</h4>
                      </div>
                      <div>
                         <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Issue Date</p>
                         <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(certData.issuedAt).toLocaleDateString(undefined, {
                               year: 'numeric',
                               month: 'long',
                               day: 'numeric'
                            })}
                         </h4>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-border mt-8">
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Certificate ID</p>
                      <div className="bg-background border border-border p-3 rounded-lg font-mono text-center tracking-widest text-lg font-bold shadow-sm">
                         {certData.certificateId}
                      </div>
                   </div>
                </div>
             </div>
         )}
         
      </div>
    </div>
  );
}
