import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { CourseModel } from "@/models";
import { getSessionUser } from "@/lib/auth-server";
import { ProgressModel } from "@/models";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"];

type CourseTrackSummary = {
  difficulty: string;
  order: number;
};

function getRouteError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, status: "status" in error ? Number(error.status) : 500 };
  }

  return { message: "Unexpected course error", status: 500 };
}

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
         select: "title slug description difficulty xpReward passingScore isPublished order",
         match: { isPublished: true },
         options: { sort: { difficulty: 1, order: 1 } }
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

    const tracks = (course.tracks || []) as unknown as CourseTrackSummary[];
    const sortedCourse = {
      ...course,
      tracks: [...tracks].sort((a, b) => {
        const difficultyDelta =
          DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
        return difficultyDelta || a.order - b.order;
      }),
    };

    return NextResponse.json({ 
      success: true, 
      data: { course: sortedCourse, isEnrolled, progress } 
    });
  } catch (error: unknown) {
    const routeError = getRouteError(error);
    return NextResponse.json({ success: false, error: routeError.message }, { status: routeError.status || 500 });
  }
}
