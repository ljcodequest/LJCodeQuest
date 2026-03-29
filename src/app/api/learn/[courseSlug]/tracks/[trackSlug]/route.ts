import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, ApiRouteError } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel, ProgressModel, QuestionModel } from "@/models";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string; trackSlug: string }> }
) {
  try {
    const { courseSlug, trackSlug } = await params;
    const context = await requireRegisteredUser(request);
    await dbConnect();
    
    const course = await CourseModel.findOne({ slug: courseSlug, isPublished: true }).lean();
    if (!course) {
      throw new ApiRouteError(404, "NOT_FOUND", "Course not found");
    }

    const progress = await ProgressModel.findOne({
      userId: context.user._id,
      courseId: course._id,
    }).lean();

    if (!progress) {
       throw new ApiRouteError(403, "NOT_ENROLLED", "Not enrolled in this course");
    }

    const track = await TrackModel.findOne({ slug: trackSlug, courseId: course._id, isPublished: true }).lean();
    
    if (!track) {
       throw new ApiRouteError(404, "NOT_FOUND", "Track not found");
    }

    // Role bypass
    const isAdminOrInstructor = context.role === "admin" || context.role === "instructor";
    
    let isCompletedTrack = false;
    let isCurrentTrack = false;

    if (isAdminOrInstructor) {
       isCompletedTrack = true;
       isCurrentTrack = true;
    } else {
       isCompletedTrack = progress.completedTracks.some(id => id.toString() === track._id.toString());
       isCurrentTrack = progress.currentTrackId?.toString() === track._id.toString();

       if (!isCompletedTrack && !isCurrentTrack) {
          throw new ApiRouteError(403, "LOCKED", "This track is locked. Complete previous tracks first.");
       }
    }

    // Next Track Logic
    let nextTrackSlug = null;
    const nextTrackInDifficulty = await TrackModel.findOne({
       courseId: course._id,
       difficulty: track.difficulty,
       isPublished: true,
       order: { $gt: track.order }
    }).sort({ order: 1 }).select("slug").lean();

    if (nextTrackInDifficulty) {
       nextTrackSlug = nextTrackInDifficulty.slug;
    } else {
       const currentDiffIdx = DIFFICULTY_ORDER.indexOf(track.difficulty as any);
       const nextDiff = currentDiffIdx >= 0 && currentDiffIdx < 2 ? DIFFICULTY_ORDER[currentDiffIdx + 1] : null;
       if (nextDiff) {
          const nextLevelTrack = await TrackModel.findOne({
             courseId: course._id,
             difficulty: nextDiff,
             isPublished: true,
             order: 1
          }).lean();
          if (nextLevelTrack) {
             nextTrackSlug = nextLevelTrack.slug;
          }
       }
    }

    // Question counts
    const totalQuestions = track.totalQuestions || 0;
    const currentQuestionOrder = progress.currentTrackId?.toString() === track._id.toString() 
      ? (progress.currentTrackProgress?.currentQuestionOrder || 1)
      : (isCompletedTrack ? totalQuestions + 1 : 1);
    
    // completed questions count for this track specifically
    const completedInThisTrack = isCompletedTrack ? totalQuestions : Math.max(0, currentQuestionOrder - 1);

    return apiSuccess({
      course: { title: course.title, slug: course.slug },
      track,
      isCompleted: isCompletedTrack,
      currentQuestionOrder,
      completedQuestionsCount: completedInThisTrack,
      percentComplete: progress.percentComplete,
      nextTrackSlug
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
