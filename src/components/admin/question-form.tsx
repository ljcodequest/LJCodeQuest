"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
}

export default function QuestionEditor({ trackId, questionId }: { trackId?: string, questionId?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!!questionId);
  const [isSaving, setIsSaving] = useState(false);
  
  // Base fields
  const [type, setType] = useState<"mcq" | "multi-select" | "descriptive" | "coding">("mcq");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [xpReward, setXpReward] = useState(10);
  const [explanation, setExplanation] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Type-specific state
  const [options, setOptions] = useState<Option[]>([
    { id: "1", text: "Option 1", isCorrect: true },
    { id: "2", text: "Option 2", isCorrect: false },
  ]);
  
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [maxWords, setMaxWords] = useState(500);
  const [rubric, setRubric] = useState("");
  
  const [starterCode, setStarterCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [timeLimit, setTimeLimit] = useState(10);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [hints, setHints] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: "1", input: "", expectedOutput: "", isHidden: false, weight: 1 }
  ]);

  useEffect(() => {
    if (questionId) {
      fetch(`/api/admin/questions/${questionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const q = data.data;
            setType(q.type);
            setTitle(q.title || "");
            setDescription(q.description || "");
            setDifficulty(q.difficulty);
            setXpReward(q.xpReward);
            setExplanation(q.explanation || "");
            setTags(q.tags?.join(", ") || "");
            setIsPublished(q.isPublished);

            if (q.options) setOptions(q.options);
            if (q.sampleAnswer) setSampleAnswer(q.sampleAnswer);
            if (q.maxWords) setMaxWords(q.maxWords);
            if (q.rubric) setRubric(q.rubric);
            if (q.starterCode) setStarterCode(q.starterCode);
            if (q.language) setLanguage(q.language);
            if (q.timeLimit) setTimeLimit(q.timeLimit);
            if (q.memoryLimit) setMemoryLimit(q.memoryLimit);
            if (q.hints) setHints(q.hints.join(", "));
            if (q.testCases) setTestCases(q.testCases);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [questionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload: any = {
        type,
        title,
        description,
        difficulty,
        xpReward,
        explanation,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        isPublished,
      };

      if (type === "mcq" || type === "multi-select") {
        payload.options = options;
      } else if (type === "descriptive") {
        payload.sampleAnswer = sampleAnswer;
        payload.maxWords = maxWords;
        payload.rubric = rubric;
      } else if (type === "coding") {
        payload.starterCode = starterCode;
        payload.language = language;
        payload.timeLimit = timeLimit;
        payload.memoryLimit = memoryLimit;
        payload.hints = hints.split(",").map(h => h.trim()).filter(Boolean);
        payload.testCases = testCases;
      }

      const url = questionId 
        ? `/api/admin/questions/${questionId}` 
        : `/api/admin/tracks/${trackId}/questions`;
      const method = questionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (trackId) {
            router.push(`/admin/tracks/${trackId}/questions`);
        } else {
            router.back();
        }
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Save error", error);
      alert("Failed to save question.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptionCorrectChange = (index: number) => {
    const newOptions = [...options];
    if (type === "mcq") {
      newOptions.forEach((o, i) => (o.isCorrect = i === index));
    } else {
      newOptions[index].isCorrect = !newOptions[index].isCorrect;
    }
    setOptions(newOptions);
  };

  if (isLoading) {
    return <div className="p-8">Loading question details...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" size="icon" className="h-8 w-8 rounded-full border-border"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {questionId ? "Edit Question" : "Add New Question"}
          </h2>
          <p className="text-muted-foreground text-sm">
             Build an assessment item for this track.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-lg border border-border">
        {/* Base Details Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Basic Details</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Type</label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={!!questionId} // Don't allow changing type after creation for safety
              >
                <option value="mcq">Multiple Choice Question (MCQ)</option>
                <option value="multi-select">Multi-Select Checkboxes</option>
                <option value="descriptive">Descriptive (Manual Review)</option>
                <option value="coding">Coding Challenge (Execution)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title/Short Prompt</label>
            <input
              required
              type="text"
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. What is closure in JavaScript?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Detailed Description (Markdown)</label>
            <textarea
              required
              rows={4}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide full context, code blocks, or instructions..."
            />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">XP Reward</label>
              <input
                type="number"
                min="0"
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <input
                type="text"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. javascript, functions, ES6"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Explanation (shown after answering)</label>
            <textarea
              rows={2}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the answer is correct..."
            />
          </div>
        </div>

        {/* Dynamic Type Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border pb-2">Question Configurations</h3>
          
          {(type === "mcq" || type === "multi-select") && (
            <div className="space-y-4 bg-muted/30 p-4 rounded-md border border-border">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Answer Options</label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setOptions([...options, { id: Date.now().toString(), text: "New Option", isCorrect: false }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Option
                </Button>
              </div>
              
              {options.map((option, index) => (
                <div key={option.id} className="flex gap-3 items-start">
                  <div className="pt-2">
                    {type === "mcq" ? (
                      <input 
                        type="radio" 
                        name="correctOption"
                        className="h-4 w-4 text-primary focus:ring-primary"
                        checked={option.isCorrect}
                        onChange={() => handleOptionCorrectChange(index)}
                      />
                    ) : (
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 rounded text-primary focus:ring-primary"
                        checked={option.isCorrect}
                        onChange={() => handleOptionCorrectChange(index)}
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={option.text}
                    onChange={(e) => {
                      const newOptions = [...options];
                      newOptions[index].text = e.target.value;
                      setOptions(newOptions);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                    disabled={options.length <= 2}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {type === "descriptive" && (
            <div className="space-y-4 bg-muted/30 p-4 rounded-md border border-border">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Words Limit</label>
                  <input
                    type="number"
                    min="10"
                    required
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={maxWords}
                    onChange={(e) => setMaxWords(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Answer</label>
                <textarea
                  rows={3}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sampleAnswer}
                  onChange={(e) => setSampleAnswer(e.target.value)}
                  placeholder="The ideal answer for the reviewer to reference."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Grading Rubric</label>
                <textarea
                  rows={3}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={rubric}
                  onChange={(e) => setRubric(e.target.value)}
                  placeholder="e.g. 5 points for logic, 5 points for clarity."
                />
              </div>
            </div>
          )}

          {type === "coding" && (
            <div className="space-y-4 bg-muted/30 p-4 rounded-md border border-border">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Execution Language</label>
                  <select
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Limit (s)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Memory Limit (MB)</label>
                  <input
                    type="number"
                    min="16"
                    required
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Starter Code Base</label>
                <textarea
                  rows={6}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  placeholder="function solution(arr) { ... }"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Hints (comma separated)</label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={hints}
                  onChange={(e) => setHints(e.target.value)}
                  placeholder="Remember array methods, Use a hash map"
                />
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium">Test Cases</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTestCases([...testCases, { id: Date.now().toString(), input: "", expectedOutput: "", isHidden: false, weight: 1 }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Test Case
                  </Button>
                </div>

                <div className="space-y-4">
                  {testCases.map((tc, index) => (
                    <div key={tc.id} className="grid gap-3 grid-cols-12 items-start border border-border bg-background p-3 rounded-md">
                      <div className="col-span-12 md:col-span-5 space-y-1">
                        <label className="text-xs text-muted-foreground">Input / Args</label>
                        <textarea
                          required
                          rows={2}
                          className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          value={tc.input}
                          onChange={(e) => {
                            const newTc = [...testCases];
                            newTc[index].input = e.target.value;
                            setTestCases(newTc);
                          }}
                          placeholder="[1, 2, 3]"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-5 space-y-1">
                        <label className="text-xs text-muted-foreground">Expected Output</label>
                        <textarea
                          required
                          rows={2}
                          className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                          value={tc.expectedOutput}
                          onChange={(e) => {
                            const newTc = [...testCases];
                            newTc[index].expectedOutput = e.target.value;
                            setTestCases(newTc);
                          }}
                          placeholder="6"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-2 flex flex-col md:items-end justify-between h-full gap-2 pt-5">
                         <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={tc.isHidden}
                            onChange={(e) => {
                              const newTc = [...testCases];
                              newTc[index].isHidden = e.target.checked;
                              setTestCases(newTc);
                            }}
                            className="h-3 w-3 rounded"
                          />
                          Hidden Case
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-6 px-2 text-xs"
                          onClick={() => setTestCases(testCases.filter((_, i) => i !== index))}
                          disabled={testCases.length <= 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPublishedQuestion"
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-background"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          <label htmlFor="isPublishedQuestion" className="text-sm font-medium cursor-pointer">
            Publish and make live for students
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
