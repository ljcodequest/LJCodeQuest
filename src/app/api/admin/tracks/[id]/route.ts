import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { TrackModel, CourseModel, QuestionModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const track = await TrackModel.findById(id).lean();

    if (!track) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: track });
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

    const updatedTrack = await TrackModel.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedTrack) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedTrack, message: "Track updated successfully" });
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
    const track = await TrackModel.findById(id);

    if (!track) {
      return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }
    
    // Remove track reference from course
    await CourseModel.findByIdAndUpdate(track.courseId, {
      $pull: { tracks: track._id },
      $inc: { totalTracks: -1 }
    });

    // Delete associated questions
    await QuestionModel.deleteMany({ trackId: track._id });
    
    // Delete the track itself
    await track.deleteOne();

    return NextResponse.json({ success: true, message: "Track and associated questions deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
