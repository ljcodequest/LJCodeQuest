import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel } from "@/models";
import { getSessionUser } from "@/lib/auth-server";
import { ProgressModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect();
    const { slug } = await params;

    const course = await CourseModel.findOne({ slug, isPublished: true })
      .populate({
         path: "tracks",
         select: "title slug description xpReward passingScore isPublished order",
         match: { isPublished: true },
         options: { sort: { order: 1 } }
      })
      .lean();

    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    let isEnrolled = false;
    let progress = null;

    // Check if the user is logged in
    const user = await getSessionUser();
    if (user) {
       const userProgress = await ProgressModel.findOne({
          userId: user._id,
          courseId: course._id
       }).lean();
       
       if (userProgress) {
          isEnrolled = true;
          progress = userProgress;
       }
    }

    return NextResponse.json({ 
      success: true, 
      data: { course, isEnrolled, progress } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
