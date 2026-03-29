"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Loader2, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
}

interface DescriptiveComponentProps {
  questionId: string;
  trackId: string;
  courseId: string;
  title: string;
  description: string;
  starterCode?: string;
  options?: Option[];
  onSuccess: (xpEarned: number, data?: any) => void;
}

export default function DescriptiveComponent({ 
   questionId, trackId, courseId, title, description, starterCode, options = [], onSuccess 
}: DescriptiveComponentProps) {
  
  // Use `starterCode` or fallback to `description`
  const templateStr = starterCode || description || "";
  
  // Parse template: A pure function always returns the [[BLANK_1]] output...
  const parts = useMemo(() => {
    const rx = /\[\[(.*?)\]\]/g;
    const split = templateStr.split(rx);
    const parsed = [];
    let blankIndex = 0;
    for (let i = 0; i < split.length; i++) {
        if (i % 2 === 0) {
            if (split[i]) parsed.push({ type: 'text', text: split[i] });
        } else {
            parsed.push({ type: 'blank', id: split[i], index: blankIndex++ });
        }
    }
    return parsed;
  }, [templateStr]);

  const numBlanks = parts.filter(p => p.type === 'blank').length;

  // State maps blankIndex -> optionId
  const [filledBlanks, setFilledBlanks] = useState<Record<number, Option | null>>({});
  
  // Available options are options that haven't been placed yet.
  const placedOptionIds = Object.values(filledBlanks).filter(Boolean).map(o => o!.id);
  const availableOptions = options.filter(o => !placedOptionIds.includes(o.id));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; xpEarned: number; } | null>(null);

  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  const handleBlankClick = (blankIdx: number) => {
      // If we click a blank with an already placed item, we remove it back to pool
      // OR if we have a selected option, we place it.
      if (selectedOption) {
          setFilledBlanks(prev => ({ ...prev, [blankIdx]: selectedOption }));
          setSelectedOption(null);
      } else {
          // Check if there is already an item here, if so, pop it out
          if (filledBlanks[blankIdx]) {
              setFilledBlanks(prev => {
                  const copy = { ...prev };
                  delete copy[blankIdx];
                  return copy;
              });
          }
      }
  };

  const handleOptionClick = (opt: Option) => {
      // If we already selected, toggle off
      if (selectedOption?.id === opt.id) {
          setSelectedOption(null);
      } else {
          setSelectedOption(opt);
      }
  };

  const isAllFilled = numBlanks > 0 && Object.keys(filledBlanks).length === numBlanks && Object.values(filledBlanks).every(Boolean);

  const handleSubmit = async () => {
     if (!isAllFilled) return;
     setIsSubmitting(true);

     try {
       // Extract the IDs in order
       const answerIds = [];
       for (let i = 0; i < numBlanks; i++) {
           answerIds.push(filledBlanks[i]?.id);
       }
       const descriptiveAnswer = answerIds.join(",");

       const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             questionId,
             trackId,
             courseId,
             type: "descriptive",
             descriptiveAnswer
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
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">
       {/* Instruction Area */}
       <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
             Fill in the Blanks
          </p>
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="prose prose-neutral dark:prose-invert font-mono text-sm max-w-none">
             {description}
          </div>
       </div>

       {/* Interactive Area */}
       <div className="space-y-8">
           {/* Template Box */}
           <div className="bg-[#1e1e24] border border-neutral-800 rounded-xl p-6 md:p-8 font-mono text-base leading-loose shadow-inner overflow-x-auto text-neutral-300">
               {parts.map((p, i) => {
                   if (p.type === 'text') {
                       return <span key={i} className="whitespace-pre-wrap">{p.text}</span>;
                   } else {
                       const blankItem = filledBlanks[p.index!];
                       const isSelectedBlank = selectedOption !== null && !blankItem;
                       
                       return (
                           <button 
                               key={i} 
                               onClick={() => handleBlankClick(p.index!)}
                               disabled={!!result && result.isCorrect}
                               className={`
                                   inline-flex items-center justify-center min-w-[100px] h-9 px-3 mx-2 my-1 align-middle
                                   rounded border-2 transition-all duration-300 outline-none
                                   ${result && result.isCorrect 
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                        : result && !result.isCorrect && blankItem
                                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                        : blankItem
                                             ? 'bg-primary/20 border-primary cursor-pointer text-primary-foreground hover:bg-primary/30'
                                             : isSelectedBlank
                                                 ? 'bg-neutral-800 border-primary border-dashed cursor-pointer animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.3)]'
                                                 : 'bg-neutral-800 border-neutral-600 border-dashed cursor-pointer hover:border-neutral-400'
                                   }
                               `}
                           >
                               {blankItem ? blankItem.text : ""}
                           </button>
                       );
                   }
               })}
           </div>

           {/* Selectable Options Bank */}
           <div className="bg-card border border-border p-6 rounded-xl flex flex-col gap-4">
               <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${selectedOption ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}>
                   {selectedOption ? "Select a blank space above to drop answer" : "Select an option from the bank"}
               </span>
               <div className="flex flex-wrap gap-4 min-h-[60px]">
                   {availableOptions.map(opt => {
                       const isSelected = selectedOption?.id === opt.id;
                       return (
                           <button
                               key={opt.id}
                               onClick={() => handleOptionClick(opt)}
                               disabled={!!result && result.isCorrect}
                               className={`
                                   px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-all duration-200 shadow-sm
                                   border-b-4 outline-none
                                   ${isSelected 
                                      ? 'bg-primary text-primary-foreground border-primary-foreground/20 translate-y-1 border-b-0 shadow-[0_0_15px_rgba(var(--primary),0.5)]' 
                                      : 'bg-secondary text-secondary-foreground border-secondary/50 hover:bg-secondary/80 hover:-translate-y-0.5 active:translate-y-1 active:border-b-0'
                                   }
                                   ${result && result.isCorrect ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                               `}
                           >
                               {opt.text}
                           </button>
                       );
                   })}
                   {availableOptions.length === 0 && (
                       <div className="w-full flex items-center justify-center text-sm font-medium italic text-muted-foreground py-2 bg-muted/30 rounded-lg border border-dashed border-border">
                           All options have been placed. Tap an item in the code block to remove it.
                       </div>
                   )}
               </div>
           </div>
       </div>

       {/* Actions & Results */}
       {!result ? (
          <div className="pt-4 flex justify-end">
             <Button 
                size="lg" 
                onClick={handleSubmit} 
                disabled={!isAllFilled || isSubmitting}
                className="w-full md:w-auto px-10 h-12 text-lg font-bold shadow-lg"
             >
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Check Answer"}
             </Button>
          </div>
       ) : (
          <div className={`p-6 rounded-xl border flex items-start gap-4 animate-in slide-in-from-bottom-4 shadow-xl ${result.isCorrect ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
             <div className="shrink-0 mt-1">
                {result.isCorrect ? (
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                ) : (
                    <XCircle className="w-10 h-10 text-red-500" />
                )}
             </div>
             <div className="space-y-4 w-full">
                <div>
                   <h3 className={`text-2xl font-black tracking-tight ${result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result.isCorrect ? "Perfectly Filled!" : "Wait, that's not quite right!"}
                   </h3>
                   <p className="text-base font-medium mt-1 text-muted-foreground">
                      {result.isCorrect ? `You earned +${result.xpEarned} XP for successfully completing the code block.` : "The sequence of inputs is incorrect. Tap your placed answers to return them to the bank and try again!"}
                   </p>
                </div>

                <div className="flex justify-end pt-4">
                   {result.isCorrect ? (
                       <Button size="lg" onClick={() => onSuccess(result.xpEarned, result)} className="gap-2 bg-primary text-white font-bold px-8">
                          Continue <ArrowRight className="w-5 h-5" />
                       </Button>
                   ) : (
                       <Button size="lg" onClick={() => setResult(null)} variant="destructive" className="gap-2 font-bold px-8">
                          Clear Results & Retry
                       </Button>
                   )}
                </div>
             </div>
          </div>
       )}
    </div>
  );
}
