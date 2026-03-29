import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";

export async function GET() {
  try {
    await dbConnect();

    // Fetch only published courses
    const courses = await CourseModel.find({ isPublished: true })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: courses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
