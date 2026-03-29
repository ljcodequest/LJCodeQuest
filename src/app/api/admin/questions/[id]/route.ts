import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { QuestionModel, TrackModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const question = await QuestionModel.findById(id).lean();

    if (!question) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: question });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<any>(request);

    const updatedQuestion = await QuestionModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedQuestion, message: "Question updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const question = await QuestionModel.findById(id);

    if (!question) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }
    
    const trackId = question.trackId;
    await question.deleteOne();

    // Decrement totalQuestions on the track
    await TrackModel.findByIdAndUpdate(trackId, {
      $inc: { totalQuestions: -1 }
    });

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
