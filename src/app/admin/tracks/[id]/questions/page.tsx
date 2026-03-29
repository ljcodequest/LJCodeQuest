"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, MoreVertical, Edit, Trash, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Question {
  _id: string;
  title: string;
  type: string;
  difficulty: string;
  xpReward: number;
  order: number;
  isPublished: boolean;
}

export default function AdminTrackQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trackId } = use(params);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/tracks/${trackId}/questions`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [trackId]);

  const togglePublish = async (questionId: string, isPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) fetchQuestions();
    } catch (error) {
      console.error("Failed to toggle publish status", error);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await fetch(`/api/admin/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) fetchQuestions();
    } catch (error) {
      console.error("Failed to delete question", error);
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newQuestions = [...questions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap tracks locally
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[swapIndex];
    newQuestions[swapIndex] = temp;
    
    setQuestions(newQuestions);
    setIsReordering(true);

    try {
      const questionIds = newQuestions.map(q => q._id);
      await fetch(`/api/admin/tracks/${trackId}/questions/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds })
      });
    } catch (error) {
      console.error("Reorder failed", error);
      fetchQuestions(); // Revert on failure
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" size="icon" className="h-8 w-8 rounded-full border-border"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Questions</h2>
          <p className="text-muted-foreground">Build the assessment for this track.</p>
        </div>
        <div className="ml-auto">
          <Link href={`/admin/tracks/${trackId}/questions/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium w-20">Order</th>
                <th className="px-6 py-3 font-medium">Prompt</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Difficulty</th>
                <th className="px-6 py-3 font-medium text-center">XP</th>
                <th className="px-6 py-3 font-medium text-center">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Loading questions...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No questions in this track yet.
                  </td>
                </tr>
              ) : (
                questions.map((question, index) => (
                  <tr key={question._id} className="hover:bg-muted/50 transition-colors">
                     <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === 0 || isReordering}
                          onClick={() => moveQuestion(index, 'up')}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="font-mono text-xs">{index + 1}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={index === questions.length - 1 || isReordering}
                          onClick={() => moveQuestion(index, 'down')}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium max-w-xs truncate" title={question.title}>{question.title}</td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {question.type}
                        </span>
                    </td>
                    <td className="px-6 py-4 capitalize">{question.difficulty}</td>
                    <td className="px-6 py-4 text-center">{question.xpReward} XP</td>
                    <td className="px-6 py-4 text-center">
                       {question.isPublished ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" render={<Link href={`/admin/questions/${question._id}/edit?trackId=${trackId}`} className="flex items-center w-full" />}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit item</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => togglePublish(question._id, question.isPublished)}
                          >
                            {question.isPublished ? (
                              <><EyeOff className="mr-2 h-4 w-4" /><span>Unpublish</span></>
                            ) : (
                              <><Eye className="mr-2 h-4 w-4" /><span>Publish</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => deleteQuestion(question._id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
