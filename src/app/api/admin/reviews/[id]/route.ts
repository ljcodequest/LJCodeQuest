import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { SubmissionModel, UserModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<{
      score: number;
      xpEarned: number;
      reviewFeedback: string;
      reviewStatus: "reviewed" | "rejected";
    }>(request);

    if (!body.reviewStatus || !["reviewed", "rejected"].includes(body.reviewStatus)) {
      return NextResponse.json({ success: false, error: "Invalid review status" }, { status: 400 });
    }

    const submission = await SubmissionModel.findById(id);

    if (!submission) {
       return NextResponse.json({ success: false, error: "Submission not found" }, { status: 404 });
    }

    if (submission.reviewStatus !== "pending") {
       return NextResponse.json({ success: false, error: "Submission is already reviewed" }, { status: 400 });
    }

    // Update Submission
    submission.score = body.score || 0;
    submission.xpEarned = body.xpEarned || 0;
    submission.reviewFeedback = body.reviewFeedback || "";
    submission.reviewStatus = body.reviewStatus;
    submission.reviewedBy = context.user._id;
    submission.reviewedAt = new Date();
    submission.isCorrect = body.reviewStatus === "reviewed"; // loosely define 'correct' as accepted
    
    await submission.save();

    // Give XP to the User if they earned any
    if (submission.xpEarned > 0) {
       await UserModel.findByIdAndUpdate(submission.userId, {
         $inc: { xp: submission.xpEarned }
       });
    }

    return NextResponse.json({ success: true, data: submission, message: "Review submitted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
