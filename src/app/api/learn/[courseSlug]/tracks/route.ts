import { NextRequest } from "next/server";
import { apiSuccess, handleRouteError, ApiRouteError } from "@/lib/api";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel, ProgressModel } from "@/models";

const DIFFICULTY_ORDER = ["beginner", "intermediate", "advanced"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const { courseSlug } = await params;
    const context = await requireRegisteredUser(request);
    await dbConnect();

    const course = await CourseModel.findOne({ slug: courseSlug, isPublished: true }).lean();
    if (!course) {
      throw new ApiRouteError(404, "NOT_FOUND", "Course not found");
    }

    const progress = await ProgressModel.findOne({ userId: context.user._id, courseId: course._id }).lean();
    if (!progress) {
       throw new ApiRouteError(403, "NOT_ENROLLED", "Not enrolled in this course");
    }

    const tracks = await TrackModel.find({ courseId: course._id, isPublished: true }).sort({ difficulty: 1, order: 1 }).lean();

    const isAdminOrInstructor = context.role === "admin" || context.role === "instructor";
    
    const completedTracks = progress.completedTracks.map(id => id.toString());
    const completedLevels = progress.completedLevels || [];

    const levels = DIFFICULTY_ORDER.map(difficulty => {
       const tracksInLevel = tracks.filter(t => t.difficulty === difficulty);
       
       let levelStatus: "locked" | "in-progress" | "completed" = "locked";

       if (isAdminOrInstructor) {
          levelStatus = "in-progress"; // simplified for admin access
       } else if (completedLevels.includes(difficulty)) {
          levelStatus = "completed";
       } else {
          // If not completed, is it unlocked?
          // It's unlocked if it's "beginner", OR if the previous level is in completedLevels.
          const diffIdx = DIFFICULTY_ORDER.indexOf(difficulty);
          if (diffIdx === 0 || completedLevels.includes(DIFFICULTY_ORDER[diffIdx - 1])) {
             levelStatus = "in-progress";
          }
       }

       const mappedTracks = tracksInLevel.map(track => {
          let trackStatus: "locked" | "in-progress" | "completed" = "locked";
          const trackIdStr = track._id.toString();

          if (isAdminOrInstructor) {
             trackStatus = "in-progress";
          } else if (completedTracks.includes(trackIdStr)) {
             trackStatus = "completed";
          } else if (levelStatus === "in-progress" || levelStatus === "completed") {
             // If level is unlocked, is this track unlocked?
             // It's unlocked if order is 1, OR if the previous track (order-1) is completed.
             if (track.order === 1) {
                trackStatus = "in-progress";
             } else {
                const prevTrack = tracksInLevel.find(t => t.order === track.order - 1);
                if (prevTrack && completedTracks.includes(prevTrack._id.toString())) {
                   trackStatus = "in-progress";
                }
             }
          }

          // Compute questions count explicitly for UI
          let completedQuestions = 0;
          if (trackStatus === "completed") {
            completedQuestions = track.totalQuestions;
          } else if (trackStatus === "in-progress" && progress.currentTrackId?.toString() === trackIdStr) {
            completedQuestions = Math.max(0, (progress.currentTrackProgress?.currentQuestionOrder || 1) - 1);
          }

          return {
             _id: track._id,
             title: track.title,
             slug: track.slug,
             order: track.order,
             status: trackStatus,
             totalQuestions: track.totalQuestions,
             completedQuestions
          };
       });

       return {
          difficulty,
          status: levelStatus,
          tracks: mappedTracks
       };
    });

    return apiSuccess({
       course: {
          _id: course._id,
          title: course.title,
          slug: course.slug
       },
       levels,
       percentComplete: progress.percentComplete,
       completedLevels
    });

  } catch (error) {
    return handleRouteError(error);
  }
}
