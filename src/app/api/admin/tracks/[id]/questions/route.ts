import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { QuestionModel, TrackModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // trackId
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    
    const track = await TrackModel.findById(id).lean();
    if (!track) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    const questions = await QuestionModel.find({ trackId: id })
      .sort({ order: 1 })
      .lean();

    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // trackId
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<any>(request);

    const track = await TrackModel.findById(id);
    if (!track) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    const currentQuestionsCount = await QuestionModel.countDocuments({ trackId: id });
    const order = currentQuestionsCount + 1;

    const newQuestion = await QuestionModel.create({
      trackId: id,
      ...body,
      order,
    });

    // Update track questions count
    track.totalQuestions = order;
    await track.save();

    return NextResponse.json({ success: true, data: newQuestion, message: "Question created successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
