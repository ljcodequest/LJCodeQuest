import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, ApiRouteError } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel, ProgressModel, QuestionModel } from "@/models";
import { sanitizeQuestionForRole } from "@/lib/question-visibility";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string; trackSlug: string }> }
) {
  try {
    const { courseSlug, trackSlug } = await params;
    const context = await requireRegisteredUser(request);
    await dbConnect();

    const course = await CourseModel.findOne({ slug: courseSlug, isPublished: true }).lean();
    if (!course) throw new ApiRouteError(404, "NOT_FOUND", "Course not found.");

    const track = await TrackModel.findOne({ slug: trackSlug, courseId: course._id, isPublished: true }).lean();
    if (!track) throw new ApiRouteError(404, "NOT_FOUND", "Track not found.");

    const progress = await ProgressModel.findOne({ userId: context.user._id, courseId: course._id }).lean();
    if (!progress) throw new ApiRouteError(403, "NOT_ENROLLED", "Not enrolled in this course.");

    const isAdminOrInstructor = context.role === "admin" || context.role === "instructor";

    if (!isAdminOrInstructor) {
      const isCompletedTrack = progress.completedTracks.some(id => id.toString() === track._id.toString());
      const isCurrentTrack = progress.currentTrackId?.toString() === track._id.toString();

      if (!isCompletedTrack && !isCurrentTrack) {
        throw new ApiRouteError(403, "LOCKED", "This track is currently locked.");
      }
    }

    const questions = await QuestionModel.find({ trackId: track._id, isPublished: true }).sort({ order: 1 }).lean();
    
    // Find first incomplete question
    const completedQuestionStrs = progress.completedQuestions.map(q => q.toString());
    const currentQuestion = questions.find(q => !completedQuestionStrs.includes(q._id.toString()));

    if (!currentQuestion) {
      return apiSuccess({
        question: null,
        questionNumber: questions.length + 1,
        totalQuestions: questions.length,
        allCompleted: true,
      });
    }

    // Attempted status
    const previouslyAttempted = false; // We could ping SubmissionModel for this if needed

    // Sanitize for student
    const sanitizedQuestion = sanitizeQuestionForRole(currentQuestion as any, context.role);

    return apiSuccess({
      question: sanitizedQuestion,
      questionNumber: currentQuestion.order,
      totalQuestions: questions.length,
      allCompleted: false,
      previouslyAttempted,
      previousAttempts: 0
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
