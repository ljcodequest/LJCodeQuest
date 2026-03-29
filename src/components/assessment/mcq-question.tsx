"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
}

interface MCQComponentProps {
  questionId: string;
  trackId: string;
  title: string;
  description: string;
  type: "mcq" | "multi-select";
  options: Option[];
  onSuccess: (xpEarned: number, data?: any) => void;
  courseId: string;
}

export default function MCQComponent({ 
   questionId, trackId, courseId, title, description, type, options, onSuccess 
}: MCQComponentProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; xpEarned: number; explanation?: string; progressUpdate?: any } | null>(null);

  const toggleOption = (id: string) => {
     if (result) return; // Locked after submitting
     
     if (type === "mcq") {
        setSelectedIds([id]);
     } else {
        if (selectedIds.includes(id)) {
           setSelectedIds(selectedIds.filter(v => v !== id));
        } else {
           setSelectedIds([...selectedIds, id]);
        }
     }
  };

  const handleSubmit = async () => {
     if (selectedIds.length === 0) return;
     setIsSubmitting(true);

     try {
       const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             questionId,
             trackId,
             courseId,
             type,
             selectedOptions: selectedIds
          })
       });

       const data = await res.json();
       if (data.success) {
          setResult(data.data);
       } else {
          alert(`Error: ${data.error}`);
       }
     } catch (error) {
       console.error("Submission failed", error);
     } finally {
       setIsSubmitting(false);
     }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
       {/* Question Context */}
       <div className="bg-card border border-border p-6 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
             {type === 'mcq' ? 'Multiple Choice' : 'Select All That Apply'}
          </p>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="prose prose-neutral dark:prose-invert font-mono text-sm max-w-none">
             {description}
          </div>
       </div>

       {/* Options */}
       <div className="space-y-3">
          {options.map((opt) => {
             const isSelected = selectedIds.includes(opt.id);
             return (
                <div 
                   key={opt.id}
                   onClick={() => toggleOption(opt.id)}
                   className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center gap-4
                      ${result ? 'cursor-not-allowed opacity-90' : 'hover:border-primary/50'}
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}
                   `}
                >
                   <div className={`
                      h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0
                      ${isSelected ? 'border-primary' : 'border-muted-foreground'}
                      ${type === 'multi-select' ? 'rounded-md' : 'rounded-full'}
                   `}>
                      {isSelected && (
                         <div className={`h-2.5 w-2.5 bg-primary ${type === 'multi-select' ? 'rounded-sm' : 'rounded-full'}`} />
                      )}
                   </div>
                   <div className="font-medium">{opt.text}</div>
                </div>
             );
          })}
       </div>

       {/* Actions & Results */}
       {!result ? (
          <div className="pt-4 flex justify-end">
             <Button 
                size="lg" 
                onClick={handleSubmit} 
                disabled={selectedIds.length === 0 || isSubmitting}
                className="w-full md:w-auto"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Submit Answer"}
             </Button>
          </div>
       ) : (
          <div className={`p-6 rounded-xl border-2 animate-in fade-in slide-in-from-bottom-2 ${
             result.isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
          }`}>
             <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                   {result.isCorrect ? (
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                   ) : (
                      <XCircle className="w-8 h-8 text-red-500" />
                   )}
                </div>
                <div className="space-y-4 w-full">
                   <div>
                      <h3 className={`text-xl font-bold ${result.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                         {result.isCorrect ? 'Correct!' : 'Incorrect'}
                      </h3>
                      {result.isCorrect && (
                         <p className="text-sm font-medium mt-1">+{result.xpEarned} XP Earned</p>
                      )}
                   </div>
                   
                   {result.explanation && (
                      <div className="bg-background/80 p-4 rounded-lg border border-border mt-4 text-sm font-mono">
                         <div className="flex items-center gap-2 font-bold mb-2">
                            <AlertCircle className="w-4 h-4" /> Explanation
                         </div>
                         {result.explanation}
                      </div>
                   )}

                   <div className="flex justify-end pt-4">
                      {result.isCorrect ? (
                         <Button onClick={() => onSuccess(result.xpEarned, result)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                            Continue <CheckCircle2 className="w-4 h-4" />
                         </Button>
                      ) : (
                         <Button variant="outline" onClick={() => {
                            setResult(null);
                            setSelectedIds([]);
                         }}>
                            Try Again
                         </Button>
                      )}
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
