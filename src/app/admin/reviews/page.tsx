"use client";

import { useState, useEffect } from "react";
import { Inbox, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Review {
  _id: string;
  descriptiveAnswer: string;
  createdAt: string;
  userId: {
    _id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  questionId: {
    _id: string;
    title: string;
    description: string;
    rubric: string;
    xpReward: number;
  };
  trackId: {
    title: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [feedback, setFeedback] = useState("");
  const [awardedXp, setAwardedXp] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/reviews/pending");
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch pending reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openReviewModal = (review: Review) => {
    setActiveReview(review);
    setFeedback("");
    setAwardedXp(review.questionId?.xpReward || 0); // Default to max
  };

  const submitReview = async (status: "reviewed" | "rejected") => {
    if (!activeReview) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/reviews/${activeReview._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: status === "reviewed" ? 100 : 0,
          xpEarned: status === "reviewed" ? awardedXp : 0,
          reviewFeedback: feedback,
          reviewStatus: status
        }),
      });
      
      if (res.ok) {
        setActiveReview(null);
        fetchReviews();
      } else {
         const data = await res.json();
         alert(`Error: ${data.error}`);
      }
    } catch (error) {
       console.error("Review failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pending Reviews</h2>
          <p className="text-muted-foreground">Manually grade descriptive submissions from students.</p>
        </div>
      </div>

      {!activeReview ? (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading queue...</div>
          ) : reviews.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <Inbox className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold">All caught up!</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                There are no pending submissions requiring manual review at this time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map(review => (
                <div key={review._id} className="p-6 flex flex-col md:flex-row gap-6 items-start hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarImage src={review.userId?.avatarUrl} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {review.userId?.displayName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-base">{review.userId?.displayName || "Unknown User"}</h4>
                        <p className="text-xs text-muted-foreground">
                          Submitted on {new Date(review.createdAt).toLocaleDateString()} for Track <span className="text-foreground font-medium">{review.trackId?.title}</span>
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="mt-4 p-4 bg-muted/50 rounded-md border border-border">
                       <p className="text-sm font-medium mb-2">Question: {review.questionId?.title}</p>
                       <p className="text-sm font-mono text-muted-foreground line-clamp-3">
                         "{review.descriptiveAnswer}"
                       </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto mt-4 md:mt-0">
                     <Button className="w-full md:w-auto" onClick={() => openReviewModal(review)}>
                       Grade Submission
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Active Review View (Takes over the screen instead of a modal for better reading space)
        <div className="space-y-6">
           <Button variant="outline" className="gap-2" onClick={() => setActiveReview(null)}>
             <ArrowLeft className="w-4 h-4" /> Back to Queue
           </Button>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{activeReview.questionId?.title}</h3>
                    <p className="text-sm mt-2 font-mono whitespace-pre-wrap">{activeReview.questionId?.description}</p>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-lg border border-primary/20 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Student's Answer</h3>
                  <div className="whitespace-pre-wrap font-mono text-sm pt-2">
                    {activeReview.descriptiveAnswer}
                  </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border border-border space-y-4">
                   <h3 className="font-bold flex items-center justify-between">
                     Grading Panel
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={activeReview.userId?.avatarUrl} />
                        <AvatarFallback>{activeReview.userId?.displayName?.charAt(0)}</AvatarFallback>
                     </Avatar>
                   </h3>
                   
                   {activeReview.questionId?.rubric && (
                      <div className="text-xs bg-muted/50 p-3 rounded-md border border-border">
                        <strong>Rubric:</strong> {activeReview.questionId.rubric}
                      </div>
                   )}

                   <div className="space-y-2 pt-4 border-t border-border">
                     <label className="text-sm font-medium">Feedback (Optional)</label>
                     <textarea
                        rows={4}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Great job explaining the concept..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                     />
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-medium flex justify-between">
                       XP to Award 
                       <span className="text-muted-foreground font-normal">Max: {activeReview.questionId?.xpReward}</span>
                     </label>
                     <input
                        type="number"
                        min="0"
                        max={activeReview.questionId?.xpReward || 100}
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={awardedXp}
                        onChange={(e) => setAwardedXp(parseInt(e.target.value))}
                     />
                   </div>

                   <div className="pt-4 flex gap-3">
                     <Button 
                       variant="outline" 
                       className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                       disabled={isSubmitting}
                       onClick={() => submitReview("rejected")}
                     >
                       <XCircle className="w-4 h-4 mr-2" /> Reject
                     </Button>
                     <Button 
                       className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                       disabled={isSubmitting}
                       onClick={() => submitReview("reviewed")}
                     >
                       <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                     </Button>
                   </div>
                </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
