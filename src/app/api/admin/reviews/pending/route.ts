import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { SubmissionModel } from "@/models";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await dbConnect();

    // Fetch submissions that are pending manual review (usually descriptive)
    const pendingSubmissions = await SubmissionModel.find({ reviewStatus: "pending" })
      .populate("userId", "displayName email avatarUrl")
      .populate("questionId", "title description maxWords rubric xpReward")
      .populate("trackId", "title")
      .sort({ createdAt: 1 }) // oldest first
      .lean();
    
    return NextResponse.json({ success: true, data: pendingSubmissions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
