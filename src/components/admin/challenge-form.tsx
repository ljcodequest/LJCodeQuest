"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";

type TestCaseInput = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  weight: number;
};

type ChallengeFormData = {
  title: string;
  summary: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  language: string;
  starterCode: string;
  xpReward: number;
  timeLimitMinutes: number;
  tags: string;
  isPublished: boolean;
  testCases: TestCaseInput[];
};

const emptyTestCase = (index: number): TestCaseInput => ({
  id: `test-${index + 1}`,
  input: "",
  expectedOutput: "",
  isHidden: false,
  weight: 1,
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function ChallengeEditor({ challengeId }: { challengeId?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(Boolean(challengeId));
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: "",
    summary: "",
    description: "",
    difficulty: "easy",
    category: "JavaScript",
    language: "javascript",
    starterCode: "function solve(input) {\n  // Write your solution here\n}\n\nconsole.log(solve(require('fs').readFileSync(0, 'utf8').trim()));",
    xpReward: 50,
    timeLimitMinutes: 30,
    tags: "",
    isPublished: false,
    testCases: [emptyTestCase(0)],
  });

  useEffect(() => {
    if (!challengeId) return;

    fetch(`/api/admin/challenges/${challengeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.error || "Failed to load challenge.");
        }

        setFormData({
          title: data.data.title || "",
          summary: data.data.summary || "",
          description: data.data.description || "",
          difficulty: data.data.difficulty || "easy",
          category: data.data.category || "JavaScript",
          language: data.data.language || "javascript",
          starterCode: data.data.starterCode || "",
          xpReward: data.data.xpReward || 50,
          timeLimitMinutes: data.data.timeLimitMinutes || 30,
          tags: data.data.tags ? data.data.tags.join(", ") : "",
          isPublished: Boolean(data.data.isPublished),
          testCases: data.data.testCases?.length ? data.data.testCases : [emptyTestCase(0)],
        });
      })
      .catch((error) => {
        console.error("Failed to load challenge", error);
        alert(getErrorMessage(error));
      })
      .finally(() => setIsLoading(false));
  }, [challengeId]);

  const updateTestCase = (
    index: number,
    updates: Partial<TestCaseInput>
  ) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, ...updates } : testCase
      ),
    }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, emptyTestCase(prev.testCases.length)],
    }));
  };

  const removeTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases:
        prev.testCases.length === 1
          ? prev.testCases
          : prev.testCases.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        xpReward: Number(formData.xpReward) || 50,
        timeLimitMinutes: Number(formData.timeLimitMinutes) || 30,
      };
      const url = challengeId ? `/api/admin/challenges/${challengeId}` : "/api/admin/challenges";
      const method = challengeId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save challenge.");
      }

      router.push("/admin/challenges");
    } catch (error) {
      console.error("Save challenge error", error);
      alert(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Loading challenge details...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/challenges">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {challengeId ? "Edit Challenge" : "Create Challenge"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure a standalone coding challenge, visible tests, hidden tests, and publishing state.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Challenge Title</label>
              <input
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Normalize Usernames"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Summary</label>
              <input
                required
                maxLength={180}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Short catalog description..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Instructions</label>
              <textarea
                required
                rows={7}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe input, output, constraints, and examples."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value as ChallengeFormData["difficulty"] })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="c++">C++</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input
                required
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="JavaScript, Algorithms, React..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">XP Reward</label>
                <input
                  type="number"
                  min={0}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minutes</label>
                <input
                  type="number"
                  min={1}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.timeLimitMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, timeLimitMinutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <input
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="arrays, strings, parsing"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Starter Code</label>
            <textarea
              rows={10}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.starterCode}
              onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
            />
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">Test Cases</h3>
              <p className="text-sm text-muted-foreground">Hidden cases are used for grading but masked on the public page.</p>
            </div>
            <Button type="button" variant="outline" onClick={addTestCase} className="gap-2">
              <Plus className="h-4 w-4" /> Add Case
            </Button>
          </div>

          <div className="space-y-4">
            {formData.testCases.map((testCase, index) => (
              <div key={`${testCase.id}-${index}`} className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Case {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeTestCase(index)}
                    disabled={formData.testCases.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Input</label>
                    <textarea
                      rows={3}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      value={testCase.input}
                      onChange={(e) => updateTestCase(index, { input: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Expected Output</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                      value={testCase.expectedOutput}
                      onChange={(e) => updateTestCase(index, { expectedOutput: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Weight</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={testCase.weight}
                        onChange={(e) => updateTestCase(index, { weight: Number(e.target.value) })}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={testCase.isHidden}
                        onChange={(e) => updateTestCase(index, { isHidden: e.target.checked })}
                      />
                      Hidden
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            />
            Publish challenge
          </label>

          <div className="flex justify-end gap-3">
            <Link href="/admin/challenges">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Challenge"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
}
