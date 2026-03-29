"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle2, XCircle, Terminal, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface CodeSubmissionResult {
  passed: boolean;
  results: {
     name: string;
     passed: boolean;
     isHidden: boolean;
     input: string;
     expectedOutput: string;
     actualOutput: string;
     compileErr: string;
     stderr: string;
     code: number;
  }[];
}

interface CodingComponentProps {
  questionId: string;
  trackId: string;
  title: string;
  description: string;
  language: string;
  testCases: TestCase[];
  onSuccess: (xpEarned: number, data?: any) => void;
  courseId: string;
}

export default function CodingComponent({ 
   questionId, trackId, courseId, title, description, language, testCases, onSuccess 
}: CodingComponentProps) {
  const [code, setCode] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionData, setExecutionData] = useState<CodeSubmissionResult | null>(null);
  const [finalResult, setFinalResult] = useState<{ isCorrect: boolean; xpEarned: number; progressUpdate?: any } | null>(null);
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const mappedLanguage = language.toLowerCase() === "python" ? "python" :
                         language.toLowerCase() === "javascript" ? "javascript" :
                         language.toLowerCase() === "java" ? "java" : "plaintext";

  const handleRunCode = async () => {
     if (!code.trim()) return;
     setIsExecuting(true);
     setExecutionData(null);

     try {
       const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             questionId,
             language: mappedLanguage,
             sourceCode: code,
             testCases
          })
       });

       const data = await res.json();
       if (data.success) {
          setExecutionData(data.data);
       } else {
          alert(`Execution Error: ${data.error}`);
       }
     } catch (error) {
       console.error("Execution failed", error);
     } finally {
       setIsExecuting(false);
     }
  };

  const handleSubmit = async () => {
     if (!executionData || !executionData.passed) {
        alert("You must pass all test cases by running your code first!");
        return;
     }

     setIsSubmitting(true);
     try {
       const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             questionId,
             trackId,
             courseId,
             type: "coding",
             descriptiveAnswer: code,
             codingPassed: true
          })
       });

       const data = await res.json();
       if (data.success) {
          setFinalResult(data.data);
       } else {
          alert(`Submission Error: ${data.error}`);
       }
     } catch (error) {
       console.error("Final submission failed", error);
     } finally {
       setIsSubmitting(false);
     }
  };

  const handleGetHint = async () => {
     setIsGeneratingHint(true);
     setHint(null);
     try {
       const res = await fetch("/api/ai/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             questionId,
             language: mappedLanguage,
             sourceCode: code,
          })
       });
       const data = await res.json();
       if (data.success) {
          setHint(data.data.hint);
       } else {
          alert(`AI Error: ${data.error}`);
       }
     } catch (err) {
       console.error("Failed to generate AI hint", err);
     } finally {
       setIsGeneratingHint(false);
     }
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 h-[800px] animate-in fade-in slide-in-from-bottom-2">
       
       {/* Left Column: Context & Execution Results */}
       <div className="flex-1 flex flex-col border border-border rounded-xl bg-card overflow-hidden h-full">
          <div className="p-5 border-b border-border bg-muted/30">
             <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="uppercase tracking-widest text-[#a855f7] border-[#a855f7]/30 bg-[#a855f7]/10">
                   Code Challenge
                </Badge>
                 <Badge className="uppercase tracking-widest">{mappedLanguage}</Badge>
              </div>
              <div className="flex justify-between items-start gap-4">
                 <h2 className="text-xl font-bold">{title}</h2>
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0"
                    onClick={handleGetHint}
                    disabled={isGeneratingHint || !!finalResult}
                 >
                    {isGeneratingHint ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Ask AI Hint
                 </Button>
              </div>
           </div>
           <div className="p-5 overflow-y-auto max-h-[40%] border-b border-border flex flex-col gap-4">
              <div className="prose prose-neutral dark:prose-invert font-mono text-sm max-w-none">
                 {description}
              </div>
              
              {hint && (
                 <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2">
                       <Sparkles className="w-4 h-4" /> AI Mentor Suggestion
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">{hint}</p>
                 </div>
              )}
           </div>

          <div className="flex-1 overflow-y-auto bg-background p-5 relative">
             <div className="sticky top-0 bg-background/90 backdrop-blur-sm pb-2 border-b border-border flex items-center justify-between z-10">
                <h3 className="font-bold flex items-center gap-2">
                   <Terminal className="w-4 h-4" /> Test Case Output
                </h3>
             </div>
             
             <div className="mt-4 space-y-4">
                {!executionData && !isExecuting && (
                   <div className="text-center text-muted-foreground py-10 font-mono text-sm opacity-50">
                      Run your code to see results globally.
                   </div>
                )}
                
                {isExecuting && (
                   <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="font-mono text-sm animate-pulse">Running against Piston engine...</p>
                   </div>
                )}

                {executionData && executionData.results.map((res, i) => (
                   <div key={i} className={`p-4 rounded-lg border font-mono text-sm ${res.passed ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                      <div className="flex items-center justify-between mb-2">
                         <span className={`font-bold ${res.passed ? 'text-green-500' : 'text-red-500'}`}>
                            {res.name}: {res.passed ? 'Passed' : 'Failed'}
                         </span>
                         {res.passed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      
                      {!res.isHidden && (
                         <div className="space-y-2 mt-3 text-xs opacity-90">
                            <div>
                               <span className="text-muted-foreground">Input:</span> 
                               <div className="bg-background/80 p-2 rounded mt-1 overflow-x-auto">{res.input}</div>
                            </div>
                            <div>
                               <span className="text-muted-foreground">Expected:</span> 
                               <div className="bg-background/80 p-2 rounded mt-1 overflow-x-auto">{res.expectedOutput}</div>
                            </div>
                            <div>
                               <span className="text-muted-foreground">Actual:</span> 
                               <div className={`p-2 rounded mt-1 overflow-x-auto ${res.passed ? 'bg-background/80' : 'bg-red-500/20'}`}>
                                  {res.actualOutput || (res.compileErr ? "Compilation Error" : "No Output")}
                               </div>
                            </div>
                            {res.compileErr && (
                               <div>
                                  <span className="text-red-500 font-bold flex items-center gap-1 mt-2">
                                     <AlertCircle className="w-3 h-3" /> Error Dump:
                                  </span> 
                                  <div className="bg-red-500/10 p-2 rounded mt-1 overflow-x-auto text-red-400">{res.compileErr}</div>
                               </div>
                            )}
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
       </div>

       {/* Right Column: Monaco Editor */}
       <div className="flex-[1.5] flex flex-col border border-border rounded-xl bg-[#1e1e1e] overflow-hidden shadow-2xl h-full">
          <div className="p-3 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between">
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
             </div>
             <span className="text-xs text-[#858585] font-mono">main.{mappedLanguage === "python" ? "py" : mappedLanguage === "javascript" ? "js" : mappedLanguage === "java" ? "java" : "txt"}</span>
          </div>
          
          <div className="flex-1 relative">
             {finalResult && (
                <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                   <div className="bg-card border border-green-500/30 p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                         <CheckCircle2 className="w-10 h-10 text-green-500" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Excellent Work!</h2>
                      <p className="text-muted-foreground mb-6">You passed all test cases successfully.</p>
                      <Button size="lg" onClick={() => onSuccess(finalResult.xpEarned || 0, finalResult)} className="gap-2">
                         Continue <CheckCircle2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
             )}

             <Editor
                height="100%"
                theme="vs-dark"
                language={mappedLanguage}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                   minimap: { enabled: false },
                   fontSize: 14,
                   fontFamily: "var(--font-mono), monospace",
                   padding: { top: 16 },
                   scrollBeyondLastLine: false,
                   smoothScrolling: true,
                   cursorBlinking: "smooth",
                   cursorSmoothCaretAnimation: "on",
                }}
             />
          </div>
          
          <div className="p-4 bg-[#252526] border-t border-[#3e3e42] flex items-center justify-between border-l-4 border-l-primary">
             <Button 
                variant="secondary" 
                className="gap-2 bg-[#3e3e42] hover:bg-[#4e4e52] text-white border-none"
                onClick={handleRunCode}
                disabled={isExecuting || !!finalResult}
             >
                {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Code
             </Button>
             
             <Button 
                onClick={handleSubmit}
                disabled={!executionData?.passed || isSubmitting || !!finalResult}
                className={`gap-2 shadow-lg transition-all ${executionData?.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-green-500/20' : ''}`}
             >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Solution"}
             </Button>
          </div>
       </div>

    </div>
  );
}
