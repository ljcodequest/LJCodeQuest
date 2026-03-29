"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Printer, ArrowLeft, Trophy, Share2, ShieldCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CertificatePrintPage({ 
   params 
}: { 
   params: Promise<{ slug: string }> 
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const claimAndFetch = async () => {
      try {
        // 1. Fetch Course details to get ID
        const courseRes = await fetch(`/api/courses/${slug}`);
        const courseJson = await courseRes.json();
        
        if (!courseJson.success) {
           setError("Course not found.");
           setIsLoading(false);
           return;
        }

        const courseId = courseJson.data.course._id;

        // 2. Claim Certificate! (Throws 403 if they cheat and try to access directly without 100% completion)
        const claimRes = await fetch(`/api/certificates/claim`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ courseId })
        });
        const claimJson = await claimRes.json();

        if (!claimJson.success) {
           setError("You must pass all assessments in this course to generate a certificate.");
           setIsLoading(false);
           return;
        }

        // 3. Render via Public Verify API
        const verifyRes = await fetch(`/api/verify/${claimJson.data.certificateId}`);
        const verifyJson = await verifyRes.json();

        if (verifyJson.success) {
           setData(verifyJson.data);
        } else {
           setError("Critical system error retrieving certified records.");
        }
      } catch (err: any) {
        setError("Network configuration error.");
      } finally {
        setIsLoading(false);
      }
    };
    
    claimAndFetch();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
         <Loader2 className="w-10 h-10 animate-spin text-primary" />
         <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground animate-pulse">Minting Cryptographic Record...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
           <Trophy className="w-16 h-16 text-muted-foreground opacity-50" />
           <h1 className="text-2xl font-bold">Access Denied</h1>
           <p className="text-muted-foreground max-w-md text-center">{error}</p>
           <Button onClick={() => router.push(`/courses/${slug}`)} className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Course
           </Button>
        </div>
    );
  }

  const handlePrint = () => {
     window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 md:py-12 py-4">
      
      {/* Non-printable Control Header */}
      <div className="max-w-[1000px] mx-auto mb-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
         <Button variant="outline" onClick={() => router.push(`/courses/${slug}`)} className="gap-2 w-full sm:w-auto bg-background">
            <ArrowLeft className="w-4 h-4" /> Go Back
         </Button>
         
         <div className="flex gap-3 w-full sm:w-auto">
            <Link href={`/verify/${data.certificateId}`} target="_blank" className="flex-1 sm:flex-auto">
               <Button variant="secondary" className="gap-2 w-full bg-background border border-border">
                  <Share2 className="w-4 h-4" /> Public Link
               </Button>
            </Link>
            <Button onClick={handlePrint} className="gap-2 flex-1 sm:flex-auto bg-primary hover:bg-primary/90 text-primary-foreground">
               <Printer className="w-4 h-4" /> Download PDF
            </Button>
         </div>
      </div>

      {/* The Printable Certificate Container */}
      {/* We use specific dimensions approximating US Letter / A4 Landscape */}
      <div className="max-w-[1050px] mx-auto px-4 print:px-0">
          <div className="relative aspect-[1.414/1] bg-white text-slate-900 border-[10px] md:border-[20px] border-slate-900 p-8 md:p-16 shadow-2xl print:shadow-none print:border-[15px] overflow-hidden" id="certificate-print-area">
              
              {/* Ornate Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-bl-full opacity-50 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100 rounded-tr-full opacity-50 pointer-events-none"></div>
              
              {/* Corner Accents */}
              <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-slate-300"></div>
              <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-slate-300"></div>
              <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-slate-300"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-slate-300"></div>

              <div className="relative z-10 h-full flex flex-col items-center justify-between text-center border-4 border-double border-slate-200 p-8 md:p-12">
                 
                 {/* Header Strip */}
                 <div className="space-y-4">
                     <h1 className="text-3xl md:text-5xl font-black tracking-[0.2em] text-slate-900 uppercase">
                        Certificate <span className="text-slate-400">of</span> Completion
                     </h1>
                     <div className="h-1 w-32 bg-slate-900 mx-auto mt-6"></div>
                 </div>

                 {/* Body Declarations */}
                 <div className="space-y-8 w-full">
                     <p className="text-lg md:text-xl text-slate-500 italic tracking-widest uppercase">This is to certify that</p>
                     
                     <h2 className="text-4xl md:text-6xl font-bold text-slate-900 border-b border-dashed border-slate-300 pb-4 inline-block px-12">
                        {data.user.displayName}
                     </h2>
                     
                     <div className="space-y-4 max-w-2xl mx-auto">
                        <p className="text-base md:text-lg text-slate-600">
                           has successfully completed all requirements, technical assessments, and tracks for the comprehensive curriculum:
                        </p>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800">
                           {data.course.title}
                        </h3>
                     </div>
                 </div>

                 {/* Footer Info & Verification */}
                 <div className="w-full flex items-end justify-between mt-12 pt-8 border-t-2 border-slate-100">
                    
                    <div className="text-left w-1/3">
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Date Issued</p>
                       <p className="text-sm md:text-base font-bold text-slate-800">
                          {new Date(data.issuedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                          })}
                       </p>
                    </div>
                    
                    <div className="flex flex-col items-center w-1/3 space-y-2 relative">
                        {/* Golden Seal Aesthetic */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-8 border-yellow-500 bg-yellow-400 flex items-center justify-center -mt-20 sm:-mt-24 shadow-xl z-20">
                           <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-900" />
                        </div>
                        <p className="font-black text-xl tracking-tighter text-slate-900">LJ CodeQuest</p>
                    </div>

                    <div className="text-right w-1/3">
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Verify Authenticity</p>
                       <p className="text-xs md:text-sm font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded inline-block">
                          ID: {data.certificateId}
                       </p>
                    </div>

                 </div>

              </div>
          </div>
      </div>

    </div>
  );
}
