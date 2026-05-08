import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel, QuestionModel, ProgressModel } from "@/models";
import { sanitizeQuestionForRole } from "@/lib/question-visibility";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;

function getRouteError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message, status: "status" in error ? Number(error.status) : 500 };
  }

  return { message: "Unexpected questions error", status: 500 };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseSlug: string; trackSlug: string }> }
) {
  try {
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const { courseSlug, trackSlug } = await params;

    const course = await CourseModel.findOne({ slug: courseSlug, isPublished: true }).lean();
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    const currentTrack = await TrackModel.findOne({ slug: trackSlug, courseId: course._id, isPublished: true }).lean();
    if (!currentTrack) {
       return NextResponse.json({ success: false, error: "Track not found" }, { status: 404 });
    }

    // Security: Check Enrollment and Mastery Prerequisite
    const progress = await ProgressModel.findOne({
      userId: context.user._id,
      courseId: course._id,
    }).lean();

    if (!progress) {
       return NextResponse.json({ success: false, error: "Not enrolled in this course" }, { status: 403 });
    }

    const completedTrackIds = progress.completedTracks.map(id => id.toString());
    const completedLevels = progress.completedLevels || [];
    const isAdmin = context.role === "admin";
    const isCompletedTrack = completedTrackIds.includes(currentTrack._id.toString());
    const isCurrentTrack = progress.currentTrackId?.toString() === currentTrack._id.toString();

    const difficultyIndex = DIFFICULTY_ORDER.indexOf(
      currentTrack.difficulty as (typeof DIFFICULTY_ORDER)[number]
    );
    const previousDifficulty =
      difficultyIndex > 0 ? DIFFICULTY_ORDER[difficultyIndex - 1] : null;
    const isDifficultyUnlocked =
      currentTrack.difficulty === "beginner" ||
      (previousDifficulty ? completedLevels.includes(previousDifficulty) : false);

    if (!isAdmin && (!isDifficultyUnlocked || (!isCompletedTrack && !isCurrentTrack))) {
       return NextResponse.json({ success: false, error: "Locked via Prerequisites" }, { status: 403 });
    }

    const questions = await QuestionModel.find({
       trackId: currentTrack._id,
       isPublished: true
    }).sort({ order: 1 }).select("-__v").lean();

    const completedQuestionIds = progress.completedQuestions.map(id => id.toString());
    const highestCompletedOrder = questions.reduce((highest, question) => {
      return completedQuestionIds.includes(question._id.toString())
        ? Math.max(highest, question.order)
        : highest;
    }, 0);
    const visibleQuestionLimit = isCompletedTrack ? questions.length : highestCompletedOrder + 1;
    const secureQuestions = questions
      .filter((question) => isAdmin || question.order <= visibleQuestionLimit)
      .map((question) => sanitizeQuestionForRole(question as unknown as Record<string, unknown>, context.role));

    return NextResponse.json({ 
      success: true, 
      data: {
        track: {
           _id: currentTrack._id,
           title: currentTrack.title,
           passingScore: currentTrack.passingScore,
        },
        currentQuestionOrder: Math.min(visibleQuestionLimit, questions.length),
        questions: secureQuestions
      } 
    });
  } catch (error: unknown) {
    const routeError = getRouteError(error);
    return NextResponse.json({ success: false, error: routeError.message }, { status: routeError.status || 500 });
  }
}
