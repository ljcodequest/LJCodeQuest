import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel } from "@/models";
import { readJsonBody } from "@/lib/api";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // courseId
) {
  try {
    await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    
    const course = await CourseModel.findById(id).populate({
      path: "tracks",
      options: { sort: { order: 1 } }
    }).lean();

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: course.tracks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // courseId
) {
  try {
    const context = await requireAdmin(request);
    await dbConnect();
    
    const { id } = await params;
    const body = await readJsonBody<any>(request);

    const course = await CourseModel.findById(id);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const order = course.tracks.length + 1;

    const newTrack = await TrackModel.create({
      courseId: course._id,
      title: body.title,
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      description: body.description || "",
      theory: body.theoryContent || body.theory || "",
      order,
      xpReward: body.xpReward || 100,
      passingScore: body.passingScore || 80,
      isPublished: body.isPublished || false,
    });

    course.tracks.push(newTrack._id as mongoose.Types.ObjectId);
    course.totalTracks = course.tracks.length;
    await course.save();

    return NextResponse.json({ success: true, data: newTrack, message: "Track created successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
