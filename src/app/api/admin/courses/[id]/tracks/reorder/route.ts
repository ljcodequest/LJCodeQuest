import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { TrackModel, CourseModel } from "@/models";
import { readJsonBody } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // courseId
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<{ trackIds: string[] }>(request);
    
    const course = await CourseModel.findById(id);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Update the courses track array to match new order
    course.tracks = body.trackIds as any;
    await course.save();

    // Update each track's order field based on its index
    const updatePromises = body.trackIds.map((trackId, index) => {
      return TrackModel.findByIdAndUpdate(trackId, { order: index + 1 });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true, message: "Tracks reordered successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
