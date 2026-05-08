import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getAuthContext } from "@/lib/auth";
import { ApiRouteError } from "@/lib/api";
import { CourseModel, ProgressModel } from "@/models";

function getRouteError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: "status" in error ? Number(error.status) : 500,
    };
  }

  return { message: "Unexpected courses error", status: 500 };
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const courses = await CourseModel.find({ isPublished: true })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    let userId = null;

    try {
      const context = await getAuthContext(request);
      userId = context.user?._id ?? null;
    } catch (error) {
      if (!(error instanceof ApiRouteError) || error.status !== 401) {
        throw error;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: true, data: courses });
    }

    const progressDocs = await ProgressModel.find({
      userId,
      courseId: { $in: courses.map((course) => course._id) },
    })
      .select("courseId status percentComplete isCompleted completedAt lastActiveAt")
      .lean();

    const progressByCourseId = new Map(
      progressDocs.map((progress) => [
        progress.courseId.toString(),
        {
          status: progress.status,
          percentComplete: progress.percentComplete,
          isCompleted: progress.isCompleted,
          completedAt: progress.completedAt,
          lastActiveAt: progress.lastActiveAt,
        },
      ])
    );

    const coursesWithProgress = courses.map((course) => ({
      ...course,
      progress: progressByCourseId.get(course._id.toString()) ?? null,
    }));

    return NextResponse.json({ success: true, data: coursesWithProgress });
  } catch (error: unknown) {
    const routeError = getRouteError(error);
    return NextResponse.json(
      { success: false, error: routeError.message },
      { status: routeError.status || 500 }
    );
  }
}
