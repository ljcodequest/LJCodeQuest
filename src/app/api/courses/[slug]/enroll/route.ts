import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, ApiRouteError } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { 
  CourseModel, 
  TrackModel, 
  ProgressModel, 
  ActivityLogModel 
} from "@/models";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const context = await requireRegisteredUser(request);
    await dbConnect();

    // 1. Find course by slug
    const course = await CourseModel.findOne({ slug, isPublished: true }).lean();
    if (!course) {
      throw new ApiRouteError(404, "NOT_FOUND", "Course not found or not published.");
    }

    // 2. Check existing progress
    const existingProgress = await ProgressModel.findOne({
      userId: context.user._id,
      courseId: course._id,
    }).lean();

    if (existingProgress) {
      throw new ApiRouteError(409, "CONFLICT", "Already enrolled in this course.");
    }

    // 3. Find first track (beginner, order 1)
    const firstTrack = await TrackModel.findOne({
      courseId: course._id,
      difficulty: "beginner",
      order: 1,
    }).lean();

    // 4. Determine initial progress state
    let currentTrackId = firstTrack ? firstTrack._id : undefined;
    let currentTrackProgress = undefined;
    
    if (firstTrack) {
      currentTrackProgress = {
        trackId: firstTrack._id,
        currentQuestionOrder: 1,
        totalQuestionsInTrack: firstTrack.totalQuestions || 0,
      };
    }

    // 5. Create Progress document
    const progress = await ProgressModel.create({
      userId: context.user._id,
      courseId: course._id,
      currentTrackId,
      completedTracks: [],
      completedQuestions: [],
      completedLevels: [],
      currentTrackProgress,
      percentComplete: 0,
      isCompleted: false,
    });

    // 6. Increment course enrollment
    await CourseModel.findByIdAndUpdate(course._id, {
      $inc: { enrollmentCount: 1 },
    });

    // 7. Log activity
    await ActivityLogModel.create({
      userId: context.user._id,
      action: "course_view",
      details: `Enrolled in course: ${course._id}`,
      timestamp: new Date(),
    });

    return apiSuccess(
      {
        progressId: progress._id,
        courseId: course._id,
        currentTrackSlug: firstTrack?.slug,
      },
      "Successfully enrolled in course",
      { status: 201 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
