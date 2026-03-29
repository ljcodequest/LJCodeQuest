import { NextResponse } from "next/server";
import { requireRegisteredUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { CourseModel, TrackModel, QuestionModel, ProgressModel } from "@/models";

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

    const previousTracks = await TrackModel.find({ 
       courseId: course._id, 
       isPublished: true,
       order: { $lt: currentTrack.order }
    }).select("_id").lean();

    const previousTrackIds = previousTracks.map(t => t._id.toString());
    const completedTrackIds = progress.completedTracks.map(id => id.toString());

    if (!previousTrackIds.every(id => completedTrackIds.includes(id))) {
       return NextResponse.json({ success: false, error: "Locked via Prerequisites" }, { status: 403 });
    }

    // Fetch the track's questions
    // Wait, the Track model has a `questions` array. We can populate it, or sort it via QuestionModel's Order.
    const questions = await QuestionModel.find({
       trackId: currentTrack._id,
       isPublished: true
    }).sort({ order: 1 }).select("-__v").lean();

    // Remove the `isCorrect` flag from options before sending to the client to prevent cheating!
    const secureQuestions = questions.map((q: any) => {
       if (q.options) {
          q.options = q.options.map((opt: any) => {
             const { isCorrect, ...rest } = opt; // Strips out the answer key
             return rest;
          });
       }
       return q;
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        track: {
           _id: currentTrack._id,
           title: currentTrack.title,
           passingScore: currentTrack.passingScore,
        },
        questions: secureQuestions
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
