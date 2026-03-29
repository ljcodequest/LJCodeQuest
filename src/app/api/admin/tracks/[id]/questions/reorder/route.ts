import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { QuestionModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // trackId
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id: trackId } = await params;
    const body = await readJsonBody<{ questionIds: string[] }>(request);
    
    const updatePromises = body.questionIds.map((questionId, index) => {
      return QuestionModel.findOneAndUpdate(
        { _id: questionId, trackId }, 
        { order: index + 1 }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: "Questions reordered successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
